from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any, Optional
from bson import ObjectId
from database import get_db
from .auth import get_current_admin

# Removed dead imports: UserResponse, PropertyResponse (were imported but never used)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/stats", response_model=Dict[str, Any])
async def get_platform_stats(db=Depends(get_db), current_admin=Depends(get_current_admin)):
    total_users = await db.users.count_documents({})
    total_properties = await db.properties.count_documents({})
    total_transactions = await db.transactions.count_documents({})

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
            "status": document["status"],
            "view_count": document.get("view_count", 0),
            "created_at": document.get("created_at"),
            "documents": document.get("documents", []),
        })
    return properties


@router.put("/properties/{property_id}/verify")
async def verify_property(
    property_id: str,
    status: str = Body(..., embed=True),
    db=Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    if status not in ["ACTIVE", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid status")

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
    property_data: dict = Body(...),
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
        
    return {"message": "Property deleted successfully"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db=Depends(get_db),
    current_admin=Depends(get_current_admin)
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    if str(current_admin["_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    # Delete user
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Cascade delete their properties
    await db.properties.delete_many({"seller_id": user_id})
    
    return {"message": "User and associated properties deleted successfully"}
