"""
seed_properties.py — Insert 20 varied properties into MongoDB,
reusing the existing uploaded images and PDFs.
"""
import os
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DATABASE_NAME", "propit")

# ── Reuse existing uploads from the one property already in DB ───────────────
IMAGES = [
    "/uploads/images/5fee3d8fb35f417c962bb1cf1540c89c.jpg",
    "/uploads/images/357b2aced0a94e4fb6575e8f561fa21b.jpg",
]
DOCS = [
    {"type": "Patta",    "url": "/uploads/documents/5aa6736462d44a049d7340a2df0e9a2a.pdf"},
    {"type": "Chitta",   "url": "/uploads/documents/f5073b00463c47659fc69d96e29d1264.pdf"},
    {"type": "A-Register","url": "/uploads/documents/bb9e51ecb74c421db55e9c515c4b1bbd.pdf"},
]

SELLER_ID = "Gxnu2odqz8aS651P1gZe1FcER2u2"

PROPERTIES = [
    {
        "city": "Coimbatore", "district": "Coimbatore", "area": 3.0, "area_unit": "acres",
        "price": 850000, "type": "Agricultural Land",
        "keywords": ["fertile", "river view", "irrigation"],
        "description": "Prime agricultural land near Coimbatore with excellent water source and road connectivity.",
        "soil_type": "Black Soil", "water_source": "Canal", "road_access": "State Highway",
        "fencing": "Wire Fence", "electricity": True, "irrigation": True,
        "nearby_town": "Coimbatore", "distance_from_town_km": 8.0, "view_count": 42,
    },
    {
        "city": "Madurai", "district": "Madurai", "area": 1200, "area_unit": "sq_ft",
        "price": 550000, "type": "Residential Plot",
        "keywords": ["approved layout", "DTCP", "corner plot"],
        "description": "DTCP approved residential plot in a fast-growing layout near Madurai bypass.",
        "soil_type": "Red Soil", "water_source": "Borewell", "road_access": "District Road",
        "fencing": "Compound Wall", "electricity": True, "irrigation": False,
        "nearby_town": "Madurai", "distance_from_town_km": 4.0, "view_count": 89,
    },
    {
        "city": "Salem", "district": "Salem", "area": 5.0, "area_unit": "acres",
        "price": 1200000, "type": "Farm Land",
        "keywords": ["mango orchard", "drip irrigation", "borewell"],
        "description": "Established mango orchard with drip irrigation system, two borewells, and road access.",
        "soil_type": "Alluvial Soil", "water_source": "Borewell", "road_access": "National Highway",
        "fencing": "Compound Wall", "electricity": True, "irrigation": True,
        "nearby_town": "Salem", "distance_from_town_km": 12.0, "view_count": 61,
    },
    {
        "city": "Trichy", "district": "Tiruchirappalli", "area": 800, "area_unit": "sq_ft",
        "price": 320000, "type": "Flat Plot",
        "keywords": ["flat land", "panchayat approved", "bus route"],
        "description": "Flat plot in approved panchayat layout with direct bus route access.",
        "soil_type": "Clay Soil", "water_source": "Open Well", "road_access": "Village Road",
        "fencing": "Partial", "electricity": True, "irrigation": False,
        "nearby_town": "Trichy", "distance_from_town_km": 6.0, "view_count": 15,
    },
    {
        "city": "Chennai", "district": "Kancheepuram", "area": 2400, "area_unit": "sq_ft",
        "price": 4500000, "type": "Commercial Plot",
        "keywords": ["highway facing", "commercial zone", "high visibility"],
        "description": "Highway-facing commercial plot in Kancheepuram zoned for commercial use. Ideal for showroom or office.",
        "soil_type": "Sandy Soil", "water_source": "Borewell", "road_access": "National Highway",
        "fencing": "Compound Wall", "electricity": True, "irrigation": False,
        "nearby_town": "Chennai", "distance_from_town_km": 45.0, "view_count": 134,
    },
    {
        "city": "Erode", "district": "Erode", "area": 2.0, "area_unit": "acres",
        "price": 620000, "type": "Agricultural Land",
        "keywords": ["turmeric", "ground nut", "fertile soil"],
        "description": "Productive farmland used for turmeric and groundnut cultivation with canal irrigation.",
        "soil_type": "Red Soil", "water_source": "Canal", "road_access": "District Road",
        "fencing": "Wire Fence", "electricity": True, "irrigation": True,
        "nearby_town": "Erode", "distance_from_town_km": 9.0, "view_count": 33,
    },
    {
        "city": "Vellore", "district": "Vellore", "area": 1.5, "area_unit": "acres",
        "price": 480000, "type": "Agricultural Land",
        "keywords": ["well water", "coconut grove", "peaceful"],
        "description": "Peaceful agricultural land with an established coconut grove and open well.",
        "soil_type": "Laterite Soil", "water_source": "Open Well", "road_access": "State Highway",
        "fencing": "Wire Fence", "electricity": False, "irrigation": True,
        "nearby_town": "Vellore", "distance_from_town_km": 14.0, "view_count": 27,
    },
    {
        "city": "Tirunelveli", "district": "Tirunelveli", "area": 3.5, "area_unit": "acres",
        "price": 780000, "type": "Farm Land",
        "keywords": ["banana", "river nearby", "fertile"],
        "description": "Banana farm with river proximity and excellent soil quality near Tirunelveli.",
        "soil_type": "Alluvial Soil", "water_source": "River", "road_access": "District Road",
        "fencing": "Partial", "electricity": True, "irrigation": True,
        "nearby_town": "Tirunelveli", "distance_from_town_km": 7.0, "view_count": 51,
    },
    {
        "city": "Thanjavur", "district": "Thanjavur", "area": 4.0, "area_unit": "acres",
        "price": 950000, "type": "Agricultural Land",
        "keywords": ["paddy field", "Cauvery delta", "rich soil"],
        "description": "Premium paddy field in the fertile Cauvery delta zone with guaranteed water supply.",
        "soil_type": "Alluvial Soil", "water_source": "Canal", "road_access": "State Highway",
        "fencing": "Wire Fence", "electricity": True, "irrigation": True,
        "nearby_town": "Thanjavur", "distance_from_town_km": 5.0, "view_count": 77,
    },
    {
        "city": "Ooty", "district": "Nilgiris", "area": 0.75, "area_unit": "acres",
        "price": 3200000, "type": "Agricultural Land",
        "keywords": ["tea estate", "hill station", "scenic"],
        "description": "Small tea estate in the Nilgiris hills with scenic views and good road connectivity.",
        "soil_type": "Laterite Soil", "water_source": "Rainfed", "road_access": "District Road",
        "fencing": "Compound Wall", "electricity": True, "irrigation": False,
        "nearby_town": "Ooty", "distance_from_town_km": 3.0, "view_count": 112,
    },
    {
        "city": "Dindigul", "district": "Dindigul", "area": 2.2, "area_unit": "acres",
        "price": 530000, "type": "Agricultural Land",
        "keywords": ["granite soil", "borewell", "dry land"],
        "description": "Dry land with borewell and granite-red soil mix, suitable for millets and groundnut.",
        "soil_type": "Red Soil", "water_source": "Borewell", "road_access": "Village Road",
        "fencing": "None", "electricity": False, "irrigation": False,
        "nearby_town": "Dindigul", "distance_from_town_km": 18.0, "view_count": 9,
    },
    {
        "city": "Namakkal", "district": "Namakkal", "area": 1600, "area_unit": "sq_ft",
        "price": 280000, "type": "Residential Plot",
        "keywords": ["panchayat", "corner plot", "east facing"],
        "description": "East-facing residential plot in Namakkal panchayat layout. Clear title, ready to build.",
        "soil_type": "Red Soil", "water_source": "Borewell", "road_access": "District Road",
        "fencing": "Partial", "electricity": True, "irrigation": False,
        "nearby_town": "Namakkal", "distance_from_town_km": 3.0, "view_count": 22,
    },
    {
        "city": "Kumbakonam", "district": "Thanjavur", "area": 3.0, "area_unit": "acres",
        "price": 870000, "type": "Farm Land",
        "keywords": ["paddy", "temple town", "canal irrigation"],
        "description": "Well-irrigated farmland near Kumbakonam temple town, used for paddy cultivation.",
        "soil_type": "Alluvial Soil", "water_source": "Canal", "road_access": "State Highway",
        "fencing": "Wire Fence", "electricity": True, "irrigation": True,
        "nearby_town": "Kumbakonam", "distance_from_town_km": 6.0, "view_count": 45,
    },
    {
        "city": "Hosur", "district": "Krishnagiri", "area": 2000, "area_unit": "sq_ft",
        "price": 1800000, "type": "Commercial Plot",
        "keywords": ["industrial zone", "Hosur bypass", "investment"],
        "description": "Commercial plot in Hosur's industrial corridor. High capital appreciation zone near electronics hub.",
        "soil_type": "Red Soil", "water_source": "Borewell", "road_access": "National Highway",
        "fencing": "Compound Wall", "electricity": True, "irrigation": False,
        "nearby_town": "Hosur", "distance_from_town_km": 2.0, "view_count": 98,
    },
    {
        "city": "Pollachi", "district": "Coimbatore", "area": 6.0, "area_unit": "acres",
        "price": 1400000, "type": "Agricultural Land",
        "keywords": ["coconut", "turmeric", "river fed"],
        "description": "Large coconut and turmeric farm with river-fed irrigation near Pollachi.",
        "soil_type": "Black Soil", "water_source": "River", "road_access": "State Highway",
        "fencing": "Wire Fence", "electricity": True, "irrigation": True,
        "nearby_town": "Pollachi", "distance_from_town_km": 4.0, "view_count": 58,
    },
    {
        "city": "Karur", "district": "Karur", "area": 1.8, "area_unit": "acres",
        "price": 420000, "type": "Agricultural Land",
        "keywords": ["cotton", "black soil", "borewell"],
        "description": "Cotton-growing land with fertile black soil and borewell, close to state highway.",
        "soil_type": "Black Soil", "water_source": "Borewell", "road_access": "State Highway",
        "fencing": "Partial", "electricity": True, "irrigation": True,
        "nearby_town": "Karur", "distance_from_town_km": 10.0, "view_count": 19,
    },
    {
        "city": "Nagercoil", "district": "Kanyakumari", "area": 900, "area_unit": "sq_ft",
        "price": 750000, "type": "Residential Plot",
        "keywords": ["south tip", "sea breeze", "DTCP approved"],
        "description": "DTCP approved residential plot near Nagercoil with sea breeze and clear title.",
        "soil_type": "Sandy Soil", "water_source": "Open Well", "road_access": "District Road",
        "fencing": "Compound Wall", "electricity": True, "irrigation": False,
        "nearby_town": "Nagercoil", "distance_from_town_km": 2.0, "view_count": 37,
    },
    {
        "city": "Sivakasi", "district": "Virudhunagar", "area": 2.5, "area_unit": "acres",
        "price": 560000, "type": "Agricultural Land",
        "keywords": ["dryland", "fireworks zone", "sunflower"],
        "description": "Dryland suitable for sunflower and groundnut farming near Sivakasi.",
        "soil_type": "Red Soil", "water_source": "Rainfed", "road_access": "Village Road",
        "fencing": "None", "electricity": False, "irrigation": False,
        "nearby_town": "Sivakasi", "distance_from_town_km": 15.0, "view_count": 6,
    },
    {
        "city": "Pudukkottai", "district": "Pudukkottai", "area": 2000, "area_unit": "cents",
        "price": 340000, "type": "Flat Plot",
        "keywords": ["flat land", "road access", "clear title"],
        "description": "Flat plot with clear title in Pudukkottai town limits. Suitable for construction.",
        "soil_type": "Red Soil", "water_source": "Borewell", "road_access": "District Road",
        "fencing": "Wire Fence", "electricity": True, "irrigation": False,
        "nearby_town": "Pudukkottai", "distance_from_town_km": 1.0, "view_count": 11,
    },
    {
        "city": "Tiruvallur", "district": "Tiruvallur", "area": 1800, "area_unit": "sq_ft",
        "price": 2100000, "type": "Commercial Plot",
        "keywords": ["Chennai outskirts", "highway", "warehouse"],
        "description": "Highway-facing commercial plot near Chennai outskirts, ideal for warehouse or logistics hub.",
        "soil_type": "Sandy Soil", "water_source": "Borewell", "road_access": "National Highway",
        "fencing": "Compound Wall", "electricity": True, "irrigation": False,
        "nearby_town": "Chennai", "distance_from_town_km": 35.0, "view_count": 74,
    },
]


def main():
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]

    now = datetime.utcnow()
    inserted = 0
    skipped  = 0

    for i, prop in enumerate(PROPERTIES):
        doc = {
            **prop,
            "state": "Tamil Nadu",
            "seller_id": SELLER_ID,
            "status": "ACTIVE",
            "documents": DOCS,
            "images": IMAGES,
            "created_at": now - timedelta(days=len(PROPERTIES) - i),  # stagger dates
        }
        # Avoid exact duplicates (city + district + price + area)
        exists = db.properties.find_one({
            "city": prop["city"],
            "price": prop["price"],
            "area": prop["area"],
        })
        if exists:
            print(f"  [skip] {prop['city']} — already exists")
            skipped += 1
        else:
            db.properties.insert_one(doc)
            print(f"  [ok]   {prop['city']} ({prop['type']}, ₹{prop['price']:,.0f})")
            inserted += 1

    print(f"\nDone — {inserted} inserted, {skipped} skipped.")
    client.close()


if __name__ == "__main__":
    main()
