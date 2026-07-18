import asyncio
import os
from bson import ObjectId
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

from database import db, client
from routers.admin import verify_property, reject_delete_request
from routers.properties import update_property

async def run_tests():
    print("--- STARTING END-TO-END WORKFLOW INTEGRATION TESTS ---")
    
    # 1. Create a dummy active property
    test_property = {
        "seller_id": "test-seller-id",
        "city": "Chennai",
        "district": "Chennai",
        "state": "Tamil Nadu",
        "area": 10.0,
        "area_unit": "acres",
        "price": 5000000.0,
        "type": "Agricultural Land",
        "status": "ACTIVE",
        "view_count": 5,
        "soil_type": "Red Soil",
        "water_source": "Borewell",
        "road_access": "Village Road",
        "fencing": "None",
        "electricity": True,
        "irrigation": True,
        "nearby_town": "Chennai Town",
        "distance_from_town_km": 5.0,
        "taluk": "Chennai Taluk"
    }
    
    res = await db.properties.insert_one(test_property)
    property_id = str(res.inserted_id)
    print(f"Created dummy property with ID: {property_id}")
    
    # Verify initial details
    prop = await db.properties.find_one({"_id": ObjectId(property_id)})
    assert prop["city"] == "Chennai"
    assert prop["status"] == "ACTIVE"
    assert "original_details" not in prop
    print("✓ Initial property details successfully verified.")
    
    # 2. Simulate edit from seller (is_admin = False)
    update_fields = {
        "city": "Madurai",
        "price": 6000000.0,
        "area": 12.0,
        "status": "PENDING_VERIFICATION",
        "is_edit_pending": True
    }
    
    # Save backup of current fields
    backup = {}
    for field in [
        "city", "district", "state", "area", "area_unit", "price", "type", 
        "keywords", "description", "documents", "images", "soil_type", 
        "water_source", "road_access", "fencing", "electricity", "irrigation", 
        "nearby_town", "distance_from_town_km", "taluk"
    ]:
        if field in prop:
            backup[field] = prop[field]
    update_fields["original_details"] = backup
    
    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": update_fields}
    )
    print("Simulated property edit by Seller.")
    
    # Verify edit pending state
    prop_edited = await db.properties.find_one({"_id": ObjectId(property_id)})
    assert prop_edited["status"] == "PENDING_VERIFICATION"
    assert prop_edited["is_edit_pending"] == True
    assert prop_edited["original_details"]["city"] == "Chennai"
    assert prop_edited["original_details"]["price"] == 5000000.0
    assert prop_edited["city"] == "Madurai"
    assert prop_edited["price"] == 6000000.0
    print("✓ Edit-pending state and original_details backup successfully verified.")
    
    # 3. Approve edits (status = 'ACTIVE') via verify_property
    print("Calling verify_property to Approve changes...")
    await verify_property(property_id=property_id, body={"status": "ACTIVE"}, db=db, current_admin={})
    
    prop_approved = await db.properties.find_one({"_id": ObjectId(property_id)})
    assert prop_approved["status"] == "ACTIVE"
    assert prop_approved["is_edit_pending"] == False
    assert "original_details" not in prop_approved
    assert prop_approved["city"] == "Madurai"
    assert prop_approved["price"] == 6000000.0
    print("✓ Edits successfully approved: new values promoted and backup cleared.")
    
    # 4. Simulate another edit, then reject it with rejection_message
    update_fields_2 = {
        "city": "Coimbatore",
        "price": 8000000.0,
        "status": "PENDING_VERIFICATION",
        "is_edit_pending": True
    }
    backup_2 = {}
    for field in [
        "city", "district", "state", "area", "area_unit", "price", "type", 
        "keywords", "description", "documents", "images", "soil_type", 
        "water_source", "road_access", "fencing", "electricity", "irrigation", 
        "nearby_town", "distance_from_town_km", "taluk"
    ]:
        if field in prop_approved:
            backup_2[field] = prop_approved[field]
    update_fields_2["original_details"] = backup_2
    
    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": update_fields_2}
    )
    print("Simulated second property edit by Seller.")
    
    # Call verify_property to Reject changes with a reason
    print("Calling verify_property to Reject changes with a reason...")
    await verify_property(
        property_id=property_id, 
        body={"status": "REJECTED", "rejection_message": "Price increase is too high for current layout"}, 
        db=db, 
        current_admin={}
    )
    
    prop_rejected = await db.properties.find_one({"_id": ObjectId(property_id)})
    assert prop_rejected["status"] == "ACTIVE"
    assert prop_rejected["is_edit_pending"] == False
    assert "original_details" not in prop_rejected
    assert prop_rejected["city"] == "Madurai"  # Rolled back
    assert prop_rejected["price"] == 6000000.0  # Rolled back
    
    # Verify rejection_info exists
    assert "rejection_info" in prop_rejected
    assert prop_rejected["rejection_info"]["message"] == "Price increase is too high for current layout"
    assert prop_rejected["rejection_info"]["type"] == "EDIT_REJECTION"
    assert prop_rejected["rejection_info"]["rejected_details"]["city"] == "Coimbatore"
    assert prop_rejected["rejection_info"]["rejected_details"]["price"] == 8000000.0
    print("✓ Edits successfully rejected: rejection_info details verified.")

    # 5. Simulate another edit to verify that rejection_info gets cleared on subsequent edit
    unset_fields = {"rejection_info": ""}
    update_fields_3 = {
        "city": "Salem",
        "status": "PENDING_VERIFICATION",
        "is_edit_pending": True
    }
    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": update_fields_3, "$unset": unset_fields}
    )
    prop_edited_again = await db.properties.find_one({"_id": ObjectId(property_id)})
    assert "rejection_info" not in prop_edited_again
    print("✓ Rejection alert cleared successfully when seller edited the property again.")

    # Reset property to active for next test
    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": {"status": "ACTIVE"}, "$unset": {"original_details": "", "is_edit_pending": ""}}
    )
    
    # 6. Test Sold Out Status
    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": {"status": "SOLD_OUT"}}
    )
    prop_sold = await db.properties.find_one({"_id": ObjectId(property_id)})
    assert prop_sold["status"] == "SOLD_OUT"
    print("✓ Property successfully marked as SOLD_OUT.")
    
    # 7. Test Delete Request and rejection with rejection_message
    await db.properties.update_one(
        {"_id": ObjectId(property_id)},
        {"$set": {"status": "DELETE_REQUESTED"}}
    )
    prop_del_req = await db.properties.find_one({"_id": ObjectId(property_id)})
    assert prop_del_req["status"] == "DELETE_REQUESTED"
    print("✓ Delete request successfully initiated.")

    # Reject delete request via admin endpoint
    await reject_delete_request(
        property_id=property_id,
        body={"rejection_message": "Do not delete this listing; it has an active survey unlock history"},
        db=db,
        current_admin={}
    )
    prop_del_rejected = await db.properties.find_one({"_id": ObjectId(property_id)})
    assert prop_del_rejected["status"] == "ACTIVE"
    assert prop_del_rejected["rejection_info"]["message"] == "Do not delete this listing; it has an active survey unlock history"
    assert prop_del_rejected["rejection_info"]["type"] == "DELETE_REJECTION"
    print("✓ Delete request rejection with rejection_info successfully verified.")
    
    # Clean up test property
    await db.properties.delete_one({"_id": ObjectId(property_id)})
    print(f"Cleaned up test property ID: {property_id}")
    print("--- ALL WORKFLOW TESTS PASSED SUCCESSFULLY! ---")

if __name__ == "__main__":
    asyncio.run(run_tests())
