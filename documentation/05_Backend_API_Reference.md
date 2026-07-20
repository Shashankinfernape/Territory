# 05. Backend API Reference

This document provides a comprehensive reference for the FastAPI endpoints available in the TERRITORY (PropIt) backend.

## Base URL
All endpoints are prefixed with `/api/v1`.

---

## 1. Auth Router (`/api/v1/auth`)

Handles Google Sign-in, user profile management, address management, and wishlist functionality.

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/google-login` | Authenticates an existing user via Firebase UID. | No |
| POST | `/google-signup` | Registers a new user. Requires Firebase UID and initial Address. | No |
| GET | `/me` | Returns the current user's profile and saved addresses. | Yes |
| POST | `/me/address` | Adds a new address or updates an existing one in the user's `saved_addresses`. Sets as active if it's the only one. | Yes |
| PUT | `/me/addresses/{id}/active` | Sets a specific saved address as the primary active address. | Yes |
| DELETE | `/me/addresses/{id}` | Deletes a saved address (unless it's the only one). | Yes |
| GET | `/wishlist` | Returns an array of Property IDs in the user's wishlist. | Yes |
| POST | `/wishlist/{id}` | Toggles a property in/out of the wishlist. | Yes |
| GET | `/wishlist/properties` | Returns full property objects for all items in the wishlist. | Yes |
| POST | `/become-seller` | Submits a request to upgrade the user's role to SELLER. | Yes |

---

## 2. Properties Router (`/api/v1/properties`)

Handles the CRUD operations, searching, and filtering of land listings.

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/` | Lists properties. Supports query parameters for filtering (type, city, district, min_area, max_area, price range, amenities, search keyword). Only returns `ACTIVE` (and `SOLD_OUT` if searching). | No |
| POST | `/` | Creates a new property listing. Requires `multipart/form-data` for handling images and documents. Sets status to `PENDING_VERIFICATION`. | Yes (SELLER/ADMIN) |
| GET | `/seller/me` | Returns all properties listed by the currently authenticated seller. | Yes (SELLER) |
| GET | `/seller/me/stats` | Returns analytics (unlock counts, revenue) for the seller's properties. | Yes (SELLER) |
| PATCH | `/{id}/sold-out` | Toggles the property status between `ACTIVE` and `SOLD_OUT`. | Yes (SELLER/ADMIN) |
| POST | `/{id}/request-delete` | Seller submits a request to delete their property (Sets status to `DELETE_REQUESTED`). | Yes (SELLER) |
| DELETE| `/{id}/request-delete` | Seller cancels a pending delete request (Reverts to `ACTIVE`). | Yes (SELLER) |
| GET | `/recommendations` | Smart recommendation engine. Accepts `district` and `city` query params. Returns a 3-tier fallback list (Location Match -> Most Viewed -> Newest). | No |
| GET | `/{id}` | Fetches a single property by ID and increments its `view_count`. | No |
| PUT | `/{id}` | Updates a property. Requires `multipart/form-data`. Non-admin edits trigger a revert to `PENDING_VERIFICATION` and backup the `original_details`. | Yes (SELLER/ADMIN) |
| PATCH | `/{id}/dismiss-rejection`| Seller dismisses an admin's rejection message attached to their property. | Yes (SELLER) |

---

## 3. Payments Router (`/api/v1/payments`)

Manages the simulated payment gateway, manual payment submission, and secure document access.

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/mock-unlock` | Instantly simulates a successful Rs.500 payment and unlocks the property. (Legacy/Dev) | Yes (BUYER) |
| POST | `/submit-payment` | Submits a manual payment receipt (transaction ID + method). Creates a `PENDING` transaction. | Yes (BUYER) |
| GET | `/check-unlock/{id}` | Returns whether the current user has unlocked the property. Admins and the property's Seller always return `True`. | Yes |
| GET | `/document/{id}/{index}` | Securely streams a document file. Requires validation that the user has unlocked the property via a `SUCCESS` transaction. | Yes |
| GET | `/unlocked-properties` | Returns full property objects that the user has successfully unlocked. | Yes (BUYER) |
| GET | `/purchased-properties` | Returns properties the user has transacted with, including pending payments. | Yes (BUYER) |
| GET | `/admin/pending` | Returns all `PENDING` manual transactions for admin review. | Yes (ADMIN) |
| POST | `/admin/approve/{tx_id}` | Admin approves a manual transaction, unlocking the property for the buyer. | Yes (ADMIN) |
| POST | `/admin/reject/{tx_id}` | Admin rejects a manual transaction. | Yes (ADMIN) |
| GET | `/qr-code` | Streams the active payment QR code image from the database. | No |
| POST | `/admin/update-qr` | Admin uploads a new payment QR code image. | Yes (ADMIN) |

---

## 4. Admin Router (`/api/v1/admin`)

Provides comprehensive platform oversight for super-users.

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/stats` | Returns aggregated metrics (total users, active/pending properties, revenue, etc.). | Yes (ADMIN) |
| GET | `/users` | Returns a lightweight list of all users on the platform. | Yes (ADMIN) |
| GET | `/users/{id}/full-profile`| Returns an aggregated view of a user: profile, listed properties, bought properties, and wishlist. | Yes (ADMIN) |
| GET | `/properties` | Returns a list of all properties across the platform with seller names attached. | Yes (ADMIN) |
| GET | `/transactions` | Returns a detailed list of all transactions with buyer and seller info joined. | Yes (ADMIN) |
| PUT | `/properties/{id}/verify`| Approves or rejects a `PENDING_VERIFICATION` property. Handles logic for restoring backups if an *edit* was rejected. | Yes (ADMIN) |
| PUT | `/properties/{id}` | Direct admin edit of a property (bypasses verification constraints). | Yes (ADMIN) |
| DELETE| `/properties/{id}` | Hard deletes a property and its related transactions. | Yes (ADMIN) |
| PUT | `/users/{id}/verify-seller`| Explicitly sets a user's role to `SELLER`. | Yes (ADMIN) |
| DELETE| `/users/{id}` | Hard deletes a user from Firebase and MongoDB (cascades to their properties and transactions). | Yes (ADMIN) |
| GET | `/questions` | Returns all pending seller promotion requests. | Yes (ADMIN) |
| PUT | `/questions/{id}/approve`| Approves a seller promotion request and upgrades the user's role. | Yes (ADMIN) |
| PUT | `/questions/{id}/reject` | Rejects a seller promotion request. | Yes (ADMIN) |
| GET | `/delete-requests` | Returns all properties with `status == "DELETE_REQUESTED"`. | Yes (ADMIN) |
| POST | `/delete-requests/{id}/approve` | Approves a seller's deletion request (Hard delete). | Yes (ADMIN) |
| POST | `/delete-requests/{id}/reject` | Rejects a deletion request (Restores to `ACTIVE`). | Yes (ADMIN) |

## Implementation Notes

* **Routing Precedence**: In FastAPI, route declaration order matters. In `routers/properties.py`, routes like `/seller/me` must be defined *before* `/{property_id}`, otherwise the latter acts as a catch-all and throws an invalid ObjectId error.
* **Multipart Forms**: Property creation and updates use `Form(...)` and `File(...)` instead of JSON bodies because they handle file uploads simultaneously. Arrays in forms (like `keywords` or `retained_images_json`) are typically sent as comma-separated strings or stringified JSON and parsed within the endpoint.
