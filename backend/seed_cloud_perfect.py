import os
import random
import requests
from datetime import datetime, timezone
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv("MONGODB_URL"))
db = client[os.getenv("DATABASE_NAME")]
properties_col = db["properties"]

FARM_URLS = [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1592982537447-6f296d194cf2?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=800&auto=format&fit=crop"
]

PLOT_URLS = [
    "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1590487988256-9ed24133863e?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?q=80&w=800&auto=format&fit=crop"
]

DOCS = [
    {"type": "Patta", "url": "/uploads/documents/5aa6736462d44a049d7340a2df0e9a2a.pdf"},
    {"type": "Chitta", "url": "/uploads/documents/f5073b00463c47659fc69d96e29d1264.pdf"},
    {"type": "A-Register", "url": "/uploads/documents/bb9e51ecb74c421db55e9c515c4b1bbd.pdf"}
]

TN_CITIES = [
    "Coimbatore", "Chennai", "Madurai", "Salem", "Trichy", "Tirunelveli", 
    "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet", 
    "Sivakasi", "Karur", "Ooty", "Kodaikanal", "Hosur", "Nagercoil", "Kumbakonam"
]

def download_images():
    print("Downloading sample images to act as real user uploads...")
    os.makedirs("uploads/images", exist_ok=True)
    
    farm_paths = []
    for i, url in enumerate(FARM_URLS):
        path = f"uploads/images/sample_farm_{i}.jpg"
        if not os.path.exists(path):
            r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
            with open(path, 'wb') as f:
                f.write(r.content)
        farm_paths.append(f"/{path}")
        
    plot_paths = []
    for i, url in enumerate(PLOT_URLS):
        path = f"uploads/images/sample_plot_{i}.jpg"
        if not os.path.exists(path):
            r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
            with open(path, 'wb') as f:
                f.write(r.content)
        plot_paths.append(f"/{path}")
        
    return farm_paths, plot_paths

def main():
    properties_col.drop()
    farm_paths, plot_paths = download_images()
    
    properties = []
    seller_id = "Gxnu2odqz8aS651P1gZe1FcER2u2"
    
    for i in range(15):
        city = random.choice(TN_CITIES)
        p_type = random.choice(["Agricultural Land", "Farm Land"])
        images = random.sample(farm_paths, random.randint(3, 4))
        properties.append({
            "city": city, "district": city, "state": "Tamil Nadu",
            "area": round(random.uniform(1.0, 15.0), 1), "area_unit": "acres",
            "price": random.randint(1500000, 8500000), "type": p_type,
            "keywords": ["fertile", "water source", "greenery"],
            "description": f"Beautiful and highly fertile {p_type.lower()} available in the outskirts of {city}.",
            "documents": random.sample(DOCS, 2), "images": images,
            "soil_type": random.choice(["Red Soil", "Black Soil"]),
            "water_source": random.choice(["Borewell", "Canal", "River"]),
            "road_access": random.choice(["Village Road", "State Highway"]),
            "fencing": random.choice(["Wire Fence", "Compound Wall"]),
            "electricity": True, "irrigation": random.choice([True, False]),
            "nearby_town": city, "distance_from_town_km": round(random.uniform(5.0, 25.0), 1),
            "taluk": f"{city} Taluk", "seller_id": seller_id,
            "status": "ACTIVE", "view_count": random.randint(50, 500),
            "created_at": datetime.now(timezone.utc)
        })

    for i in range(15):
        city = random.choice(TN_CITIES)
        p_type = random.choice(["Residential Plot", "Commercial Plot", "Flat Plot"])
        images = random.sample(plot_paths, random.randint(3, 4))
        properties.append({
            "city": city, "district": city, "state": "Tamil Nadu",
            "area": round(random.uniform(1200, 5000)), "area_unit": "sq_ft",
            "price": random.randint(2500000, 15000000), "type": p_type,
            "keywords": ["highway facing", "investment", "clear title"],
            "description": f"Prime {p_type.lower()} located in a rapidly developing area of {city}.",
            "documents": random.sample(DOCS, 2), "images": images,
            "soil_type": "Red Soil", "water_source": "Borewell",
            "road_access": random.choice(["National Highway", "State Highway"]),
            "fencing": random.choice(["Compound Wall", "None"]),
            "electricity": True, "irrigation": False,
            "nearby_town": city, "distance_from_town_km": round(random.uniform(1.0, 10.0), 1),
            "taluk": f"{city} Taluk", "seller_id": seller_id,
            "status": "ACTIVE", "view_count": random.randint(100, 800),
            "created_at": datetime.now(timezone.utc)
        })
        
    properties_col.insert_many(properties)
    print("Successfully seeded 30 perfect ACTIVE properties with downloaded local images!")

if __name__ == "__main__":
    main()
