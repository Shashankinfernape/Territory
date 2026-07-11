from fastapi import APIRouter, Depends, HTTPException, Query, Form, UploadFile, File
import os
import shutil
import uuid
from typing import List, Optional
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
    )


@router.get("/", response_model=List[PropertyResponse])
async def get_properties(
    type: Optional[str] = Query(None, description="Filter by land type"),
    city: Optional[str] = Query(None, description="Filter by city"),
    district: Optional[str] = Query(None, description="Filter by district"),
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
    query = {"status": "ACTIVE"}

    if type:
        query["type"] = type
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if district:
        query["district"] = {"$regex": district, "$options": "i"}
    if min_area is not None or max_area is not None:
        query["area"] = {}
        if min_area is not None:
            query["area"]["$gte"] = min_area
        if max_area is not None:
            query["area"]["$lte"] = max_area
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    if water_source:
        query["water_source"] = water_source
    if road_access:
        query["road_access"] = road_access
    if soil_type:
        query["soil_type"] = soil_type
    if electricity is not None:
        query["electricity"] = electricity
    if irrigation is not None:
        query["irrigation"] = irrigation
    if search:
        query["$or"] = [
            {"city": {"$regex": search, "$options": "i"}},
            {"district": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"keywords": {"$elemMatch": {"$regex": search, "$options": "i"}}},
            {"nearby_town": {"$regex": search, "$options": "i"}},
        ]

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
    doc_types: List[str] = Form(...),
    files: List[UploadFile] = File(...),
    image_files: List[UploadFile] = File([]),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role"] not in ("SELLER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Only sellers can list properties")

    if len(doc_types) != len(files) or len(files) == 0:
        raise HTTPException(status_code=400, detail="All document types must have a corresponding file.")

    # Process and save documents
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

    # Process and save images
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
        "images": images
    }
    
    # Remove None values
    property_data = {k: v for k, v in property_data.items() if v is not None}

    new_property = PropertyInDB(**property_data, seller_id=str(current_user["_id"]))
    # to_insert_dict() excludes _id: None so MongoDB auto-generates the ObjectId.
    result = await db.properties.insert_one(new_property.to_insert_dict())

    created_property = await db.properties.find_one({"_id": result.inserted_id})
    return _doc_to_response(created_property)


# IMPORTANT: /seller/me MUST be defined BEFORE /{property_id}
# otherwise FastAPI will interpret "seller" as a property_id path parameter.
@router.get("/seller/me", response_model=List[PropertyResponse])
async def get_my_properties(db=Depends(get_db), current_user=Depends(get_current_user)):
    if current_user["role"] not in ("SELLER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Only sellers can view their listings here")

    properties = []
    cursor = db.properties.find({"seller_id": str(current_user["_id"])})
    async for document in cursor:
        properties.append(_doc_to_response(document))
    return properties


# IMPORTANT: /seller/me/stats MUST also be before /{property_id}
@router.get("/seller/me/stats")
async def get_seller_stats(db=Depends(get_db), current_user=Depends(get_current_user)):
    """Return per-property unlock counts for the authenticated seller."""
    if current_user["role"] not in ("SELLER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Only sellers can view their stats")

    seller_id = str(current_user["_id"])
    # Find all properties owned by this seller
    prop_ids = []
    async for doc in db.properties.find({"seller_id": seller_id}, {"_id": 1}):
        prop_ids.append(str(doc["_id"]))

    # Count unlocks per property from transactions
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


# ── RECOMMENDATIONS ─────────────────────────────────────────────────────────
# IMPORTANT: Must be defined BEFORE /{property_id} to avoid route collision.
@router.get("/recommendations", response_model=List[PropertyResponse])
async def get_recommendations(
    district: Optional[str] = Query(None, description="User's district for location-based recs"),
    city: Optional[str] = Query(None, description="User's city for location-based recs"),
    limit: int = Query(8, ge=1, le=20, description="Number of recommendations to return"),
    db=Depends(get_db),
):
    """
    Smart recommendation engine:
    1. Location-based: properties matching the user's district or city
    2. Fallback A: Most popular (highest view_count) ACTIVE listings
    3. Fallback B: Newest ACTIVE listings (by _id insertion order)
    """
    base_filter = {"status": "ACTIVE"}
    results: list[PropertyResponse] = []

    # ── Step 1: Location-based recommendations ───────────────────────────────
    if district or city:
        location_or = []
        if district:
            location_or.append({"district": {"$regex": district, "$options": "i"}})
        if city:
            location_or.append({"city": {"$regex": city, "$options": "i"}})

        location_query = {**base_filter, "$or": location_or}
        # Sort by view_count desc so the most popular local listings come first
        async for doc in db.properties.find(location_query).sort("view_count", -1).limit(limit):
            results.append(_doc_to_response(doc))

    # ── Step 2: Fill remaining slots with most-viewed listings ───────────────
    if len(results) < limit:
        seen_ids = {r.id for r in results}
        remaining = limit - len(results)
        async for doc in db.properties.find(base_filter).sort("view_count", -1).limit(limit * 3):
            if str(doc["_id"]) not in seen_ids and len(results) < limit:
                results.append(_doc_to_response(doc))
                seen_ids.add(str(doc["_id"]))
            if len(results) >= limit:
                break

    # ── Step 3: Final fallback — newest listings ─────────────────────────────
    if len(results) < limit:
        seen_ids = {r.id for r in results}
        remaining = limit - len(results)
        async for doc in db.properties.find(base_filter).sort("_id", -1).limit(limit * 2):
            if str(doc["_id"]) not in seen_ids:
                results.append(_doc_to_response(doc))
                seen_ids.add(str(doc["_id"]))
            if len(results) >= limit:
                break

    return results[:limit]


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property_by_id(property_id: str, db=Depends(get_db)):
    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid property ID")
    document = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not document:
        raise HTTPException(status_code=404, detail="Property not found")
    # Increment view count atomically
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
    retained_documents: str = Form("[]"), # JSON array of document objects to keep
    retained_documents_json: Optional[str] = Form(None), # fallback name
    doc_types: List[str] = Form([]),
    files: List[UploadFile] = File([]),
    retained_images: str = Form("[]"), # JSON array of image strings to keep in order
    retained_images_json: Optional[str] = Form(None), # fallback name
    image_files: List[UploadFile] = File([]),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user["role"] not in ("SELLER", "ADMIN"):
        raise HTTPException(status_code=403, detail="Not authorized to edit")

    if not ObjectId.is_valid(property_id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    existing = await db.properties.find_one({"_id": ObjectId(property_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Property not found")

    if existing["seller_id"] != str(current_user["_id"]) and current_user["role"] != "ADMIN":
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

    # Process documents
    documents = []
    docs_payload_str = retained_documents_json or retained_documents or "[]"
    try:
        retained = json.loads(docs_payload_str)
        if isinstance(retained, list):
            documents.extend(retained)
    except:
        pass

    if len(doc_types) != len(files):
        raise HTTPException(status_code=400, detail="Mismatched documents and files.")

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
                
    update_fields["documents"] = documents

    # Process images (retained + new)
    images = []
    imgs_payload_str = retained_images_json or retained_images or "[]"
    try:
        retained_imgs = json.loads(imgs_payload_str)
        if isinstance(retained_imgs, list):
            images.extend(retained_imgs)
    except:
        pass

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

    update_fields["images"] = images

    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": update_fields},
    )

    updated = await db.properties.find_one({"_id": ObjectId(property_id)})
    return _doc_to_response(updated)
