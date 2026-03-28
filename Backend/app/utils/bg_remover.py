"""
Background removal utility.
Plug in your preferred bg removal API here (e.g. remove.bg, Clipdrop).
"""
import os
import base64
import requests
from dotenv import load_dotenv

load_dotenv()


def remove_background(image_url: str) -> str | None:
    """
    Attempt to remove background from image_url.
    Returns base64 data URI string on success, None on failure.
    """
    api_key = os.getenv("REMOVEBG_API_KEY")
    if not api_key:
        return None

    try:
        response = requests.post(
            "https://api.remove.bg/v1.0/removebg",
            data={"image_url": image_url, "size": "auto"},
            headers={"X-Api-Key": api_key},
            timeout=15,
        )
        if response.status_code == 200:
            b64 = base64.b64encode(response.content).decode("utf-8")
            return f"data:image/png;base64,{b64}"
        return None
    except Exception as e:
        print(f"bg_remover error: {e}")
        return None