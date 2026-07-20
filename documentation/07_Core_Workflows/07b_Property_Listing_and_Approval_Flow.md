# 07b. Property Listing & Approval Flow

This document details the lifecycle of a property listing, from the initial upload by a seller to the admin verification process.

## 1. Property Creation (Seller)

A user with the `SELLER` role can upload a new property via the Seller Dashboard.

1. **Upload Form**: The frontend collects over 15 details (City, District, Price, Area, Soil Type, Water Source, etc.) via a multi-step form.
2. **Documents & Images**: The seller must attach mandatory legal documents (e.g., Patta, Chitta) and optional property images.
3. **Submission**: The frontend sends a `multipart/form-data` request to `POST /api/v1/properties/`.
4. **Backend Processing**:
   * Generates a UUID filename for each uploaded document and image to prevent path collisions and predictable scraping.
   * Saves the files to `/uploads/documents` and `/uploads/images`.
   * Inserts the property record into the `properties` collection.
5. **Initial State**: The property is created with `status = "PENDING_VERIFICATION"`. It is **not visible** in public search results.

## 2. Admin Verification Workflow

Every new property or edited property must be reviewed by an `ADMIN` before it goes live.

### Approval Process
1. The admin navigates to the "New Property Approvals" tab in the Admin Dashboard.
2. The UI fetches properties where `status == "PENDING_VERIFICATION"`.
3. The admin reviews the provided details and clicks to view the uploaded documents.
4. If everything is accurate, the admin clicks "Approve".
5. The frontend calls `PUT /api/v1/admin/properties/{id}/verify` with `{"status": "ACTIVE"}`.
6. The backend updates the property status to `ACTIVE`, clearing any previous `rejection_info`. 
7. The property is now visible to all buyers on the public search and map pages.

### Rejection Process
1. If the admin finds issues (e.g., blurry documents, unrealistic price), they click "Reject".
2. The UI prompts the admin to enter a mandatory rejection reason.
3. The frontend calls the same `verify` endpoint with `{"status": "REJECTED", "rejection_message": "..."}`.
4. The backend updates the property status to `REJECTED` and embeds a `rejection_info` object:
   ```json
   "rejection_info": {
     "message": "Documents are unreadable.",
     "type": "NEW_PROPERTY_REJECTION",
     "timestamp": "2026-07-20T10:00:00Z"
   }
   ```
5. The property remains hidden from the public. The seller sees the rejection reason in their dashboard and must edit the property to fix it.

## 3. Property Editing & Re-Verification Constraints

To prevent bait-and-switch tactics (where a seller gets a property approved and then changes the details or price drastically), the platform enforces strict re-verification rules on edits.

1. **Editing**: The seller modifies the property via `PUT /api/v1/properties/{id}`.
2. **Automatic State Reversion**: The backend detects that a non-admin is making the edit. It forces the following updates:
   * `status = "PENDING_VERIFICATION"` (Removing it from public search immediately).
   * `is_edit_pending = True`
   * `original_details = { ... }` (A complete backup of the pre-edit property fields).
3. **Admin Review (Edit Mode)**:
   * The admin sees this property in the pending queue.
   * If **Approved**: The `status` becomes `ACTIVE`, `is_edit_pending` becomes `False`, and the `original_details` backup is permanently deleted. The new edits are now live.
   * If **Rejected**: The backend performs a rollback. It restores all fields from `original_details`, sets `status = "ACTIVE"` (restoring the pre-edit state), and attaches a `rejection_info` object of type `EDIT_REJECTION`. The seller is notified why their specific edits were rejected, but their original listing remains active.

> **Exception:** If an `ADMIN` edits a property directly, the automatic state reversion is bypassed, and the changes go live immediately.

## 4. Sold Out Toggling

A seller (or admin) can toggle an `ACTIVE` property to `SOLD_OUT` using `PATCH /api/v1/properties/{id}/sold-out`.
* This removes the property from the default `GET /` browse feed.
* However, `SOLD_OUT` properties *can* still be found via direct text search (this allows past buyers or interested parties to verify the property's history).
* A `SOLD_OUT` property can be toggled back to `ACTIVE` by the seller without requiring re-verification.
