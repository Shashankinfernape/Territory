import asyncio, os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def run():
    client = AsyncIOMotorClient(os.getenv('MONGODB_URL'))
    db = client[os.getenv('DATABASE_NAME')]
    props = await db.properties.find().sort('created_at', -1).to_list(length=5)
    print([str(p['_id']) + ' | ' + p.get('city','') + ' | ' + p.get('status','') for p in props])
    await asyncio.sleep(0.1)

asyncio.run(run())
