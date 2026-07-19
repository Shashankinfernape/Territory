from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


# ---------------------------------------------------------------------------
# Shared base — avoids duplicate to_insert_dict() on every MongoDB model
# ---------------------------------------------------------------------------
class MongoInsertBase(BaseModel):
    def to_insert_dict(self) -> dict:
        """Return a dict safe for MongoDB insertion.

        Excludes the ``_id`` key entirely when it is None so MongoDB can
        auto-generate the ObjectId.  Passing ``_id: None`` causes a
        WriteError because MongoDB rejects null _id values.
        """
        return self.model_dump(by_alias=True, exclude_none=True)


# ---------------------------------------------------------------------------
# Structured document item — replaces the unvalidated List[dict]
# ---------------------------------------------------------------------------
class DocumentItem(BaseModel):
    type: str   # e.g. "Patta", "Chitta", "FMB Sketch"
    url: str    # relative path served from /uploads/


# ---------------------------------------------------------------------------
# Auth models
# ---------------------------------------------------------------------------
import uuid

class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    mobile_number: str
    alternate_number: Optional[str] = None
    email: str
    pincode: str
    flat_house_no: str
    floor: str
    street_locality: str
    city: str
    district: str
    state: str
    landmark: Optional[str] = None
    address_type: str  # Home, Work, Neighbour

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    uid: Optional[str] = None
    email: Optional[str] = None


class KYCDetails(BaseModel):
    aadhaar_number: str
    pan_number: str
    status: str = "PENDING"


class GoogleLoginRequest(BaseModel):
    uid: str
    email: str
    full_name: Optional[str] = None
    photo_url: Optional[str] = None

class GoogleSignupRequest(GoogleLoginRequest):
    address: Address



class UserCreate(BaseModel):
    uid: str
    email: str
    phone_number: Optional[str] = None
    role: str = "USER"
    full_name: Optional[str] = None
    kyc_details: Optional[KYCDetails] = None
    address: Optional[Address] = None
    saved_addresses: List[Address] = []

    @field_validator("phone_number")
    @classmethod
    def phone_must_be_10_digits(cls, v: Optional[str]) -> Optional[str]:
        """Enforce exactly 10 numeric digits for Indian phone numbers, if provided."""
        if v is not None:
            if not v.isdigit() or len(v) != 10:
                raise ValueError("phone_number must be exactly 10 digits")
        return v


class UserInDB(MongoInsertBase):
    id: str = Field(alias="_id")  # Firebase uid
    email: str
    phone_number: Optional[str] = None
    role: str
    full_name: Optional[str] = None
    photo_url: Optional[str] = None
    kyc_details: Optional[KYCDetails] = None
    address: Optional[dict] = None
    saved_addresses: List[dict] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserResponse(BaseModel):
    id: str
    email: str
    phone_number: Optional[str] = None
    role: str
    full_name: Optional[str] = None
    photo_url: Optional[str] = None
    address: Optional[Address] = None
    saved_addresses: List[Address] = []
    is_seller_pending: Optional[bool] = None


# ---------------------------------------------------------------------------
# Property models
# ---------------------------------------------------------------------------

class PropertyCreate(BaseModel):
    city: str
    district: str = ""
    state: str = "Tamil Nadu"
    area: float
    area_unit: str  # acres, sq_ft, cents, hectares
    price: float
    type: str  # Agricultural Land, Flat Plot, Farm Land, Residential Plot, Commercial Plot
    keywords: List[str] = []
    description: Optional[str] = None
    documents: List[DocumentItem] = []
    images: List[str] = []
    # Extra details for better search
    soil_type: Optional[str] = None        # Red, Black, Alluvial, Laterite
    water_source: Optional[str] = None     # Borewell, Canal, River, Rainfed, None
    road_access: Optional[str] = None      # National Highway, State Highway, Village Road, No Road
    fencing: Optional[str] = None          # Compound Wall, Wire Fence, Partial, None
    electricity: bool = False
    irrigation: bool = False
    nearby_town: Optional[str] = None
    distance_from_town_km: Optional[float] = None
    taluk: Optional[str] = ""


class PropertyUpdate(BaseModel):
    """Fields a seller is permitted to change."""
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    price: Optional[float] = None
    type: Optional[str] = None
    area_unit: Optional[str] = None
    keywords: Optional[List[str]] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    soil_type: Optional[str] = None
    water_source: Optional[str] = None
    road_access: Optional[str] = None
    fencing: Optional[str] = None
    electricity: Optional[bool] = None
    irrigation: Optional[bool] = None
    nearby_town: Optional[str] = None
    distance_from_town_km: Optional[float] = None
    taluk: Optional[str] = None


class PropertyInDB(MongoInsertBase, PropertyCreate):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    seller_id: str
    status: str = "PENDING_VERIFICATION"
    view_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PropertyResponse(PropertyCreate):
    id: str
    seller_id: str
    status: str
    view_count: int
    is_edit_pending: Optional[bool] = False
    original_details: Optional[Dict[str, Any]] = None
    rejection_info: Optional[Dict[str, Any]] = None


class BecomeSellerRequest(BaseModel):
    phone_number: str

    @field_validator("phone_number")
    @classmethod
    def phone_must_be_10_digits(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 10:
            raise ValueError("phone_number must be exactly 10 digits")
        return v

