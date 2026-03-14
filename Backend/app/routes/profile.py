from fastapi import APIRouter, HTTPException
from app.database import profiles_collection
from app.models.profile import BodyProfile

router = APIRouter()

@router.post("/save/{user_email}")
def save_profile(user_email: str, profile: BodyProfile):
    # Delete old profile if exists
    profiles_collection.delete_one({"email": user_email})

    # Save new profile
    profiles_collection.insert_one({
        "email": user_email,
        **profile.dict()
    })

    return {"message": "Body profile saved successfully ✅"}

@router.get("/get/{user_email}")
def get_profile(user_email: str):
    profile = profiles_collection.find_one(
        {"email": user_email},
        {"_id": 0}  # Don't return MongoDB _id
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile