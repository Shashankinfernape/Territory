# 02. Database Schema & Data Models

This document outlines the MongoDB schema and Pydantic data models used in the TERRITORY (PropIt) platform.

## Overview

The system uses two primary MongoDB databases to isolate authentication/user data from application data:
1. **Auth Database** (`propit_auth` by default): Stores users, addresses, and platform settings.
2. **Main Database** (`propit` by default): Stores properties and transactions.

The schema is enforced primarily at the application level using **Pydantic** models in FastAPI (`backend/models.py`).

## 1. Auth Database Collections

### `users` Collection
Stores user profiles, roles, addresses, and saved wishlists. The `_id` field explicitly uses the Firebase UID.

**Schema (Pydantic: `UserInDB`)**:
```json
{
  "_id": "Firebase UID (String)",
  "email": "user@example.com",
  "phone_number": "10-digit numeric string (Optional)",
  "role": "BUYER | SELLER | ADMIN | USER",
  "full_name": "String (Optional)",
  "photo_url": "String (Optional)",
  "kyc_details": { // Legacy/Deprecated, maintained for backwards compatibility
    "aadhaar_number": "String",
    "pan_number": "String",
    "status": "APPROVED | PENDING | REJECTED"
  },
  "address": { // Active Address
    "id": "UUID String",
    "first_name": "String",
    "last_name": "String",
    "mobile_number": "String",
    "email": "String",
    "pincode": "String",
    "flat_house_no": "String",
    "floor": "String",
    "street_locality": "String",
    "city": "String",
    "district": "String",
    "state": "String",
    "address_type": "Home | Work | Neighbour"
  },
  "saved_addresses": [ /* Array of Address objects */ ],
  "wishlist": [ "Property_ID_String", ... ],
  "created_at": "ISODate"
}
```
**Indexes:** 
* `{ "phone_number": 1 }` (Unique, Sparse)

### `questions` Collection
Stores requests from users (e.g., a `USER` requesting promotion to `SELLER`).

**Schema**:
```json
{
  "_id": "ObjectId",
  "user_id": "Firebase UID (String)",
  "email": "String",
  "full_name": "String",
  "phone_number": "String",
  "message": "User requesting promotion to Seller role.",
  "status": "PENDING | APPROVED | REJECTED",
  "created_at": "ISODate"
}
```

### `settings` Collection
Stores global platform configuration variables (e.g., the QR code for payments).

**Schema**:
```json
{
  "_id": "String (e.g. 'payment_qr')",
  "image_b64": "Base64 encoded string",
  "content_type": "MIME type (e.g. 'image/jpeg')",
  "updated_at": "ISODate"
}
```

## 2. Main Database Collections

### `properties` Collection
Stores all land listings, their status, features, and attached documents/images.

**Schema (Pydantic: `PropertyInDB`)**:
```json
{
  "_id": "ObjectId",
  "seller_id": "Firebase UID (String)",
  "city": "String",
  "district": "String",
  "state": "String",
  "area": "Float",
  "area_unit": "acres | sq_ft | cents | hectares",
  "price": "Float",
  "type": "Agricultural Land | Flat Plot | Farm Land | ...",
  "keywords": [ "String" ],
  "description": "String (Optional)",
  "documents": [
    {
      "type": "Patta | Chitta | FMB Sketch",
      "url": "Relative path (e.g., /uploads/documents/...)"
    }
  ],
  "images": [ "Relative path or URL" ],
  "status": "ACTIVE | PENDING_VERIFICATION | REJECTED | SOLD_OUT | DELETE_REQUESTED",
  "view_count": "Integer",
  
  // Specific Property Features
  "soil_type": "Red | Black | Alluvial | Laterite | None",
  "water_source": "Borewell | Canal | River | Rainfed | None",
  "road_access": "National Highway | State Highway | Village Road | No Road",
  "fencing": "Compound Wall | Wire Fence | Partial | None",
  "electricity": "Boolean",
  "irrigation": "Boolean",
  "nearby_town": "String",
  "distance_from_town_km": "Float",
  "taluk": "String",
  
  // Edit & Rejection state management
  "is_edit_pending": "Boolean (True if property was edited and awaits approval)",
  "original_details": { /* Snapshot of property before edit */ },
  "rejection_info": {
    "message": "Admin's rejection reason",
    "type": "NEW_PROPERTY_REJECTION | EDIT_REJECTION | DELETE_REJECTION",
    "timestamp": "ISO String",
    "rejected_details": { /* Shows which fields were rejected on edit */ }
  },
  "created_at": "ISODate"
}
```
**Indexes:**
* `{ "status": 1 }`
* `{ "seller_id": 1 }`

### `transactions` Collection
Tracks unlocking of properties (simulated or real payments). A transaction grants a buyer access to a property's documents and the seller's contact information.

**Schema**:
```json
{
  "_id": "ObjectId",
  "buyer_id": "Firebase UID (String)",
  "buyer_email": "String",
  "buyer_name": "String",
  "owner_id": "Firebase UID (String)",
  "owner_email": "String",
  "owner_name": "String",
  "property_id": "Property ObjectId (String representation)",
  "transaction_id": "String (From payment gateway/manual entry)",
  "payment_method": "String",
  "amount": "Float (Typically 500)",
  "status": "PENDING | SUCCESS | REJECTED",
  "property_details": { // Snapshot for history
    "city": "String",
    "state": "String",
    "district": "String",
    "area": "Float",
    "area_unit": "String",
    "price": "Float"
  },
  "created_at": "ISODate"
}
```
**Indexes:**
* `{ "buyer_id": 1 }`
* `{ "buyer_id": 1, "property_id": 1 }` (Unique compound index to prevent duplicate purchases of the same property by the same buyer)

## Important Data Patterns

1. **Denormalization**: Information like `property_details`, `buyer_email`, and `owner_email` is embedded directly into the `transactions` document. This creates a snapshot of the state at the time of transaction, preventing historical records from mutating if a user changes their profile or a property is updated.
2. **ObjectId vs String**: MongoDB `_id` in properties and transactions are BSON `ObjectId`s. However, when passed to the frontend (via Pydantic responses), they are converted to strings (`id: str`).
3. **Firebase UID as Primary Key**: The `users` collection deliberately uses the Firebase string UID as the `_id` instead of a generated ObjectId, ensuring exact 1:1 mapping without a secondary lookup.
