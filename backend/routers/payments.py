from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List
from datetime import datetime
from database import get_db, get_auth_db
from .auth import get_current_user
from .properties import _doc_to_response
from models import PropertyResponse
from bson import ObjectId
import os
import base64

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


class UnlockRequest(BaseModel):
    property_id: str


class SubmitPaymentRequest(BaseModel):
    property_id: str
    transaction_id: str
    payment_method: str


def _require_buyer(current_user: dict):
    if current_user["role"] not in ("BUYER", "USER", "ADMIN", "SELLER"):
        raise HTTPException(status_code=403, detail="Only buyers can access this endpoint")


async def _get_transaction(db, buyer_id: str, property_id: str):
    """Return SUCCESSful transaction doc or None."""
    return await db.transactions.find_one({
        "buyer_id": buyer_id,
        "property_id": property_id,
        "status": "SUCCESS"
    })


@router.post("/mock-unlock")
async def mock_unlock_property(
    req: UnlockRequest,
    db=Depends(get_db), auth_db=Depends(get_auth_db),
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
    if prop["seller_id"] == buyer_id:
        raise HTTPException(status_code=400, detail="You cannot buy your own property")

    # Check if already unlocked
    existing = await _get_transaction(db, buyer_id, property_id)
    
    # Resolve seller details
    seller = await auth_db.users.find_one({"_id": prop["seller_id"]})
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


@router.post("/submit-payment")
async def submit_payment(
    req: SubmitPaymentRequest,
    db=Depends(get_db), auth_db=Depends(get_auth_db),
    current_user=Depends(get_current_user),
):
    _require_buyer(current_user)

    property_id = req.property_id
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")

    # Verify property exists
    prop = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    buyer_id = str(current_user["_id"])
    if prop["seller_id"] == buyer_id:
        raise HTTPException(status_code=400, detail="You cannot buy your own property")
    buyer_email = current_user.get("email", "unknown@propit.com")
    buyer_name = current_user.get("full_name", "Buyer")

    # Resolve seller details
    seller = await auth_db.users.find_one({"_id": prop["seller_id"]})
    seller_email = seller.get("email", "unknown@propit.com") if seller else "unknown@propit.com"
    seller_name = seller.get("full_name", "Landowner") if seller else "Landowner"

    prop_details = {
        "city": prop.get("city"),
        "state": prop.get("state"),
        "district": prop.get("district"),
        "area": prop.get("area"),
        "area_unit": prop.get("area_unit"),
        "price": prop.get("price")
    }

    # Upsert transaction (status is PENDING)
    await db.transactions.update_one(
        {"buyer_id": buyer_id, "property_id": property_id},
        {
            "$set": {
                "buyer_email": buyer_email,
                "buyer_name": buyer_name,
                "owner_id": prop["seller_id"],
                "owner_email": seller_email,
                "owner_name": seller_name,
                "transaction_id": req.transaction_id,
                "payment_method": req.payment_method,
                "amount": 500,
                "status": "PENDING",
                "property_details": prop_details,
                "created_at": datetime.utcnow()
            }
        },
        upsert=True
    )

    return {"message": "Payment details submitted successfully and are pending review."}


@router.get("/check-unlock/{property_id}")
async def check_unlock_status(
    property_id: str,
    db=Depends(get_db), auth_db=Depends(get_auth_db),
    current_user=Depends(get_current_user),
):
    """Check whether the current buyer has unlocked a specific property."""
    _require_buyer(current_user)

    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")

    buyer_id = str(current_user["_id"])

    # If user is admin, they always have access
    if current_user["role"] == "ADMIN":
        prop = await db.properties.find_one({"_id": ObjectId(property_id)})
        owner_name = "Landowner"
        owner_phone = "+91 XXXXX XXXXX"
        if prop:
            seller = await auth_db.users.find_one({"_id": prop["seller_id"]})
            if seller:
                owner_name = seller.get("full_name", "Landowner")
                owner_phone = seller.get("phone_number", "+91 XXXXX XXXXX")
        return {
            "unlocked": True,
            "status": "SUCCESS",
            "owner_name": owner_name,
            "owner_phone": owner_phone
        }

    # Check for any transaction
    tx = await db.transactions.find_one({"buyer_id": buyer_id, "property_id": property_id})
    if tx:
        status = tx.get("status", "SUCCESS")
        if status == "SUCCESS":
            prop = await db.properties.find_one({"_id": ObjectId(property_id)})
            owner_name = "Landowner"
            owner_phone = "+91 XXXXX XXXXX"
            if prop:
                seller = await auth_db.users.find_one({"_id": prop["seller_id"]})
                if seller:
                    owner_name = seller.get("full_name", "Landowner")
                    owner_phone = seller.get("phone_number", "+91 XXXXX XXXXX")
            return {
                "unlocked": True,
                "status": "SUCCESS",
                "owner_name": owner_name,
                "owner_phone": owner_phone
            }
        else:
            return {
                "unlocked": False,
                "status": status,
                "message": "Payment pending admin verification"
            }

    return {"unlocked": False, "status": "NONE"}


@router.get("/document/{property_id}/{doc_index}")
async def get_document(
    property_id: str,
    doc_index: int,
    db=Depends(get_db), auth_db=Depends(get_auth_db),
    current_user=Depends(get_current_user),
):
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")

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
        is_seller = (prop["seller_id"] == user_id)
        if not is_seller:
            tx = await _get_transaction(db, user_id, property_id)
            if not tx:
                raise HTTPException(
                    status_code=403,
                    detail="You must unlock this property before viewing its documents.",
                )
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    documents = prop.get("documents", [])
    if doc_index < 0 or doc_index >= len(documents):
        raise HTTPException(status_code=404, detail="Document not found")

    import mimetypes
    doc = documents[doc_index]
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
    db=Depends(get_db), auth_db=Depends(get_auth_db),
    current_user=Depends(get_current_user),
):
    _require_buyer(current_user)

    transactions = db.transactions.find({"buyer_id": str(current_user["_id"]), "status": "SUCCESS"})
    property_ids = []
    async for tx in transactions:
        try:
            property_ids.append(ObjectId(tx["property_id"]))
        except Exception:
            pass

    properties = []
    if property_ids:
        cursor = db.properties.find({"_id": {"$in": property_ids}})
        async for document in cursor:
            properties.append(_doc_to_response(document))
    return properties


@router.get("/purchased-properties")
async def get_purchased_properties(
    db=Depends(get_db), auth_db=Depends(get_auth_db),
    current_user=Depends(get_current_user),
):
    _require_buyer(current_user)

    buyer_id = str(current_user["_id"])
    cursor = db.transactions.find({"buyer_id": buyer_id})
    transactions = await cursor.to_list(length=100)
    
    property_ids = []
    tx_map = {}
    for tx in transactions:
        try:
            pid_str = tx["property_id"]
            property_ids.append(ObjectId(pid_str))
            tx_map[pid_str] = {
                "status": tx.get("status", "PENDING"),
                "transaction_id": tx.get("transaction_id"),
                "payment_method": tx.get("payment_method")
            }
        except Exception:
            pass

    results = []
    if property_ids:
        cursor_props = db.properties.find({"_id": {"$in": property_ids}})
        async for doc in cursor_props:
            prop_res = _doc_to_response(doc)
            pid_str = prop_res.id
            results.append({
                "property": prop_res,
                "status": tx_map[pid_str]["status"],
                "transaction_id": tx_map[pid_str]["transaction_id"],
                "payment_method": tx_map[pid_str]["payment_method"]
            })
            
    return results


# Admin endpoints
@router.get("/admin/pending")
async def get_pending_payments(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    
    cursor = db.transactions.find({"status": "PENDING"})
    txs = []
    async for tx in cursor:
        tx["_id"] = str(tx["_id"])
        txs.append(tx)
    return txs


@router.post("/admin/approve/{tx_id}")
async def approve_payment(
    tx_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")
        
    if not ObjectId.is_valid(tx_id):
        raise HTTPException(status_code=400, detail="Invalid transaction ID")
        
    res = await db.transactions.update_one(
        {"_id": ObjectId(tx_id)},
        {"$set": {"status": "SUCCESS"}}
    )
    
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    return {"message": "Transaction approved successfully."}


@router.post("/admin/reject/{tx_id}")
async def reject_payment(
    tx_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")
        
    if not ObjectId.is_valid(tx_id):
        raise HTTPException(status_code=400, detail="Invalid transaction ID")
        
    res = await db.transactions.update_one(
        {"_id": ObjectId(tx_id)},
        {"$set": {"status": "REJECTED"}}
    )
    
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    return {"message": "Transaction rejected successfully."}


@router.get("/qr-code")
async def get_qr_code(auth_db=Depends(get_auth_db)):
    """Serve the current payment QR code image — reads from MongoDB."""
    doc = await auth_db.settings.find_one({"_id": "payment_qr"})
    if not doc or not doc.get("image_b64"):
        raise HTTPException(status_code=404, detail="QR code not found. Please upload one in the admin panel.")
    image_bytes = base64.b64decode(doc["image_b64"])
    content_type = doc.get("content_type", "image/jpeg")
    return Response(content=image_bytes, media_type=content_type)


@router.post("/admin/update-qr")
async def update_qr_code(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    auth_db=Depends(get_auth_db),
):
    """Admin-only: replace the payment QR code image — stored in MongoDB."""
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    content_type = file.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are accepted")

    image_bytes = await file.read()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    await auth_db.settings.update_one(
        {"_id": "payment_qr"},
        {"$set": {
            "image_b64": image_b64,
            "content_type": content_type,
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )

    return {"message": "QR code updated successfully and stored in database."}
