from fastapi import APIRouter, Depends, HTTPException, Query, Form, UploadFile, File
import os
import shutil
import uuid
from typing import List, Optional, Dict, Any
from database import get_db
from models import PropertyCreate, PropertyInDB, PropertyResponse, PropertyUpdate
from .auth import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/api/v1/properties", tags=["properties"])


def _doc_to_response(document) -> PropertyResponse:
    """Helper to convert a MongoDB document to a PropertyResponse."""
    return PropertyResponse(
        id=str(document["_id"]),
        seller_id=document["seller_id"],
        city=document["city"],
        district=document.get("district", ""),
        state=document.get("state", "Tamil Nadu"),
        area=document["area"],
        area_unit=document["area_unit"],
        price=document["price"],
        type=document["type"],
        keywords=document.get("keywords", []),
        description=document.get("description"),
        documents=document.get("documents", []),
        status=document["status"],
        view_count=document.get("view_count", 0),
        soil_type=document.get("soil_type"),
        water_source=document.get("water_source"),
        road_access=document.get("road_access"),
        fencing=document.get("fencing"),
        electricity=document.get("electricity", False),
        irrigation=document.get("irrigation", False),
        nearby_town=document.get("nearby_town"),
        distance_from_town_km=document.get("distance_from_town_km"),
        images=document.get("images", []),
        taluk=document.get("taluk", ""),
        is_edit_pending=document.get("is_edit_pending", False),
        original_details=document.get("original_details"),
        rejection_info=document.get("rejection_info"),
    )


@router.get("/", response_model=List[PropertyResponse])
async def get_properties(
    type: Optional[str] = Query(None, description="Filter by land type"),
    city: Optional[str] = Query(None, description="Filter by city"),
    district: Optional[str] = Query(None, description="Filter by district"),
    taluk: Optional[str] = Query(None, description="Filter by taluk"),
    min_area: Optional[float] = Query(None, description="Minimum area"),
    max_area: Optional[float] = Query(None, description="Maximum area"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    water_source: Optional[str] = Query(None, description="Filter by water source"),
    road_access: Optional[str] = Query(None, description="Filter by road access"),
    soil_type: Optional[str] = Query(None, description="Filter by soil type"),
    electricity: Optional[bool] = Query(None, description="Filter by electricity"),
    irrigation: Optional[bool] = Query(None, description="Filter by irrigation"),
    search: Optional[str] = Query(None, description="Free text search"),
    db=Depends(get_db),
):
    if search:
        # Keyword search includes SOLD_OUT so buyers can find sold properties by keyword/location.
        # PENDING_VERIFICATION and REJECTED are still excluded from public search.
        query = {
            "status": {"$in": ["ACTIVE", "SOLD_OUT", "DELETE_REQUESTED"]},
            "$or": [
                {"city": {"$regex": search, "$options": "i"}},
                {"district": {"$regex": search, "$options": "i"}},
                {"taluk": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"keywords": {"$elemMatch": {"$regex": search, "$options": "i"}}},
                {"nearby_town": {"$regex": search, "$options": "i"}},
            ]
        }
    else:
        # Normal browsing: only show ACTIVE and DELETE_REQUESTED listings
        query: dict = {"status": {"$in": ["ACTIVE", "DELETE_REQUESTED"]}}
        if type: query["type"] = type
        if city: query["city"] = {"$regex": city, "$options": "i"}
        if district: query["district"] = {"$regex": district, "$options": "i"}
        if taluk:
            query["$or"] = [
                {"taluk": {"$regex": taluk, "$options": "i"}},
                {"city": {"$regex": taluk, "$options": "i"}}
            ]
        if min_area is not None or max_area is not None:
            query["area"] = {}
            if min_area is not None: query["area"]["$gte"] = min_area
            if max_area is not None: query["area"]["$lte"] = max_area
        if min_price is not None or max_price is not None:
            query["price"] = {}
            if min_price is not None: query["price"]["$gte"] = min_price
            if max_price is not None: query["price"]["$lte"] = max_price
        if water_source: query["water_source"] = water_source
        if road_access: query["road_access"] = road_access
        if soil_type: query["soil_type"] = soil_type
        if electricity is not None: query["electricity"] = electricity
        if irrigation is not None: query["irrigation"] = irrigation

    properties = []
    cursor = db.properties.find(query)
    async for document in cursor:
        properties.append(_doc_to_response(document))
    return properties


@router.post("/", response_model=PropertyResponse)
async def create_property(
    city: str = Form(...),
    district: str = Form(""),
    state: str = Form("Tamil Nadu"),
    area: float = Form(...),
    area_unit: str = Form(...),
    price: float = Form(...),
    type: str = Form(...),
    keywords: str = Form(""),
    description: str = Form(None),
    soil_type: str = Form(None),
    water_source: str = Form(None),
    road_access: str = Form(None),
    fencing: str = Form(None),
    electricity: bool = Form(False),
    irrigation: bool = Form(False),
    nearby_town: str = Form(None),
    distance_from_town_km: float = Form(None),
    taluk: str = Form(""),
    doc_types: List[str] = Form(...),
    files: List[UploadFile] = File(...),
    image_files: List[UploadFile] = File([]),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role"] not in ("SELLER", "USER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Only sellers can list properties")

    if len(doc_types) != len(files) or len(files) == 0:
        raise HTTPException(status_code=400, detail="All document types must have a corresponding file.")

    documents = []
    os.makedirs("uploads/documents", exist_ok=True)
    for dtype, file in zip(doc_types, files):
        if not file.filename:
            raise HTTPException(status_code=400, detail="Empty file submitted.")
        
        ext = file.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join("uploads/documents", unique_filename)
        
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        documents.append({"type": dtype, "url": f"/{filepath.replace(os.sep, '/')}"})

    images = []
    if len(image_files) > 0 and image_files[0].filename:
        os.makedirs("uploads/images", exist_ok=True)
        for img in image_files:
            if img.filename:
                ext = img.filename.split('.')[-1]
                unique_filename = f"{uuid.uuid4().hex}.{ext}"
                filepath = os.path.join("uploads/images", unique_filename)
                
                with open(filepath, "wb") as buffer:
                    shutil.copyfileobj(img.file, buffer)
                    
                images.append(f"/uploads/images/{unique_filename}")

    keyword_list = [k.strip() for k in keywords.split(",")] if keywords else []

    property_data = {
        "city": city,
        "district": district,
        "state": state,
        "area": area,
        "area_unit": area_unit,
        "price": price,
        "type": type,
        "keywords": keyword_list,
        "description": description,
        "soil_type": soil_type,
        "water_source": water_source,
        "road_access": road_access,
        "fencing": fencing,
        "electricity": electricity,
        "irrigation": irrigation,
        "nearby_town": nearby_town,
        "distance_from_town_km": distance_from_town_km,
        "documents": documents,
        "images": images,
        "taluk": taluk,
        "status": "PENDING_VERIFICATION"
    }
    
    property_data = {k: v for k, v in property_data.items() if v is not None}

    new_property = PropertyInDB(**property_data, seller_id=str(current_user["_id"]))
    result = await db.properties.insert_one(new_property.to_insert_dict())

    created_property = await db.properties.find_one({"_id": result.inserted_id})
    return _doc_to_response(created_property)


@router.get("/seller/me", response_model=List[PropertyResponse])
async def get_my_properties(db=Depends(get_db), current_user=Depends(get_current_user)):
    if current_user["role"] not in ("SELLER", "USER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Only sellers can view their listings here")

    properties = []
    cursor = db.properties.find({"seller_id": str(current_user["_id"])})
    async for document in cursor:
        properties.append(_doc_to_response(document))
    return properties


@router.get("/seller/me/stats")
async def get_seller_stats(db=Depends(get_db), current_user=Depends(get_current_user)):
    if current_user["role"] not in ("SELLER", "USER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Only sellers can view their stats")

    seller_id = str(current_user["_id"])
    prop_ids = []
    async for doc in db.properties.find({"seller_id": seller_id}, {"_id": 1}):
        prop_ids.append(str(doc["_id"]))

    pipeline = [
        {"$match": {"property_id": {"$in": prop_ids}, "status": "SUCCESS"}},
        {"$group": {"_id": "$property_id", "unlock_count": {"$sum": 1}}},
    ]
    unlock_map: dict = {}
    async for row in db.transactions.aggregate(pipeline):
        unlock_map[row["_id"]] = row["unlock_count"]

    return {
        "unlock_counts": unlock_map,
        "total_unlocks": sum(unlock_map.values()),
        "total_revenue": sum(unlock_map.values()) * 500,
    }


# ── SOLD OUT TOGGLE ─────────────────────────────────────────────────────────
@router.patch("/{property_id}/sold-out")
async def toggle_sold_out(
    property_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Seller toggles their property as SOLD_OUT or back to ACTIVE."""
    if current_user["role"] not in ("SELLER", "USER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Not authorized")
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")

    existing = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")

    is_admin = current_user["role"] == "ADMIN"
    if existing["seller_id"] != str(current_user["_id"]) and not is_admin:
        raise HTTPException(status_code=403, detail="Not your property")

    current_status = existing["status"]
    if current_status == "SOLD_OUT":
        new_status = "ACTIVE"
    elif current_status == "ACTIVE":
        new_status = "SOLD_OUT"
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Can only toggle SOLD_OUT on ACTIVE properties. Current status: {current_status}"
        )

    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": {"status": new_status}}
    )
    return {"message": f"Property marked as {new_status}", "status": new_status}


# ── DELETE REQUEST ───────────────────────────────────────────────────────────
@router.post("/{property_id}/request-delete")
async def request_delete(
    property_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Seller requests deletion of their property. Admin must approve."""
    if current_user["role"] not in ("SELLER", "USER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Not authorized")
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")

    existing = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")

    is_admin = current_user["role"] == "ADMIN"
    if existing["seller_id"] != str(current_user["_id"]) and not is_admin:
        raise HTTPException(status_code=403, detail="Not your property")

    if existing.get("status") == "DELETE_REQUESTED":
        raise HTTPException(status_code=400, detail="Delete request already pending")

    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": {"status": "DELETE_REQUESTED"}}
    )
    return {"message": "Delete request submitted. Awaiting admin approval."}


# ── CANCEL DELETE REQUEST ────────────────────────────────────────────────────
@router.delete("/{property_id}/request-delete")
async def cancel_delete_request(
    property_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Seller cancels their pending delete request — restores property to ACTIVE."""
    if current_user["role"] not in ("SELLER", "USER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Not authorized")
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")

    existing = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")

    is_admin = current_user["role"] == "ADMIN"
    if existing["seller_id"] != str(current_user["_id"]) and not is_admin:
        raise HTTPException(status_code=403, detail="Not your property")

    if existing.get("status") != "DELETE_REQUESTED":
        raise HTTPException(status_code=400, detail="No pending delete request to cancel")

    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": {"status": "ACTIVE"}}
    )
    return {"message": "Delete request cancelled. Property restored to ACTIVE."}


@router.get("/recommendations", response_model=List[PropertyResponse])
async def get_recommendations(
    district: Optional[str] = Query(None, description="User's district for location-based recs"),
    city: Optional[str] = Query(None, description="User's city for location-based recs"),
    limit: int = Query(8, ge=1, le=20, description="Number of recommendations to return"),
    db=Depends(get_db),
):
    base_filter = {"status": "ACTIVE"}
    results: list[PropertyResponse] = []

    if district or city:
        location_or = []
        if district:
            location_or.append({"district": {"$regex": district, "$options": "i"}})
        if city:
            location_or.append({"city": {"$regex": city, "$options": "i"}})

        location_query = {**base_filter, "$or": location_or}
        async for doc in db.properties.find(location_query).sort("view_count", -1).limit(limit):
            results.append(_doc_to_response(doc))

    if len(results) < limit:
        seen_ids = {r.id for r in results}
        async for doc in db.properties.find(base_filter).sort("view_count", -1).limit(limit * 3):
            if str(doc["_id"]) not in seen_ids and len(results) < limit:
                results.append(_doc_to_response(doc))
                seen_ids.add(str(doc["_id"]))
            if len(results) >= limit: break

    if len(results) < limit:
        seen_ids = {r.id for r in results}
        async for doc in db.properties.find(base_filter).sort("_id", -1).limit(limit * 2):
            if str(doc["_id"]) not in seen_ids:
                results.append(_doc_to_response(doc))
                seen_ids.add(str(doc["_id"]))
            if len(results) >= limit: break

    return results[:limit]


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property_by_id(property_id: str, db=Depends(get_db)):
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")
    document = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not document:
        raise HTTPException(status_code=404, detail="Property not found")
    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$inc": {"view_count": 1}},
    )
    document["view_count"] = document.get("view_count", 0) + 1
    return _doc_to_response(document)


import json

@router.put("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: str,
    city: str = Form(None),
    district: str = Form(None),
    state: str = Form(None),
    price: float = Form(None),
    description: str = Form(None),
    soil_type: str = Form(None),
    water_source: str = Form(None),
    road_access: str = Form(None),
    fencing: str = Form(None),
    electricity: bool = Form(None),
    irrigation: bool = Form(None),
    nearby_town: str = Form(None),
    distance_from_town_km: float = Form(None),
    taluk: str = Form(None),
    retained_documents: str = Form("[]"),
    retained_documents_json: Optional[str] = Form(None),
    doc_types: List[str] = Form([]),
    files: List[UploadFile] = File([]),
    retained_images: str = Form("[]"),
    retained_images_json: Optional[str] = Form(None),
    image_files: List[UploadFile] = File([]),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role"] not in ("SELLER", "USER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Not authorized to edit")
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    existing = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
    is_admin = current_user["role"] == "ADMIN"
    if existing["seller_id"] != str(current_user["_id"]) and not is_admin:
        raise HTTPException(status_code=403, detail="Not your property")

    update_fields = {}
    if city is not None: update_fields["city"] = city
    if district is not None: update_fields["district"] = district
    if state is not None: update_fields["state"] = state
    if price is not None: update_fields["price"] = price
    if description is not None: update_fields["description"] = description
    if soil_type is not None: update_fields["soil_type"] = soil_type
    if water_source is not None: update_fields["water_source"] = water_source
    if road_access is not None: update_fields["road_access"] = road_access
    if fencing is not None: update_fields["fencing"] = fencing
    if electricity is not None: update_fields["electricity"] = electricity
    if irrigation is not None: update_fields["irrigation"] = irrigation
    if nearby_town is not None: update_fields["nearby_town"] = nearby_town
    if distance_from_town_km is not None: update_fields["distance_from_town_km"] = distance_from_town_km
    if taluk is not None: update_fields["taluk"] = taluk

    documents = []
    docs_payload_str = retained_documents_json or retained_documents or "[]"
    try:
        retained = json.loads(docs_payload_str)
        if isinstance(retained, list): documents.extend(retained)
    except: pass
    if len(doc_types) != len(files):
        raise HTTPException(status_code=400, detail="Mismatched documents and files.")

    new_docs_added = False
    if len(files) > 0 and files[0].filename:
        os.makedirs("uploads/documents", exist_ok=True)
        for dtype, file in zip(doc_types, files):
            if file.filename:
                ext = file.filename.split('.')[-1]
                unique_filename = f"{uuid.uuid4().hex}.{ext}"
                filepath = os.path.join("uploads/documents", unique_filename)
                with open(filepath, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                documents.append({"type": dtype, "url": f"/{filepath.replace(os.sep, '/')}"})
                new_docs_added = True
    update_fields["documents"] = documents

    images = []
    imgs_payload_str = retained_images_json or retained_images or "[]"
    try:
        retained_imgs = json.loads(imgs_payload_str)
        if isinstance(retained_imgs, list): images.extend(retained_imgs)
    except: pass

    new_images_added = False
    if len(image_files) > 0 and image_files[0].filename:
        os.makedirs("uploads/images", exist_ok=True)
        for img in image_files:
            if img.filename:
                ext = img.filename.split('.')[-1]
                unique_filename = f"{uuid.uuid4().hex}.{ext}"
                filepath = os.path.join("uploads/images", unique_filename)
                with open(filepath, "wb") as buffer:
                    shutil.copyfileobj(img.file, buffer)
                images.append(f"/uploads/images/{unique_filename}")
                new_images_added = True
    update_fields["images"] = images

    # If a non-admin seller makes any changes to their property, send back for re-verification
    unset_fields = {}
    if not is_admin:
        update_fields["status"] = "PENDING_VERIFICATION"
        update_fields["is_edit_pending"] = True
        unset_fields["rejection_info"] = ""
        
        # Save backup of current (original) fields if not already backed up
        if "original_details" not in existing:
            backup = {}
            for field in [
                "city", "district", "state", "area", "area_unit", "price", "type", 
                "keywords", "description", "documents", "images", "soil_type", 
                "water_source", "road_access", "fencing", "electricity", "irrigation", 
                "nearby_town", "distance_from_town_km", "taluk"
            ]:
                if field in existing:
                    backup[field] = existing[field]
            update_fields["original_details"] = backup

    update_query = {"$set": update_fields}
    if unset_fields:
        update_query["$unset"] = unset_fields

    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        update_query
    )

    updated = await db.properties.find_one({"_id": ObjectId(property_id)})
    return _doc_to_response(updated)


@router.patch("/{property_id}/dismiss-rejection", response_model=Dict[str, Any])
async def dismiss_rejection(
    property_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    existing = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")
        
    if existing.get("seller_id") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to dismiss rejection for this property")
        
    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$unset": {"rejection_info": ""}}
    )
    return {"message": "Rejection message dismissed"}
