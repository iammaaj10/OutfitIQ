from __future__ import annotations
from typing import Optional
from app.ai.gemini_explainer import enrich_with_llm  # ✅ fixed

COLOR_HARMONY: dict[str, dict[str, int]] = {
    "neutral": {"neutral": 10, "cool": 15, "warm": 15, "bright": 12},
    "cool":    {"cool":  8,  "neutral": 15, "warm":  5, "bright": 10},
    "warm":    {"warm":  8,  "neutral": 15, "cool":  5, "bright":  8},
    "bright":  {"bright": 5, "neutral": 12, "cool": 10, "warm":   8},
}

SAME_COLOR_PENALTY: dict[str, int] = {
    "blue":   -10,
    "green":  -10,
    "red":    -15,
    "pink":   -12,
    "orange": -12,
    "brown":   -8,
    "beige":   -5,
    "white":    0,
    "black":    0,
    "grey":    -3,
}

BODY_SHAPE_MATCH   = 20
BODY_SHAPE_PARTIAL =  8

SKIN_TONE_AFFINITY: dict[str, list[str]] = {
    "fair":   ["cool", "bright", "neutral"],
    "light":  ["cool", "bright", "neutral"],
    "medium": ["warm", "neutral", "bright"],
    "olive":  ["warm", "cool",   "neutral"],
    "tan":    ["warm", "bright", "neutral"],
    "dark":   ["bright", "warm", "neutral"],
    "deep":   ["bright", "warm", "cool"],
}
SKIN_TONE_SCORE = 12

OCCASION_ALLOWED: dict[str, list[str]] = {
    "wedding":      ["wedding", "formal"],
    "formal":       ["formal", "professional"],
    "professional": ["professional", "formal", "casual"],
    "casual":       ["casual", "daily", "professional"],
    "daily":        ["daily", "casual"],
}

BODY_SHAPE_TIPS: dict[str, str] = {
    "rectangle":         "Layered clothing adds definition to your frame",
    "hourglass":         "Fitted clothing highlights your balanced proportions",
    "pear":              "Dark bottoms and bright tops balance your silhouette",
    "apple":             "V-necks and straight cuts elongate your frame",
    "inverted_triangle": "Wide-leg pants balance your broad shoulders",
}


def filter_inventory(inventory: list[dict], profile: dict) -> dict[str, list[dict]]:
    gender            = profile.get("gender", "male")
    occasion          = profile.get("occasion", "casual")
    allowed_occasions = OCCASION_ALLOWED.get(occasion, [occasion])

    tops, bottoms, outers = [], [], []

    for item in inventory:
        item_gender = item.get("gender", "unisex")
        if item_gender not in ("unisex", gender):
            continue
        if not any(o in allowed_occasions for o in item.get("occasion", [])):
            continue
        cat = item.get("category")
        if cat == "top":
            tops.append(item)
        elif cat == "bottom":
            bottoms.append(item)
        elif cat == "outer":
            outers.append(item)

    return {"tops": tops, "bottoms": bottoms, "outers": outers}


def score_item(item: dict, profile: dict) -> int:
    score      = 0
    body_shape = profile.get("body_shape", "")
    skin_tone  = profile.get("skin_tone", "")

    suitable_shapes = item.get("suitable_body_shapes", [])
    if suitable_shapes:
        score += BODY_SHAPE_MATCH if body_shape in suitable_shapes else 0
    else:
        score += BODY_SHAPE_PARTIAL

    color_family = item.get("color_family", "neutral")
    if color_family in SKIN_TONE_AFFINITY.get(skin_tone, []):
        score += SKIN_TONE_SCORE

    if skin_tone in item.get("suitable_skin_tones", []):
        score += 8

    return score


def score_pair(top: dict, bottom: dict, profile: dict, outer: Optional[dict] = None) -> int:
    total = 0
    total += score_item(top, profile)
    total += score_item(bottom, profile)

    top_fam    = top.get("color_family", "neutral")
    bottom_fam = bottom.get("color_family", "neutral")
    total += COLOR_HARMONY.get(top_fam, {}).get(bottom_fam, 5)

    shared = set(top.get("colors", [])) & set(bottom.get("colors", []))
    for color in shared:
        total += SAME_COLOR_PENALTY.get(color, -5)

    if outer:
        outer_fam = outer.get("color_family", "neutral")
        total += score_item(outer, profile)
        total += COLOR_HARMONY.get(outer_fam, {}).get(top_fam, 5)

    max_possible = (BODY_SHAPE_MATCH + SKIN_TONE_SCORE + 8) * 2 + 15
    return max(0, min(100, round((total / max_possible) * 100)))


def pick_best_outer(outers: list[dict], top: dict, profile: dict) -> Optional[dict]:
    if not outers:
        return None

    top_fam = top.get("color_family", "neutral")
    scored  = []
    for outer in outers:
        s = score_item(outer, profile)
        s += COLOR_HARMONY.get(outer.get("color_family", "neutral"), {}).get(top_fam, 5)
        scored.append((s, outer))

    scored.sort(key=lambda x: -x[0])
    return scored[0][1]


def _color_desc(top: dict, bottom: dict) -> str:
    top_colors    = ", ".join(top.get("colors", ["unknown"])).title()
    bottom_colors = ", ".join(bottom.get("colors", ["unknown"])).title()
    top_fam       = top.get("color_family", "neutral")
    bottom_fam    = bottom.get("color_family", "neutral")
    raw           = COLOR_HARMONY.get(top_fam, {}).get(bottom_fam, 5)
    label         = {15: "excellent", 12: "great", 10: "good", 8: "decent"}.get(raw, "acceptable")
    return f"{top_colors} top × {bottom_colors} bottom — {label} color pairing"


def _why_desc(top: dict, bottom: dict, profile: dict, score: int, outer: Optional[dict]) -> str:
    parts = [
        f"Scored {score}/100 for your {profile.get('body_shape')} figure "
        f"and {profile.get('skin_tone')} skin tone.",
        f"Both pieces suit {profile.get('occasion')} occasions.",
    ]
    if outer:
        parts.append(f"The {outer.get('name', 'outer layer')} completes the look.")
    return " ".join(parts)


def generate_outfits(profile: dict, inventory: list[dict], n: int = 6) -> list[dict]:
    filtered = filter_inventory(inventory, profile)
    tops     = filtered["tops"]
    bottoms  = filtered["bottoms"]
    outers   = filtered["outers"]

    if not tops or not bottoms:
        return []

    tops    = sorted(tops,    key=lambda t: -score_item(t, profile))[:12]
    bottoms = sorted(bottoms, key=lambda b: -score_item(b, profile))[:12]

    pairs: list[tuple[int, dict, dict]] = []
    for top in tops:
        for bottom in bottoms:
            s = score_pair(top, bottom, profile)
            pairs.append((s, top, bottom))

    pairs.sort(key=lambda x: -x[0])

    used_tops   : set[str] = set()
    used_bottoms: set[str] = set()
    outfits     : list[dict] = []

    for score, top, bottom in pairs:
        if len(outfits) >= n:
            break
        if top["id"] in used_tops or bottom["id"] in used_bottoms:
            continue

        used_tops.add(top["id"])
        used_bottoms.add(bottom["id"])

        outer       = pick_best_outer(outers, top, profile)
        total_price = top["price"] + bottom["price"] + (outer["price"] if outer else 0)

        outfits.append({
            "outfit_id":          f"{top['id']}_{bottom['id']}",
            "top":                top,
            "bottom":             bottom,
            "outer":              outer,
            "total_score":        score,
            "color_coordination": _color_desc(top, bottom),
            "why_this_works":     _why_desc(top, bottom, profile, score, outer),
            "style_tip":          BODY_SHAPE_TIPS.get(profile.get("body_shape", ""), ""),
            "total_price":        total_price,
            "occasion":           profile.get("occasion"),
            "gender":             profile.get("gender"),
        })

    return outfits


def get_recommendations(
    profile: dict,
    inventory: list[dict],
    n: int = 6,
    use_llm_explanations: bool = True,
) -> list[dict]:
    outfits = generate_outfits(profile, inventory, n=n)

    if not outfits:
        return []

    if use_llm_explanations:
        outfits = [enrich_with_llm(o, profile) for o in outfits]

    return outfits