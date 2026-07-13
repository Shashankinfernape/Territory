from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from bson import ObjectId
from database import get_db
from .auth import get_current_admin
from firebase_admin import auth

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/stats", response_model=Dict[str, Any])
async def get_platform_stats(db=Depends(get_db), current_admin=Depends(get_current_admin)):
    total_users = await db.users.count_documents({})
    total_properties = await db.properties.count_documents({})
    active_properties = await db.properties.count_documents({"status": "ACTIVE"})
    pending_properties = await db.properties.count_documents({"status": "PENDING_VERIFICATION"})
    total_transactions = await db.transactions.count_documents({})
    pending_sellers = await db.users.count_documents({"role": "USER", "kyc_details.status": "PENDING"})

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
        "pending_sellers": pending_sellers,
        "total_transactions": total_transactions,
        "total_revenue": total_revenue,
    }


@router.get("/users", response_model=List[Dict[str, Any]])
async def get_all_users(db=Depends(get_db), current_admin=Depends(get_current_admin)):
    users = []
    cursor = db.users.find({})
    async for document in cursor:
        users.append({
            "id": str(document["_id"]),
            "phone_number": document["phone_number"],
            "role": document["role"],
            "full_name": document.get("full_name"),
            "kyc_details": document.get("kyc_details"),
            "created_at": document.get("created_at"),
        })
    return users


@router.get("/properties", response_model=List[Dict[str, Any]])
async def get_all_properties(db=Depends(get_db), current_admin=Depends(get_current_admin)):
    properties = []
    cursor = db.properties.find({})
    async for document in cursor:
        properties.append({
            "id": str(document["_id"]),
            "seller_id": document["seller_id"],
            "city": document["city"],
            "district": document.get("district", ""),
            "type": document.get("type", ""),
            "price": document.get("price", 0),
            "area": document.get("area", 0),
            "area_unit": document.get("area_unit", ""),
            "status": document["status"],
            "view_count": document.get("view_count", 0),
            "created_at": document.get("created_at"),
            "documents": document.get("documents", []),
        })
    return properties


@router.get("/transactions", response_model=List[Dict[str, Any]])
async def get_all_transactions(db=Depends(get_db), current_admin=Depends(get_current_admin)):
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

    result = await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")

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
    current_admin=Depends(get_current_admin)
):
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.get("role") == "SELLER" and user.get("kyc_details", {}).get("status") == "APPROVED":
        return {"message": "User is already an approved seller"}

    # Update role to SELLER and status to APPROVED
    result = await db.users.update_one(
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
    result = await db.users.delete_one({"_id": user_id})
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
