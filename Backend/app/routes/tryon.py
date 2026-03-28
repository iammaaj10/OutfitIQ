from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from app.database import inventory_collection
import requests as req_lib

router = APIRouter()

# ── Cache ─────────────────────────────────────────
bg_cache = {}


# ── Models ───────────────────────────────────────
class TryOnRequest(BaseModel):
    image:     str
    top_id:    Optional[str] = None
    bottom_id: Optional[str] = None


# ── Proxy Image — fixes CORS ──────────────────────
@router.get("/proxy-image")
def proxy_image(url: str):
    """Proxy external images to avoid CORS issues in canvas"""
    try:
        response = req_lib.get(
            url,
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        content_type = response.headers.get("content-type", "image/jpeg")
        return Response(
            content=response.content,
            media_type=content_type,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "public, max-age=86400"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Get Clothing Image ────────────────────────────
@router.get("/clothing/{item_id}")
def get_clothing_nobg(item_id: str):
    """Get clothing image — tries bg removal, falls back to original"""

    # Check cache first
    if item_id in bg_cache:
        return {"success": True, "image": bg_cache[item_id]}

    # Get item from DB
    item = inventory_collection.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    image_url = item.get("image")
    if not image_url:
        raise HTTPException(status_code=400, detail="No image found")

    # Try background removal
    try:
        from Backend.app.utils.bg_remover import remove_background
        result = remove_background(image_url)
        if result:
            bg_cache[item_id] = result
            return {"success": True, "image": result}
    except Exception as e:
        print(f"BG removal failed: {e}")

    # Fallback — return proxied original
    proxied = f"/tryon/proxy-image?url={image_url}"
    return {"success": False, "image": image_url}