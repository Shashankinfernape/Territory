import os
import random
import asyncio
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# We will connect directly using MongoClient (sync) for the seed script
client = MongoClient(os.getenv("MONGODB_URL"))
db = client[os.getenv("DATABASE_NAME")]
properties_col = db["properties"]

# Guaranteed working direct Unsplash URLs
FARM_IMAGES = [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1592982537447-6f296d194cf2?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1535560946029-79a405625ff1?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1585806686154-1fa4a20b8f2d?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1599908154674-32551bfef2e2?q=80&w=800&auto=format&fit=crop"
]

PLOT_IMAGES = [
    "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1590487988256-9ed24133863e?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop"
]

DOCS = [
    {"type": "Patta", "url": "/uploads/documents/placeholder1.pdf"},
    {"type": "Chitta", "url": "/uploads/documents/placeholder2.pdf"},
    {"type": "A-Register", "url": "/uploads/documents/placeholder3.pdf"}
]

TN_CITIES = [
    "Coimbatore", "Chennai", "Madurai", "Salem", "Trichy", "Tirunelveli", 
    "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet", 
    "Sivakasi", "Karur", "Ooty", "Kodaikanal", "Hosur", "Nagercoil", "Kumbakonam"
]

def generate_properties():
    properties = []
    seller_id = "Gxnu2odqz8aS651P1gZe1FcER2u2" # The admin/showcase seller ID
    
    # Generate 15 Agricultural/Farm Lands
    for i in range(15):
        city = random.choice(TN_CITIES)
        p_type = random.choice(["Agricultural Land", "Farm Land"])
        images = random.sample(FARM_IMAGES, random.randint(3, 4))
        
        prop = {
            "city": city,
            "district": city,
            "state": "Tamil Nadu",
            "area": round(random.uniform(1.0, 15.0), 1),
            "area_unit": "acres",
            "price": random.randint(1500000, 8500000),
            "type": p_type,
            "keywords": ["fertile", "water source", "greenery"],
            "description": f"Beautiful and highly fertile {p_type.lower()} available in the outskirts of {city}. Excellent investment opportunity for farming or resort development.",
            "documents": random.sample(DOCS, 2),
            "images": images,
            "soil_type": random.choice(["Red Soil", "Black Soil", "Alluvial Soil"]),
            "water_source": random.choice(["Borewell", "Canal", "River"]),
            "road_access": random.choice(["Village Road", "State Highway"]),
            "fencing": random.choice(["Wire Fence", "Compound Wall", "None"]),
            "electricity": True,
            "irrigation": random.choice([True, False]),
            "nearby_town": city,
            "distance_from_town_km": round(random.uniform(5.0, 25.0), 1),
            "taluk": f"{city} Taluk",
            "seller_id": seller_id,
            "status": "VERIFIED",
            "view_count": random.randint(50, 500),
            "created_at": datetime.now(timezone.utc)
        }
        properties.append(prop)

    # Generate 15 Plots (Residential/Commercial)
    for i in range(15):
        city = random.choice(TN_CITIES)
        p_type = random.choice(["Residential Plot", "Commercial Plot", "Flat Plot"])
        images = random.sample(PLOT_IMAGES, random.randint(3, 4))
        
        prop = {
            "city": city,
            "district": city,
            "state": "Tamil Nadu",
            "area": round(random.uniform(1200, 5000)),
            "area_unit": "sq_ft",
            "price": random.randint(2500000, 15000000),
            "type": p_type,
            "keywords": ["highway facing", "investment", "clear title"],
            "description": f"Prime {p_type.lower()} located in a rapidly developing area of {city}. Ready for immediate construction with all necessary approvals.",
            "documents": random.sample(DOCS, 2),
            "images": images,
            "soil_type": "Red Soil",
            "water_source": "Borewell",
            "road_access": random.choice(["National Highway", "State Highway", "District Road"]),
            "fencing": random.choice(["Compound Wall", "None"]),
            "electricity": True,
            "irrigation": False,
            "nearby_town": city,
            "distance_from_town_km": round(random.uniform(1.0, 10.0), 1),
            "taluk": f"{city} Taluk",
            "seller_id": seller_id,
            "status": "VERIFIED",
            "view_count": random.randint(100, 800),
            "created_at": datetime.now(timezone.utc)
        }
        properties.append(prop)
        
    return properties

def main():
    print("Dropping old broken collection...")
    properties_col.drop()
    
    print("Generating 30 unique Tamil Nadu properties...")
    new_props = generate_properties()
    
    print("Inserting into Cloud MongoDB...")
    properties_col.insert_many(new_props)
    print("Success! 30 perfect properties inserted.")

if __name__ == "__main__":
    main()
