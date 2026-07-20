# 07c. Property Search & Recommendation Engine

This document explains the logic powering the property search and dynamic recommendation algorithms in the TERRITORY (PropIt) platform.

## 1. Property Browsing & Filtering (`GET /api/v1/properties/`)

The primary browse endpoint supports extensive filtering. 

### Status Filtering
By default, the feed **only returns `ACTIVE` properties**. 
`PENDING_VERIFICATION`, `REJECTED`, and `DELETE_REQUESTED` properties are always hidden from the public feed to ensure data quality and security.

### Search Modifier
If the `search` query parameter is provided (free text search), the status filter is broadened to include `SOLD_OUT` properties. This allows buyers to find historical data or verify that a specific property in their area was successfully sold through the platform.

### Query Construction
The backend constructs a MongoDB query dynamically based on provided query parameters:
* **Location**: `city`, `district`, `taluk` (Regex matching for partial strings).
* **Numerical Ranges**: `min_area` to `max_area`, `min_price` to `max_price` (using `$gte` and `$lte`).
* **Categorical**: `type`, `water_source`, `road_access`, `soil_type` (Exact match).
* **Booleans**: `electricity`, `irrigation` (Exact match).

```json
// Example MongoDB Query constructed for a filtered search
{
  "status": "ACTIVE",
  "type": "Agricultural Land",
  "price": { "$lte": 5000000 },
  "water_source": "Borewell",
  "district": { "$regex": "Coimbatore", "$options": "i" }
}
```

## 2. Smart Recommendation Engine (`GET /api/v1/properties/recommendations`)

The recommendation engine powers the "Recommended for You" section on the Home and Browse pages. It uses a **3-Tier Fallback Algorithm** to ensure the user always sees a full grid of properties (default limit: 8), prioritizing relevance.

### Tier 1: Location-Based Matching
The frontend utilizes the HTML5 Geolocation API (if permitted by the user) to reverse-geocode their current coordinates into a `district` and `city` (via the Nominatim API). These are passed to the backend.

The backend searches for `ACTIVE` properties matching the user's `district` or `city`.
* **Sort**: By `view_count` (Descending) - Most popular local properties first.

### Tier 2: Popularity Fallback
If Tier 1 yields fewer than 8 properties (or if the user denied geolocation), the engine falls back to filling the remaining slots with the most popular properties across the entire platform.

The backend searches for any `ACTIVE` property not already included in the results.
* **Sort**: By `view_count` (Descending) - Most popular platform-wide.

### Tier 3: Newest Fallback (Cold Start)
If the database is new and view counts are all zero, Tier 2 might produce seemingly random results. Tier 3 guarantees the grid is filled by pulling the absolute newest listings.

The backend searches for any `ACTIVE` property not already included in the results.
* **Sort**: By `_id` (Descending) - Newest insertion order.

### Implementation Details
To optimize performance and avoid massive in-memory arrays, the algorithm maintains a `seen_ids` set during execution. It queries MongoDB sequentially for each tier with appropriate limits (`limit * 3`, `limit * 2`) to over-fetch slightly, ensuring it can skip duplicates efficiently and stop exactly when the requested `limit` is reached.
