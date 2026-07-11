from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
from datetime import datetime
from database import get_db
from .auth import get_current_user
from .properties import _doc_to_response
from models import PropertyResponse
from bson import ObjectId
import os

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


class UnlockRequest(BaseModel):
    property_id: str


def _require_buyer(current_user: dict):
    if current_user["role"] not in ("BUYER", "USER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Only buyers can access this endpoint")


async def _get_transaction(db, buyer_id: str, property_id: str):
    """Return transaction doc or None."""
    return await db.transactions.find_one({
        "buyer_id": buyer_id,
        "property_id": property_id,
    })


@router.post("/mock-unlock")
async def mock_unlock_property(
    req: UnlockRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    _require_buyer(current_user)

    property_id = req.property_id
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")

    # Verify property exists and is ACTIVE
    prop = await db.properties.find_one({"_id": ObjectId(property_id), "status": "ACTIVE"})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found or not available")

    buyer_id = str(current_user["_id"])

    # Check if already unlocked
    existing = await _get_transaction(db, buyer_id, property_id)
    
    # Resolve seller details
    seller = await db.users.find_one({"_id": prop["seller_id"]})
    owner_name = seller.get("full_name", "Landowner") if seller else "Landowner"
    owner_phone = seller.get("phone_number", "+91 XXXXX XXXXX") if seller else "+91 XXXXX XXXXX"

    if existing:
        return {
            "message": "Already unlocked",
            "owner_name": owner_name,
            "owner_phone": owner_phone
        }

    # Create transaction
    await db.transactions.insert_one({
        "buyer_id": buyer_id,
        "property_id": property_id,
        "amount": 500,
        "status": "SUCCESS",
        "created_at": datetime.utcnow(),
    })

    return {
        "message": "Payment successful, property unlocked",
        "owner_name": owner_name,
        "owner_phone": owner_phone
    }


@router.get("/check-unlock/{property_id}")
async def check_unlock_status(
    property_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Check whether the current buyer has unlocked a specific property."""
    _require_buyer(current_user)

    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")

    tx = await _get_transaction(db, str(current_user["_id"]), property_id)
    if tx:
        prop = await db.properties.find_one({"_id": ObjectId(property_id)})
        owner_name = "Landowner"
        owner_phone = "+91 XXXXX XXXXX"
        if prop:
            seller = await db.users.find_one({"_id": prop["seller_id"]})
            if seller:
                owner_name = seller.get("full_name", "Landowner")
                owner_phone = seller.get("phone_number", "+91 XXXXX XXXXX")
        return {
            "unlocked": True,
            "owner_name": owner_name,
            "owner_phone": owner_phone
        }
    return {"unlocked": False}


@router.get("/document/{property_id}/{doc_index}")
async def get_document(
    property_id: str,
    doc_index: int,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Server-side gated document access.
    Returns the document file ONLY if the buyer has an active unlock transaction.
    Admins and the property's seller can also access documents.
    """
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")

    # Fetch property
    prop = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    role = current_user["role"]
    user_id = str(current_user["_id"])

    # Access control
    if role == "ADMIN":
        pass
    elif role == "USER":
        is_seller = (prop["seller_id"] == user_id)
        if not is_seller:
            tx = await _get_transaction(db, user_id, property_id)
            if not tx:
                raise HTTPException(
                    status_code=403,
                    detail="You must unlock this property before viewing its documents.",
                )
    elif role == "BUYER":
        tx = await _get_transaction(db, user_id, property_id)
        if not tx:
            raise HTTPException(
                status_code=403,
                detail="You must unlock this property before viewing its documents.",
            )
    elif role == "SELLER":
        if prop["seller_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not your property")
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    documents = prop.get("documents", [])
    if doc_index < 0 or doc_index >= len(documents):
        raise HTTPException(status_code=404, detail="Document not found")

    import mimetypes
    doc = documents[doc_index]
    # doc["url"] is like "/uploads/documents/abc123.pdf"
    # Strip leading slash and build a path relative to the backend working dir
    relative_path = doc["url"].lstrip("/")
    if not os.path.exists(relative_path):
        raise HTTPException(status_code=404, detail="Document file not found on server")

    mime_type, _ = mimetypes.guess_type(relative_path)
    if not mime_type:
        mime_type = "application/octet-stream"

    return FileResponse(
        path=relative_path,
        filename=f"{doc.get('type', 'document')}_{doc_index}",
        media_type=mime_type,
    )


@router.get("/unlocked-properties", response_model=List[PropertyResponse])
async def get_unlocked_properties(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    _require_buyer(current_user)

    # Find all transactions for this buyer
    transactions = db.transactions.find({"buyer_id": str(current_user["_id"])})
    property_ids = []
    async for tx in transactions:
        try:
            property_ids.append(ObjectId(tx["property_id"]))
        except Exception:
            pass

    # Fetch those properties
    properties = []
    if property_ids:
        cursor = db.properties.find({"_id": {"$in": property_ids}})
        async for document in cursor:
            properties.append(_doc_to_response(document))
    return properties
