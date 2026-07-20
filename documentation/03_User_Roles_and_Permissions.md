# 03. User Roles & Permissions

This document defines the user roles within the TERRITORY (PropIt) platform and the distinct permissions associated with each role.

## Defined Roles

The platform implements Role-Based Access Control (RBAC) with four distinct roles:

1. **USER (Guest/Basic)**
2. **BUYER**
3. **SELLER**
4. **ADMIN**

The role is stored in the `role` field on the MongoDB `users` document.

---

### 1. USER (Guest/Basic)
This is the default role assigned when someone signs up via Google Authentication. A `USER` has limited capabilities and must explicitly upgrade to a `BUYER` or `SELLER` (though currently, the UI primarily guides them to become a Seller).

* **Permissions:**
  * Browse and search `ACTIVE` properties.
  * Maintain a wishlist.
  * Manage saved addresses.
  * Cannot access the Seller Dashboard or list properties.
  * Cannot process mock payments to unlock properties.
* **Transition:** Can request to become a `SELLER` by submitting a phone number through the `POST /become-seller` endpoint. This creates a `PENDING` request in the `questions` collection.

### 2. BUYER
*(Note: Historically a distinct role in older test seeds, but in practice, standard authenticated users perform buyer actions. The backend often checks `role in ("BUYER", "USER", "ADMIN", "SELLER")` for buyer-specific endpoints).*

* **Permissions:**
  * Browse and search `ACTIVE` properties.
  * Maintain a wishlist.
  * Execute transactions (`mock-unlock` or `submit-payment`) to unlock property contact details and documents.
  * View documents for properties they have successfully purchased/unlocked.

### 3. SELLER
A `SELLER` is an upgraded user who has been granted permission to list land on the platform.

* **Permissions:**
  * Inherits all capabilities of a `BUYER/USER` (can browse and purchase other properties).
  * Access the Seller Dashboard (`/dashboard/seller`).
  * Create new property listings (defaults to `PENDING_VERIFICATION`).
  * Edit their own property listings (triggers a revert to `PENDING_VERIFICATION` unless the user is an admin).
  * Toggle their active properties to `SOLD_OUT` and back.
  * Request deletion of their own properties (sets status to `DELETE_REQUESTED`).
  * Cancel a pending deletion request.
  * Automatically view all documents and contact details for their *own* listings without needing to unlock them.
  * View analytics/stats (unlock counts, revenue potential) for their listed properties.

### 4. ADMIN
The `ADMIN` is a super-user with full oversight of the platform, user management, and property verification. Admin accounts must be created manually via database seeding scripts (e.g., `set_admin.py`).

* **Permissions:**
  * Access the Admin Dashboard (`/dashboard/admin`).
  * View platform-wide statistics (total users, revenue, pending approvals).
  * Approve or Reject new property listings and property edits.
  * Approve or Reject property deletion requests submitted by sellers.
  * Approve or Reject seller promotion requests (upgrading a `USER` to `SELLER`).
  * View all transactions and approve/reject pending manual payments.
  * Delete any user (cascades to delete their properties and transactions).
  * Edit any property directly without triggering the `PENDING_VERIFICATION` state constraint.
  * Update global platform settings (like the payment QR code).

---

## Role Transitions & Workflows

### The Path to Becoming a Seller
1. A user signs up via Google -> Role is `USER`.
2. The user attempts to access the Seller Dashboard or clicks "Sell Land".
3. The user is prompted to provide a valid 10-digit Indian phone number.
4. The system submits a `POST /become-seller` request, creating a `PENDING` question in the database.
5. The `USER`'s `is_seller_pending` boolean becomes `true`, showing a "pending approval" banner in the UI.
6. The `ADMIN` reviews the request in the Admin Dashboard.
7. The `ADMIN` clicks "Approve". The user's role is updated to `SELLER` in the database.
8. The user can now access the Seller Dashboard and list properties.

*(Note: In previous iterations, KYC details like Aadhaar/PAN were collected. This requirement has been removed, and the backend now mocks the KYC fields as "Google/Gmail Verified" automatically upon approval).*

## Backend Authorization Checks
The backend enforces these roles at the router level using dependency injection in FastAPI.

Example implementation:
```python
def _require_buyer(current_user: dict):
    if current_user["role"] not in ("BUYER", "USER", "ADMIN", "SELLER"):
        raise HTTPException(status_code=403, detail="Only buyers can access this endpoint")

async def get_current_admin(current_user=Depends(get_current_user)):
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user
```
