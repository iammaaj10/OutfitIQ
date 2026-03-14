from fastapi import APIRouter, HTTPException
from app.database import users_collection
from app.models.user import UserRegister, UserLogin, TokenResponse
from passlib.context import CryptContext
from jose import jwt
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os

load_dotenv()

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"])

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register")
def register(user: UserRegister):
    # Check duplicate email
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed = pwd_context.hash(user.password)

    # Save to DB
    users_collection.insert_one({
        "name": user.name,
        "email": user.email,
        "password": hashed,
        "created_at": datetime.utcnow()
    })

    return {"message": f"Welcome to OutfitIQ, {user.name}! Account created ✅"}

@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin):
    # Find user
    found = users_collection.find_one({"email": user.email})
    if not found:
        raise HTTPException(status_code=404, detail="User not found")

    # Check password
    if not pwd_context.verify(user.password, found["password"]):
        raise HTTPException(status_code=401, detail="Incorrect password")

    # Create JWT token
    token = create_token({"sub": str(found["_id"]), "email": user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "name": found["name"]
    }