
from __future__ import annotations
import os
from dotenv import load_dotenv

load_dotenv()


def enrich_with_llm(outfit: dict, profile: dict) -> dict:
    """
    Calls Gemini to replace why_this_works with a polished one-liner.
    The outfit dict is mutated in-place and returned.
    Failure is fully silent — fallback text is preserved.
    """
    try:
        from google import genai
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

        top_name    = outfit["top"]["name"]
        bottom_name = outfit["bottom"]["name"]
        outer_name  = outfit["outer"]["name"] if outfit.get("outer") else "no outer"
        score       = outfit["total_score"]
        body_shape  = profile.get("body_shape", "")
        skin_tone   = profile.get("skin_tone", "")
        occasion    = profile.get("occasion", "")

        prompt = (
            f"You are a fashion stylist. Write ONE sentence (max 20 words) explaining why "
            f"a {top_name} paired with {bottom_name} (outer: {outer_name}) "
            f"scores {score}/100 for a {body_shape} body shape with {skin_tone} skin tone "
            f"at a {occasion} occasion. Be specific, practical, no fluff."
        )

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        text = response.text.strip().strip('"')
        if text:
            outfit["why_this_works"] = text

    except Exception as e:
        print(f"⚠️  Gemini explainer skipped: {e}")

    return outfit