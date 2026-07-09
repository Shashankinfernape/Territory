from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import bcrypt
from datetime import datetime, timedelta
import jwt  # package: PyJWT
from typing import Optional
from database import get_db
from models import UserCreate, UserInDB, Token, TokenData, UserResponse
import os

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

SECRET_KEY = os.getenv("JWT_SECRET", "supersecretjwtkeyforprototyping")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone_number: str = payload.get("sub")
        if phone_number is None:
            raise credentials_exception
        token_data = TokenData(phone_number=phone_number)
    except jwt.PyJWTError:
        # Only catch JWT-specific errors so DB/network errors propagate normally.
        raise credentials_exception

    user = await db.users.find_one({"phone_number": token_data.phone_number})
    if user is None:
        raise credentials_exception
    return user


async def get_current_admin(current_user=Depends(get_current_user)):
    if current_user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db=Depends(get_db)):
    # phone_number format validated by the UserCreate.phone_must_be_10_digits validator.
    existing_user = await db.users.find_one({"phone_number": user.phone_number})
    if existing_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    user_dict = user.model_dump()
    user_dict["password_hash"] = get_password_hash(user_dict.pop("password"))

    new_user = UserInDB(**user_dict)
    # Use to_insert_dict() to exclude the None _id so MongoDB auto-generates it.
    result = await db.users.insert_one(new_user.to_insert_dict())

    created_user = await db.users.find_one({"_id": result.inserted_id})
    return UserResponse(
        id=str(created_user["_id"]),
        phone_number=created_user["phone_number"],
        role=created_user["role"],
        full_name=created_user.get("full_name"),
    )


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = await db.users.find_one({"phone_number": form_data.username})
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["phone_number"], "role": user["role"], "id": str(user["_id"])},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user=Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        phone_number=current_user["phone_number"],
        role=current_user["role"],
        full_name=current_user.get("full_name"),
    )
