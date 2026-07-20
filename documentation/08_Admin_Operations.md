# 08. Admin Operations

This document details the responsibilities, capabilities, and workflows available to users with the `ADMIN` role in TERRITORY (PropIt).

## 1. Overview

The `ADMIN` role is a super-user designed to moderate the platform, ensure data quality, and verify financial transactions. Because of its power, `ADMIN` accounts cannot be registered via the standard frontend UI. They must be provisioned directly in the database (e.g., via the `backend/create_test_accounts.py` or `backend/set_admin.py` scripts).

## 2. Dashboard Modules (`/dashboard/admin`)

The Admin Dashboard provides a centralized interface for all moderation tasks, split into logical tabs.

### A. Overview (Stats)
* **Endpoint**: `GET /api/v1/admin/stats`
* **Purpose**: Provides a bird's-eye view of platform health.
* **Metrics Tracked**: Total Users, Total Properties, Active Properties, Pending Properties, Pending Edits, Pending Delete Requests, Sellers Awaiting Approval, Total Transactions, and Total Revenue.

### B. New Property Approvals
* **Endpoint**: `GET /api/v1/admin/properties` (Filtered on frontend for `status == "PENDING_VERIFICATION"`)
* **Purpose**: Moderating newly listed properties.
* **Workflow**: The admin reviews the property details against the attached legal documents. 
  * If valid: Click "Approve" -> Property becomes `ACTIVE`.
  * If invalid: Click "Reject", provide a reason -> Property becomes `REJECTED` (hidden from public).

### C. Property Edit Approvals
* **Endpoint**: Similar to new properties, but filtered for `is_edit_pending == True`.
* **Purpose**: Ensuring sellers don't maliciously alter an already-approved listing (e.g., changing a 1-acre plot to a 100-acre plot).
* **Workflow**: The admin compares current details against the `original_details` backup.
  * If Approved: Edits go live (`is_edit_pending` cleared).
  * If Rejected: Edits are discarded. The property is restored using the `original_details` backup, and a rejection reason is sent to the seller.

### D. Seller Approvals
* **Endpoint**: `GET /api/v1/admin/questions`
* **Purpose**: Upgrading `USER` accounts to `SELLER` accounts.
* **Workflow**: Admin reviews the provided phone number. Upon approval, the backend updates the user's role to `SELLER` and mocks the KYC status to `APPROVED`.

### E. Transaction Approvals (Manual Payments)
* **Endpoint**: `GET /api/v1/payments/admin/pending`
* **Purpose**: Verifying that a buyer's manual payment (e.g., UPI transfer) actually hit the platform's bank account.
* **Workflow**:
  1. Buyer submits Transaction ID on the frontend.
  2. Admin checks their real-world bank statement.
  3. If the Transaction ID matches the bank statement, Admin clicks "Approve".
  4. The transaction status updates to `SUCCESS`, unlocking the property documents for the buyer.

### F. Deletion Requests
* **Endpoint**: `GET /api/v1/admin/delete-requests`
* **Purpose**: Preventing fraudulent hit-and-run listings.
* **Workflow**: Admin reviews why the seller wants to delete the property.
  * If Approved: The property and all associated transactions are hard-deleted.
  * If Rejected: The property reverts to `ACTIVE`.

## 3. Global Settings Management

Admins have the unique ability to configure platform-wide settings that don't belong to a specific user or property.

### Payment QR Code
The platform relies on a static QR code for manual UPI payments. 
* **Update Flow**: The admin can upload a new QR code image via the Settings tab. This calls `POST /api/v1/payments/admin/update-qr`. The image is converted to a base64 string and stored in the `propit_auth` database under the `settings` collection.
* **Retrieval**: The frontend fetches this image via `GET /api/v1/payments/qr-code` to display to buyers during the checkout flow.

## 4. User and Property Moderation (Hard Deletes)

While sellers can only *request* deletion, Admins have the power to instantly and permanently delete records.

* **Delete User (`DELETE /api/v1/admin/users/{id}`)**: Deletes the user from Firebase Auth, deletes their MongoDB profile, and cascades to hard-delete every property they listed, and every transaction associated with those properties.
* **Delete Property (`DELETE /api/v1/admin/properties/{id}`)**: Hard-deletes the property and cascades to delete all associated transactions.
