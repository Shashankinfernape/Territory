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

import json

def load_district_cities():
    path = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "tamilnadu_city_divisions.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    district_cities = {}
    for dist, taluks in data.items():
        district_cities[dist] = [t["name"] for t in taluks]
    return district_cities

TN_DISTRICT_CITIES = load_district_cities()

DOCS = [
    {"type": "Patta", "url": "/uploads/documents/5aa6736462d44a049d7340a2df0e9a2a.pdf"},
    {"type": "Chitta", "url": "/uploads/documents/f5073b00463c47659fc69d96e29d1264.pdf"},
    {"type": "A-Register", "url": "/uploads/documents/bb9e51ecb74c421db55e9c515c4b1bbd.pdf"}
]

def download_lorem_images(keywords, prefix, target_count=45):
    os.makedirs("uploads/images", exist_ok=True)
    paths = []
    print(f"Fetching {target_count} images for keywords: {keywords}")
    
    for i in range(target_count):
        path = f"uploads/images/{prefix}_{i}.jpg"
        
        if os.path.exists(path):
            paths.append(f"/{path}")
            continue

        try:
            url = f"https://loremflickr.com/800/600/{keywords}?lock={i}"
            r = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
            if r.status_code == 200:
                with open(path, 'wb') as f:
                    f.write(r.content)
                paths.append(f"/{path}")
                print(f"  Downloaded {i+1}/{target_count}")
        except:
            continue
            
    return paths

def main():
    print("Starting massive unique image download via LoremFlickr...")
    farm_paths = download_lorem_images("india,agriculture,farm", "unique_farm", 45)
    plot_paths = download_lorem_images("india,land,plot", "unique_plot", 45)
    
    if len(farm_paths) < 45 or len(plot_paths) < 45:
        print("Warning: Didn't get enough images, but continuing with what we have.")
        
    properties_col.drop()
    
    properties = []
    seller_id = "Gxnu2odqz8aS651P1gZe1FcER2u2"
    
    farm_idx = 0
    plot_idx = 0
    
    # 15 Farms (Requires 45 images)
    for i in range(15):
        dist = random.choice(list(TN_DISTRICT_CITIES.keys()))
        city = random.choice(TN_DISTRICT_CITIES[dist])
        taluk = city
        p_type = random.choice(["Agricultural Land", "Farm Land"])
        
        images = []
        for _ in range(3):
            if farm_idx < len(farm_paths):
                images.append(farm_paths[farm_idx])
                farm_idx += 1
                
        if not images:
            continue

        properties.append({
            "city": city, "district": dist, "state": "Tamil Nadu",
            "area": round(random.uniform(1.0, 15.0), 1), "area_unit": "acres",
            "price": random.randint(1500000, 8500000), "type": p_type,
            "keywords": ["fertile", "water source", "greenery"],
            "description": f"Beautiful and highly fertile {p_type.lower()} available in the outskirts of {city}, {dist} District. Ideal for farming or long-term investment.",
            "documents": random.sample(DOCS, 2), "images": images,
            "soil_type": random.choice(["Red Soil", "Black Soil", "Alluvial Soil"]),
            "water_source": random.choice(["Borewell", "Canal", "River"]),
            "road_access": random.choice(["Village Road", "State Highway"]),
            "fencing": random.choice(["Wire Fence", "Compound Wall"]),
            "electricity": True, "irrigation": random.choice([True, False]),
            "nearby_town": city, "distance_from_town_km": round(random.uniform(5.0, 25.0), 1),
            "taluk": taluk, "seller_id": seller_id,
            "status": "ACTIVE", "view_count": random.randint(50, 500),
            "created_at": datetime.now(timezone.utc)
        })

    # 15 Plots (Requires 45 images)
    for i in range(15):
        dist = random.choice(list(TN_DISTRICT_CITIES.keys()))
        city = random.choice(TN_DISTRICT_CITIES[dist])
        taluk = city
        p_type = random.choice(["Residential Plot", "Commercial Plot", "Flat Plot"])
        
        images = []
        for _ in range(3):
            if plot_idx < len(plot_paths):
                images.append(plot_paths[plot_idx])
                plot_idx += 1
                
        if not images:
            continue

        properties.append({
            "city": city, "district": dist, "state": "Tamil Nadu",
            "area": round(random.uniform(1200, 5000)), "area_unit": "sq_ft",
            "price": random.randint(2500000, 15000000), "type": p_type,
            "keywords": ["highway facing", "investment", "clear title"],
            "description": f"Prime {p_type.lower()} located in a rapidly developing area of {city}, {dist} District. Ready for immediate construction.",
            "documents": random.sample(DOCS, 2), "images": images,
            "soil_type": "Red Soil", "water_source": "Borewell",
            "road_access": random.choice(["National Highway", "State Highway", "District Road"]),
            "fencing": random.choice(["Compound Wall", "None"]),
            "electricity": True, "irrigation": False,
            "nearby_town": city, "distance_from_town_km": round(random.uniform(1.0, 10.0), 1),
            "taluk": taluk, "seller_id": seller_id,
            "status": "ACTIVE", "view_count": random.randint(100, 800),
            "created_at": datetime.now(timezone.utc)
        })
        
    properties_col.insert_many(properties)
    print(f"Successfully seeded {len(properties)} unique properties with totally unique land images!")

if __name__ == "__main__":
    main()
