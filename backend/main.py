import os
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from routers import auth, properties, admin, payments

load_dotenv()

app = FastAPI(
    title="TERRITORY API",
    description="Land marketplace API for verified agricultural and flat plot transactions.",
    version="1.0.0",
)

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


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return a JSON 500 with CORS headers so the browser sees the real error."""
    origin = request.headers.get("origin", "*")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={"Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true"},
    )


@app.get("/", tags=["health"])
async def root():
    return {"message": "TERRITORY API is running", "version": "1.0.0"}


@app.get("/api/v1/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
