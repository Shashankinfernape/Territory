from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from bson import ObjectId
from database import get_db, get_auth_db
from .auth import get_current_admin
from datetime import datetime
from firebase_admin import auth

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/stats", response_model=Dict[str, Any])
async def get_platform_stats(db=Depends(get_db), auth_db=Depends(get_auth_db), current_admin=Depends(get_current_admin)):
    total_users = await auth_db.users.count_documents({})
    total_properties = await db.properties.count_documents({})
    active_properties = await db.properties.count_documents({"status": "ACTIVE"})
    pending_properties = await db.properties.count_documents({"status": "PENDING_VERIFICATION", "is_edit_pending": {"$ne": True}})
    pending_edits = await db.properties.count_documents({"status": "PENDING_VERIFICATION", "is_edit_pending": True})
    pending_delete_requests = await db.properties.count_documents({"status": "DELETE_REQUESTED"})
    total_transactions = await db.transactions.count_documents({})
    
    pending_sellers_kyc = await auth_db.users.count_documents({"role": "USER", "kyc_details.status": "PENDING"})
    pending_questions = await auth_db.questions.count_documents({"status": "PENDING"})

    # Aggregate total revenue from all successful transactions.
    revenue_pipeline = [
        {"$match": {"status": "SUCCESS"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    revenue_result = await db.transactions.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0

    return {
        "total_users": total_users,
        "total_properties": total_properties,
        "active_properties": active_properties,
        "pending_properties": pending_properties,
        "pending_edits": pending_edits,
        "pending_delete_requests": pending_delete_requests,
        "pending_sellers": pending_sellers_kyc,
        "pending_questions": pending_questions,
        "total_transactions": total_transactions,
        "total_revenue": total_revenue,
    }


@router.get("/users", response_model=List[Dict[str, Any]])
async def get_all_users(db=Depends(get_db), auth_db=Depends(get_auth_db), current_admin=Depends(get_current_admin)):
    users = []
    cursor = auth_db.users.find({})
    async for document in cursor:
        users.append({
            "id": str(document["_id"]),
            "email": document.get("email"),
            "phone_number": document.get("phone_number"),
            "role": document["role"],
            "full_name": document.get("full_name"),
            "kyc_details": document.get("kyc_details"),
            "created_at": document.get("created_at"),
        })
    return users


@router.get("/properties", response_model=List[Dict[str, Any]])
async def get_all_properties(db=Depends(get_db), auth_db=Depends(get_auth_db), current_admin=Depends(get_current_admin)):
    properties = []
    cursor = db.properties.find({})
    async for document in cursor:
        doc = {k: v for k, v in document.items() if k != "_id"}
        doc["id"] = str(document["_id"])
        properties.append(doc)
    return properties


@router.get("/transactions", response_model=List[Dict[str, Any]])
async def get_all_transactions(db=Depends(get_db), auth_db=Depends(get_auth_db), current_admin=Depends(get_current_admin)):
    pipeline = [
        {"$sort": {"created_at": -1}},
        {
            "$lookup": {
                "from": "users",
                "let": {"buyer_id_str": "$buyer_id"},
                "pipeline": [
                    {"$addFields": {"id_str": {"$toString": "$_id"}}},
                    {"$match": {"$expr": {"$eq": ["$id_str", "$$buyer_id_str"]}}},
                ],
                "as": "buyer_info",
            }
        },
        {
            "$lookup": {
                "from": "properties",
                "let": {"prop_id_str": "$property_id"},
                "pipeline": [
                    {"$addFields": {"id_str": {"$toString": "$_id"}}},
                    {"$match": {"$expr": {"$eq": ["$id_str", "$$prop_id_str"]}}},
                ],
                "as": "property_info",
            }
        },
        {
            "$lookup": {
                "from": "users",
                "let": {"seller_id_str": {"$arrayElemAt": ["$property_info.seller_id", 0]}},
                "pipeline": [
                    {"$addFields": {"id_str": {"$toString": "$_id"}}},
                    {"$match": {"$expr": {"$eq": ["$id_str", "$$seller_id_str"]}}},
                ],
                "as": "seller_info",
            }
        }
    ]

    results = []
    async for doc in db.transactions.aggregate(pipeline):
        buyer = doc["buyer_info"][0] if doc.get("buyer_info") else {}
        prop = doc["property_info"][0] if doc.get("property_info") else {}
        seller = doc["seller_info"][0] if doc.get("seller_info") else {}
        results.append({
            "id": str(doc["_id"]),
            "buyer_id": doc["buyer_id"],
            "buyer_phone": buyer.get("phone_number", "Unknown"),
            "buyer_name": buyer.get("full_name") or "Unknown",
            "property_id": doc["property_id"],
            "property_city": prop.get("city", "Unknown"),
            "property_district": prop.get("district", ""),
            "property_type": prop.get("type", ""),
            "seller_id": prop.get("seller_id", "Unknown"),
            "seller_phone": seller.get("phone_number", "Unknown"),
            "seller_name": seller.get("full_name") or "Unknown",
            "amount": doc.get("amount", 0),
            "status": doc.get("status", ""),
            "created_at": doc.get("created_at"),
        })
    return results


@router.put("/properties/{property_id}/verify")
async def verify_property(
    property_id: str,
    body: Dict[str, Any],
    db=Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    status = body.get("status")
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    if status not in ["ACTIVE", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be ACTIVE or REJECTED.")

    existing = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")

    rejection_message = body.get("rejection_message")
    rejection_info = None

    if status == "REJECTED" and rejection_message:
        if existing.get("is_edit_pending") and "original_details" in existing:
            # Edit rejection: list changes that were proposed but rejected
            original = existing["original_details"]
            rejected_details = {}
            for field in [
                "city", "district", "state", "area", "area_unit", "price", "type", 
                "keywords", "description", "documents", "images", "soil_type", 
                "water_source", "road_access", "fencing", "electricity", "irrigation", 
                "nearby_town", "distance_from_town_km", "taluk"
            ]:
                curr = existing.get(field)
                orig = original.get(field)
                if curr != orig:
                    rejected_details[field] = curr
            
            rejection_info = {
                "message": rejection_message,
                "type": "EDIT_REJECTION",
                "timestamp": datetime.utcnow().isoformat(),
                "rejected_details": rejected_details
            }
        else:
            # New property listing rejection
            rejection_info = {
                "message": rejection_message,
                "type": "NEW_PROPERTY_REJECTION",
                "timestamp": datetime.utcnow().isoformat()
            }

    if existing.get("is_edit_pending") and "original_details" in existing:
        if status == "ACTIVE":
            # Approved: keep the edits, clear the backup, clear rejection_info
            await db.properties.update_one(
                {"_id": ObjectId(property_id)},
                {"$set": {"status": "ACTIVE", "is_edit_pending": False}, "$unset": {"original_details": "", "rejection_info": ""}}
            )
        else:
            # Rejected: restore the backup, clear the backup, set rejection_info
            original = existing["original_details"]
            restore_fields = {**original, "status": "ACTIVE", "is_edit_pending": False}
            if rejection_info:
                restore_fields["rejection_info"] = rejection_info
            await db.properties.update_one(
                {"_id": ObjectId(property_id)},
                {"$set": restore_fields, "$unset": {"original_details": ""}}
            )
        return {"message": f"Property edit request processed as {status}"}

    update_set = {"status": status, "is_edit_pending": False}
    unset_op = {}
    if status == "ACTIVE":
        unset_op["rejection_info"] = ""
    elif rejection_info:
        update_set["rejection_info"] = rejection_info

    db_query = {"$set": update_set}
    if unset_op:
        db_query["$unset"] = unset_op

    result = await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        db_query
    )
    return {"message": f"Property marked as {status}"}


@router.put("/properties/{property_id}")
async def edit_property(
    property_id: str,
    property_data: Dict[str, Any],
    db=Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    # Remove non-updatable fields
    update_data = {k: v for k, v in property_data.items() if k not in ["_id", "id", "seller_id", "created_at"]}

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")

    return {"message": "Property updated successfully"}


@router.delete("/properties/{property_id}")
async def delete_property(
    property_id: str,
    db=Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    result = await db.properties.delete_one({"_id": ObjectId(property_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")

    # Also clean up related transactions
    await db.transactions.delete_many({"property_id": property_id})

    return {"message": "Property deleted successfully"}


@router.put("/users/{user_id}/verify-seller")
async def verify_seller(
    user_id: str,
    db=Depends(get_db),
    auth_db=Depends(get_auth_db),
    current_admin=Depends(get_current_admin)
):
    user = await auth_db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.get("role") == "SELLER" and user.get("kyc_details", {}).get("status") == "APPROVED":
        return {"message": "User is already an approved seller"}

    # Update role to SELLER and status to APPROVED
    result = await auth_db.users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "role": "SELLER",
                "kyc_details.status": "APPROVED"
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Failed to update user")
        
    return {"message": "Seller account approved successfully"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db=Depends(get_db),
    auth_db=Depends(get_auth_db),
    current_admin=Depends(get_current_admin)
):
    if str(current_admin["_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    # Delete user from Firebase Authentication
    try:
        auth.delete_user(user_id)
    except Exception as e:
        print(f"Warning: Failed to delete user from Firebase Auth: {e}")

    # Delete user from MongoDB
    result = await auth_db.users.delete_one({"_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    # Cascade: delete their properties and associated transactions
    seller_props = db.properties.find({"seller_id": user_id})
    async for prop in seller_props:
        await db.transactions.delete_many({"property_id": str(prop["_id"])})
    await db.properties.delete_many({"seller_id": user_id})
    # Also remove buyer transactions
    await db.transactions.delete_many({"buyer_id": user_id})

    return {"message": "User and all associated data deleted successfully"}


@router.get("/questions", response_model=List[Dict[str, Any]])
async def get_seller_requests(
    auth_db=Depends(get_auth_db),
    current_admin=Depends(get_current_admin)
):
    questions = []
    cursor = auth_db.questions.find({})
    async for doc in cursor:
        questions.append({
            "id": str(doc["_id"]),
            "user_id": doc["user_id"],
            "email": doc.get("email"),
            "full_name": doc.get("full_name"),
            "phone_number": doc.get("phone_number"),
            "message": doc.get("message"),
            "status": doc.get("status"),
            "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None
        })
    return questions


@router.put("/questions/{question_id}/approve")
async def approve_seller_request(
    question_id: str,
    auth_db=Depends(get_auth_db),
    current_admin=Depends(get_current_admin)
):
    question = await auth_db.questions.find_one({"_id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Promotion request not found")

    user_id = question["user_id"]

    # Update user role to SELLER and set KYC status
    await auth_db.users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "role": "SELLER",
                "kyc_details": {
                    "aadhaar_number": "Google/Gmail Verified",
                    "pan_number": "Google/Gmail Verified",
                    "status": "APPROVED"
                }
            }
        }
    )

    # Update question status to APPROVED
    await auth_db.questions.update_one(
        {"_id": question_id},
        {"$set": {"status": "APPROVED"}}
    )

    return {"message": "Seller promotion request approved successfully"}


@router.put("/questions/{question_id}/reject")
async def reject_seller_request(
    question_id: str,
    auth_db=Depends(get_auth_db),
    current_admin=Depends(get_current_admin)
):
    question = await auth_db.questions.find_one({"_id": question_id})
    if not question:
        raise HTTPException(status_code=404, detail="Promotion request not found")

    # Update question status to REJECTED
    await auth_db.questions.update_one(
        {"_id": question_id},
        {"$set": {"status": "REJECTED"}}
    )

    return {"message": "Seller promotion request rejected successfully"}


# ── DELETE REQUESTS ──────────────────────────────────────────────────────────

@router.get("/delete-requests", response_model=List[Dict[str, Any]])
async def get_delete_requests(
    db=Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    """Return all properties that sellers have requested to be deleted."""
    requests = []
    cursor = db.properties.find({"status": "DELETE_REQUESTED"})
    async for document in cursor:
        requests.append({
            "id": str(document["_id"]),
            "seller_id": document["seller_id"],
            "city": document.get("city", ""),
            "district": document.get("district", ""),
            "state": document.get("state", ""),
            "type": document.get("type", ""),
            "price": document.get("price", 0),
            "area": document.get("area", 0),
            "area_unit": document.get("area_unit", ""),
            "status": document["status"],
            "view_count": document.get("view_count", 0),
            "created_at": document.get("created_at"),
            "documents": document.get("documents", []),
            "images": document.get("images", []),
        })
    return requests


@router.post("/delete-requests/{property_id}/approve")
async def approve_delete_request(
    property_id: str,
    db=Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    """Admin approves a seller's delete request — permanently removes the property."""
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")

    existing = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    if existing.get("status") != "DELETE_REQUESTED":
        raise HTTPException(status_code=400, detail="No pending delete request for this property")

    # Permanently delete the property
    await db.properties.delete_one({"_id": ObjectId(property_id)})
    # Clean up related transactions
    await db.transactions.delete_many({"property_id": property_id})

    return {"message": "Property deleted successfully after admin approval"}


@router.post("/delete-requests/{property_id}/reject")
async def reject_delete_request(
    property_id: str,
    body: Optional[Dict[str, Any]] = None,
    db=Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    """Admin rejects a seller's delete request — property is restored to ACTIVE."""
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")

    existing = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    if existing.get("status") != "DELETE_REQUESTED":
        raise HTTPException(status_code=400, detail="No pending delete request for this property")

    update_set = {"status": "ACTIVE"}
    if body and body.get("rejection_message"):
        update_set["rejection_info"] = {
            "message": body.get("rejection_message"),
            "type": "DELETE_REJECTION",
            "timestamp": datetime.utcnow().isoformat()
        }

    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": update_set, "$unset": {"delete_requested": ""}}
    )
    return {"message": "Delete request rejected. Property restored to ACTIVE."}
