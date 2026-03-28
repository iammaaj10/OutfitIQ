from fastapi import APIRouter, HTTPException
from app.database import profiles_collection, inventory_collection
from app.ai.outfit_recommender import (
    filter_inventory,
    score_item,
    BODY_SHAPE_TIPS
)

router = APIRouter()

@router.get("/{user_email}")
def recommend(user_email: str):
    profile = profiles_collection.find_one({"email": user_email}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Body profile not found.")

    gender = profile.get("gender", "male")

    inventory = list(inventory_collection.find(
        {"$or": [{"gender": gender}, {"gender": "unisex"}]},
        {"_id": 0}
    ))

    if not inventory:
        raise HTTPException(status_code=404, detail="No inventory found.")

    # Filter by gender + occasion
    filtered = filter_inventory(inventory, profile)
    tops    = filtered["tops"]
    bottoms = filtered["bottoms"]
    outers  = filtered["outers"]

    if not tops and not bottoms:
        raise HTTPException(status_code=404, detail="No matching items for your profile.")

    # Score and rank each category independently
    def rank(items, limit=6):
        scored = sorted(items, key=lambda x: -score_item(x, profile))
        return scored[:limit]

    top_recs    = rank(tops,    limit=6)
    bottom_recs = rank(bottoms, limit=6)
    outer_recs  = rank(outers,  limit=4)

    return {
        "user":       user_email,
        "gender":     gender,
        "body_shape": profile["body_shape"],
        "skin_tone":  profile["skin_tone"],
        "occasion":   profile["occasion"],
        "style_tip":  BODY_SHAPE_TIPS.get(profile.get("body_shape", ""), ""),
        "tops":       top_recs,
        "bottoms":    bottom_recs,
        "outers":     outer_recs,
        "total_tops":    len(top_recs),
        "total_bottoms": len(bottom_recs),
        "total_outers":  len(outer_recs),
    }