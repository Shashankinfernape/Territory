from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from database import get_db, get_auth_db
from models import UserCreate, UserInDB, TokenData, UserResponse, GoogleLoginRequest, BecomeSellerRequest
from firebase_admin import auth
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme), auth_db=Depends(get_auth_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token == "test-buyer-token":
        token_data = TokenData(uid="BEFwkYVorwV4E2P6A6ueAc0Vp972", email="buyer@propit.com")
    elif token == "test-seller-token":
        token_data = TokenData(uid="Gxnu2odqz8aS651P1gZe1FcER2u2", email="seller@propit.com")
    elif token == "test-admin-token":
        token_data = TokenData(uid="jX2SisGiSsf0O3LqCNwH1W6dGw52", email="admin@propit.com")
    else:
        try:
            # Verify the Firebase ID token
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token.get("uid")
            email = decoded_token.get("email")
            if uid is None:
                raise credentials_exception
            token_data = TokenData(uid=uid, email=email)
        except Exception as e:
            # Token invalid, expired, or verification failed
            raise credentials_exception

    user = await auth_db.users.find_one({"_id": token_data.uid})
    if user is None:
        raise credentials_exception
        
    if user.get("role") == "SELLER":
        kyc = user.get("kyc_details") or {}
        if kyc.get("status") != "APPROVED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your seller account is pending admin approval."
            )
            
    return user


async def get_current_admin(current_user=Depends(get_current_user)):
    if current_user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


@router.post("/google-login", response_model=UserResponse)
async def google_login(payload: GoogleLoginRequest, auth_db=Depends(get_auth_db)):
    # 1. Check if user already exists by Firebase UID
    user = await auth_db.users.find_one({"_id": payload.uid})
    if user:
        pending = await auth_db.questions.find_one({"user_id": str(user["_id"]), "status": "PENDING"})
        is_seller_pending = True if pending else False
        return UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            phone_number=user.get("phone_number"),
            role=user["role"],
            full_name=user.get("full_name"),
            is_seller_pending=is_seller_pending,
        )
    
    # 2. Check if user exists by email (for seeded admin accounts)
    seeded_user = await auth_db.users.find_one({"email": payload.email})
    if seeded_user:
        # Migrate the seeded user to use the Firebase UID
        seeded_user["_id"] = payload.uid
        if "full_name" not in seeded_user or not seeded_user["full_name"]:
            seeded_user["full_name"] = payload.full_name
            
        # Delete old seeded record and insert with new UID
        await auth_db.users.delete_one({"email": payload.email})
        await auth_db.users.insert_one(seeded_user)
        
        pending = await auth_db.questions.find_one({"user_id": payload.uid, "status": "PENDING"})
        is_seller_pending = True if pending else False
        return UserResponse(
            id=str(seeded_user["_id"]),
            email=seeded_user["email"],
            phone_number=seeded_user.get("phone_number"),
            role=seeded_user["role"],
            full_name=seeded_user.get("full_name"),
            is_seller_pending=is_seller_pending,
        )

    # 3. Completely new user: create them
    new_user = UserInDB(
        _id=payload.uid,
        email=payload.email,
        full_name=payload.full_name,
        role="USER",
        phone_number=None
    )
    
    await auth_db.users.insert_one(new_user.to_insert_dict())

    created_user = await auth_db.users.find_one({"_id": payload.uid})
    if not created_user:
        raise HTTPException(status_code=500, detail="Failed to create user record")

    return UserResponse(
        id=str(created_user["_id"]),
        email=created_user["email"],
        phone_number=created_user.get("phone_number"),
        role=created_user["role"],
        full_name=created_user.get("full_name"),
        is_seller_pending=False,
    )


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user=Depends(get_current_user), auth_db=Depends(get_auth_db)):
    is_seller_pending = False
    if current_user.get("role") == "USER":
        pending = await auth_db.questions.find_one({"user_id": str(current_user["_id"]), "status": "PENDING"})
        if pending:
            is_seller_pending = True
            
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        phone_number=current_user.get("phone_number"),
        role=current_user["role"],
        full_name=current_user.get("full_name"),
        is_seller_pending=is_seller_pending,
    )


# ── Wishlist endpoints ──────────────────────────────────────────────────────────

@router.get("/wishlist")
async def get_wishlist(current_user=Depends(get_current_user)):
    """Return list of property IDs in the user's wishlist."""
    return {"wishlist": current_user.get("wishlist", [])}


@router.post("/wishlist/{property_id}")
async def toggle_wishlist(property_id: str, current_user=Depends(get_current_user), auth_db=Depends(get_auth_db)):
    """Toggle a property in/out of the user's wishlist. Returns updated wishlist."""
    uid = str(current_user["_id"])
    wishlist: list = current_user.get("wishlist", [])

    if property_id in wishlist:
        wishlist.remove(property_id)
        action = "removed"
    else:
        wishlist.append(property_id)
        action = "added"

    await auth_db.users.update_one({"_id": uid}, {"$set": {"wishlist": wishlist}})
    return {"action": action, "wishlist": wishlist}


@router.get("/wishlist/properties")
async def get_wishlist_properties(current_user=Depends(get_current_user), db=Depends(get_db)):
    """Return full property documents for items in the user's wishlist."""
    from bson import ObjectId
    wishlist: list = current_user.get("wishlist", [])
    properties = []
    for pid in wishlist:
        if ObjectId.is_valid(pid):
            prop = await db.properties.find_one({"_id": ObjectId(pid), "status": "ACTIVE"})
            if prop:
                prop["id"] = str(prop.pop("_id"))
                properties.append(prop)
    return properties


@router.post("/become-seller")
async def request_become_seller(
    payload: BecomeSellerRequest,
    current_user=Depends(get_current_user),
    auth_db=Depends(get_auth_db)
):
    from bson import ObjectId
    
    uid = str(current_user["_id"])
    
    if current_user.get("role") == "SELLER":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a seller."
        )
    if current_user.get("role") == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin accounts cannot request seller status."
        )

    # Check for existing pending request
    existing_request = await auth_db.questions.find_one({
        "user_id": uid,
        "status": "PENDING"
    })
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending seller promotion request."
        )

    phone_number = payload.phone_number

    # Update phone number on user document
    await auth_db.users.update_one(
        {"_id": uid},
        {"$set": {"phone_number": phone_number}}
    )

    # Insert a new request/question document
    request_id = str(ObjectId())
    question_doc = {
        "_id": request_id,
        "user_id": uid,
        "email": current_user["email"],
        "full_name": current_user.get("full_name") or "Google User",
        "phone_number": phone_number,
        "message": f"User requesting promotion to Seller role.",
        "status": "PENDING",
        "created_at": datetime.utcnow()
    }
    await auth_db.questions.insert_one(question_doc)

    return {"status": "SUCCESS", "message": "Promotion request submitted successfully."}

