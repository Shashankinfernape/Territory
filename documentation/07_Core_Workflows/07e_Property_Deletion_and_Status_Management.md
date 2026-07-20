# 07e. Property Deletion & Status Management

This document explains the workflows for removing a property from the active marketplace, including soft-toggles (`SOLD_OUT`) and hard deletion requests.

## 1. Sold Out Toggling

If a seller successfully sells their land (on or off the platform), they can mark the listing as sold rather than deleting it.

* **Action**: Seller clicks "Mark as Sold" in their dashboard.
* **Endpoint**: `PATCH /api/v1/properties/{id}/sold-out`
* **Result**: The property `status` is toggled between `ACTIVE` and `SOLD_OUT`.
* **Visibility**: 
  * `SOLD_OUT` properties are excluded from the default browse feed.
  * They remain accessible via direct URL.
  * They remain discoverable if a user uses the explicit text `search` bar, allowing for historical data retention and market transparency.

## 2. Hard Deletion Workflow

TERRITORY enforces a "Delete Request" pattern. Sellers cannot instantaneously delete a property; they must request deletion, which an admin must approve. This prevents malicious actors from listing fraudulent land, taking money, and immediately covering their tracks by deleting the listing.

### The Request Phase
1. Seller clicks "Delete" in their dashboard.
2. Frontend calls `POST /api/v1/properties/{id}/request-delete`.
3. Backend updates the property `status` to `DELETE_REQUESTED`.

### Seller Capabilities During Pending Deletion
* **Cancellation**: The seller can change their mind and call `DELETE /api/v1/properties/{id}/request-delete`. The backend reverts the status to `ACTIVE`.
* **Editing**: The seller is technically still permitted to edit the property (`PUT /{property_id}`). However, due to the automatic re-verification constraint, saving an edit will forcefully overwrite the `DELETE_REQUESTED` status to `PENDING_VERIFICATION`, effectively canceling the delete request in favor of an edit request.

### Admin Review Phase
The Admin navigates to the "Delete Requests" tab (`GET /api/v1/admin/delete-requests`).

**If Approved:**
* Endpoint: `POST /api/v1/admin/delete-requests/{id}/approve`
* Action: The property document is hard-deleted from MongoDB (`db.properties.delete_one`).
* Cascade: All transaction records associated with this `property_id` are also hard-deleted to maintain referential integrity.

**If Rejected:**
* Endpoint: `POST /api/v1/admin/delete-requests/{id}/reject`
* Action: The property `status` is reverted to `ACTIVE`. The admin can optionally attach a `rejection_message`, which is stored in `rejection_info`.

---

> [!WARNING]
> **Implementation vs. Business Logic Mismatch**
> 
> **Intended Business Rule**: Properties with a `DELETE_REQUESTED` status *should remain visible* in the public search and browse feeds until the admin officially approves the deletion.
> 
> **Current Implementation Bug**: In `backend/routers/properties.py` (line 80), the default query for the browse endpoint is strictly `query = {"status": "ACTIVE"}`. Because requesting a deletion changes the status to `DELETE_REQUESTED`, the property instantly disappears from the public feed before the admin has approved it. 
> 
> **Required Fix**: The `GET /` properties endpoint must be updated so that the base query includes both `ACTIVE` and `DELETE_REQUESTED` statuses when fetching public listings.
