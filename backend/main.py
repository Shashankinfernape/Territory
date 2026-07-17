import os
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from routers import auth, properties, admin, payments

load_dotenv()

logger = logging.getLogger("uvicorn.error")

# ---------------------------------------------------------------------------
# Rate limiter (optional — graceful no-op if slowapi not installed)
# ---------------------------------------------------------------------------
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    limiter = Limiter(key_func=get_remote_address)
    _slowapi_available = True
except ImportError:
    limiter = None
    _slowapi_available = False

app = FastAPI(
    title="TERRITORY API",
    description="Land marketplace API for verified agricultural and flat plot transactions.",
    version="1.0.0",
)

if _slowapi_available:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Fix: allow_origins=["*"] + allow_credentials=True is rejected by browsers.
# Origins are now read from the ALLOWED_ORIGINS env var (comma-separated).
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(admin.router)
app.include_router(payments.router)


# ---------------------------------------------------------------------------
# Global exception handler — never leak internal details to the client
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Log the full error server-side; return a safe generic message to the client."""
    origin = request.headers.get("origin", "")
    cors_headers = {}
    if origin in ALLOWED_ORIGINS:
        cors_headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    # Log full traceback on the server only
    logger.exception("Unhandled error on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
        headers=cors_headers,
    )


# ---------------------------------------------------------------------------
# Startup: create MongoDB indexes
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def create_indexes():
    from database import db, auth_db
    try:
        await auth_db.users.create_index("phone_number", unique=True, sparse=True, background=True)
        await db.properties.create_index("status", background=True)
        await db.properties.create_index("seller_id", background=True)
        await db.transactions.create_index("buyer_id", background=True)
        await db.transactions.create_index(
            [("buyer_id", 1), ("property_id", 1)],
            unique=True,
            background=True,
        )
        logger.info("MongoDB indexes created/verified.")
    except Exception as e:
        logger.warning("Index creation warning (may already exist): %s", e)


@app.get("/", tags=["health"])
async def root():
    return {"message": "TERRITORY API is running", "version": "1.0.0"}


@app.get("/api/v1/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
