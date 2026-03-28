import sys, os, json, random, time, requests, base64
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import inventory_collection
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# ── Add ALL your Cloudinary URLs here ────────────────────────────────────────
# Both old and new — script skips already-tagged ones automatically
CLOUDINARY_URLS = [
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838547/male_orange_jacket_hsvgpv.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838545/men_white_tshirt_c3dp7v.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838545/male_white_shirt_hddgki.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838542/male_skin_shirt_lhbpyh.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838540/male_darkgreen_shirt_obsmzp.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838540/male_white_hoodie_vnsxtg.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838539/male_skiinyblack_jean_bs8idt.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838536/male_black_jean_vgqzfy.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838536/male_red_tshirt_gymdkh.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838535/male_leather_jacket_kusjka.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838534/male_formal_trouser_jpxj1w.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838532/male_line_shirt_t6i5k4.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838531/female_blue_denim_jean_vtucur.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838531/male_gray_shirt_gfxe36.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838523/male_black_tshirt_k8oo13.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838520/male_brown_jacket_yxw6g8.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838520/male_darkblue_shirt_b3kxhc.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838511/male_blue_jean_anirjt.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838511/male_darkblue_jean_lm1tzj.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838496/male_baggy_jean_lqr3j9.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838496/female_weddng_dress_uy2irg.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838496/female_wedding2_dress_plrlii.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838495/male_black_shirt_iuxxaq.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838493/femle_black_short_jean_xgbmrr.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838489/female_trench2_coat_nvvwki.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838489/female_trench_coat_caxkae.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838489/female_blue_jean_j61stp.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838489/female_party2_wear_jntcrc.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838489/female_short_jean_tivcri.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838488/female_pink_blouse_olapby.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838486/female_party_wear_ztbrjy.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838485/blue_jean_goxwhc.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838484/blue_shreded_jean_og2swi.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838483/black_hoodie_ry9tsl.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838483/female_black_hoodie_xgsuug.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1773838483/female_casual_dress_bjhxcf.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1774678713/female_wedding4_dress_rewrcd.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1774678702/female_kurti_plixpa.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1774678693/female_wedding3_dress_hulqxg.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1774678673/gray_sweat_shirt_sheujc.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1774678649/female_casual1_ee3rdp.png",
    "https://res.cloudinary.com/duaemmg4c/image/upload/v1774678692/female_party3_wear_xcxluv.png",

    # ── ADD NEW IMAGES HERE ──────────────────────────────────────────────────
    # "https://res.cloudinary.com/your_account/image/upload/vXXXX/new_image.png",
]


# ── Gemini Vision Prompt ──────────────────────────────────────────────────────
TAGGING_PROMPT = """
You are a fashion expert AI. Analyze this clothing image carefully and return ONLY a valid JSON object with NO extra text, no markdown, no backticks.

Return exactly this structure:
{
  "name": "descriptive name e.g. Classic White Formal Shirt",
  "category": "top" or "bottom" or "outer",
  "gender": "male" or "female" or "unisex",
  "occasion": ["casual", "daily", "formal", "professional", "wedding"] — pick ALL that apply,
  "colors": ["primary color"] — use: white, black, blue, navy, red, green, grey, brown, orange, pink, beige, multicolor, yellow, purple,
  "color_family": "neutral" or "cool" or "warm" or "bright",
  "fit": "slim" or "regular" or "oversized" or "fitted" or "flared" or "straight",
  "style": "casual" or "formal" or "ethnic" or "streetwear" or "smart-casual",
  "suitable_body_shapes": pick ALL that truly apply from ["rectangle", "hourglass", "pear", "apple", "inverted_triangle"],
  "suitable_skin_tones": pick ALL that truly apply from ["fair", "light", "medium", "olive", "tan", "dark", "deep"],
  "brand_guess": "H&M" or "Zara" or "Levi's" or "Arrow" or "Van Heusen" or "Zudio" or "FabIndia" or "Biba" or "W" or "Manyavar" or "Forever 21" or "FabAlley" or "Mango" or "Unknown",
  "price_range": "budget" or "mid" or "premium"
}

Rules:
- suitable_body_shapes: slim fit tops = rectangle/hourglass/inverted_triangle. Flared skirts = pear. V-necks = apple. Oversized = rectangle/pear.
- suitable_skin_tones: bright colors = dark/deep. Pastels = fair/light. Neutrals = everyone. Earth tones = medium/olive/tan.
- color_family: white/black/grey/beige = neutral. Blue/green/purple = cool. Red/orange/brown/yellow = warm. Pink/multicolor/bright = bright.
- occasion: formal shirts = formal+professional. Jeans = casual+daily. Wedding dress = wedding+formal. Hoodies = casual+daily.
- Full dress/lehenga/ethnic set → category = "top".
"""

# ── Pricing ───────────────────────────────────────────────────────────────────
PRICE_RANGES = {
    ("top",    "budget"):  (299,  799),
    ("top",    "mid"):     (799,  2499),
    ("top",    "premium"): (2499, 8999),
    ("bottom", "budget"):  (499,  999),
    ("bottom", "mid"):     (999,  2999),
    ("bottom", "premium"): (2999, 5999),
    ("outer",  "budget"):  (799,  1499),
    ("outer",  "mid"):     (1499, 3999),
    ("outer",  "premium"): (3999, 9999),
}

BRANDS = {
    "male":   ["Arrow", "Van Heusen", "H&M", "Zudio", "Levi's", "Zara"],
    "female": ["Zara", "Mango", "H&M", "FabAlley", "W", "Forever 21"],
    "ethnic": ["FabIndia", "Manyavar", "Biba", "W"],
    "unisex": ["H&M", "Zudio", "Zara"],
}


def get_price(category, price_range):
    lo, hi = PRICE_RANGES.get((category, price_range), (499, 2999))
    return random.randint(lo, hi)


def get_brand(gender, style, occasion):
    if "wedding" in occasion or style == "ethnic":
        return random.choice(BRANDS["ethnic"])
    return random.choice(BRANDS.get(gender, BRANDS["unisex"]))


def get_sizes(gender):
    return (
        ["S", "M", "L", "XL", "XXL"] if gender == "male"
        else ["XS", "S", "M", "L", "XL"]
    )


def fetch_image_b64(url):
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    return base64.b64encode(response.content).decode("utf-8")


def tag_image(url, retries=3):
    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[{
                    "role": "user",
                    "parts": [
                        {"text": TAGGING_PROMPT},
                        {"inline_data": {
                            "mime_type": "image/png",
                            "data": fetch_image_b64(url)
                        }}
                    ]
                }]
            )
            raw = response.text.strip()
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()
            return json.loads(raw)

        except Exception as e:
            print(f"   ⚠️  Attempt {attempt + 1} failed: {e}")
            if attempt < retries - 1:
                time.sleep(3)
    return None


def build_item(url, tags, item_id):
    gender      = tags.get("gender", "unisex")
    category    = tags.get("category", "top")
    occasion    = tags.get("occasion", ["casual"])
    style       = tags.get("style", "casual")
    price_range = tags.get("price_range", "mid")
    brand       = tags.get("brand_guess", "Unknown")

    if brand == "Unknown":
        brand = get_brand(gender, style, occasion)

    name = tags.get("name", "Clothing Item")
    if brand not in name:
        name = f"{brand} {name}"

    return {
        "id":                   item_id,
        "name":                 name,
        "category":             category,
        "gender":               gender,
        "occasion":             occasion,
        "colors":               tags.get("colors", ["multicolor"]),
        "color_family":         tags.get("color_family", "neutral"),
        "fit":                  tags.get("fit", "regular"),
        "style":                style,
        "suitable_body_shapes": tags.get("suitable_body_shapes", ["rectangle", "hourglass"]),
        "suitable_skin_tones":  tags.get("suitable_skin_tones", ["fair", "medium", "dark", "deep"]),
        "sizes":                get_sizes(gender),
        "price":                get_price(category, price_range),
        "brand":                brand,
        "brand_tier":           price_range,
        "stock":                random.randint(10, 50),
        "image":                url,
        "tags":                 [gender, category] + occasion,
        "ai_tagged":            True,
    }


def build():
    # Get already tagged URLs — skip them
    existing_urls = set(
        doc["image"] for doc in inventory_collection.find({}, {"image": 1})
    )

    urls_to_tag = [u for u in CLOUDINARY_URLS if u not in existing_urls]

    if not urls_to_tag:
        print("✅ All images already tagged.")
        print(f"   Total in DB: {inventory_collection.count_documents({})}")
        return

    print(f"🔍 {len(urls_to_tag)} new images to tag | {len(existing_urls)} already exist\n")

    counter = {}
    success = 0
    failed  = []

    for i, url in enumerate(urls_to_tag):
        filename = url.split("/")[-1]
        print(f"[{i+1}/{len(urls_to_tag)}] Tagging: {filename}")

        tags = tag_image(url)
        if not tags:
            print(f"   ❌ Failed — skipping\n")
            failed.append(url)
            continue

        gender   = tags.get("gender", "unisex")
        category = tags.get("category", "top")
        key      = f"{gender[:1].upper()}_{category[:1].upper()}"
        counter[key] = counter.get(key, 0) + 1

        existing_count = inventory_collection.count_documents({
            "id": {"$regex": f"^{key}_"}
        })
        item_id = f"{key}_{(existing_count + counter[key]):03d}"

        item = build_item(url, tags, item_id)
        inventory_collection.insert_one(item)

        print(f"   ✅ {item_id} | {gender} | {category} | {item['name']}")
        print(f"      Colors: {item['colors']} | Shapes: {item['suitable_body_shapes']}\n")

        success += 1
        time.sleep(1)  # respect rate limits

    print(f"\n{'='*50}")
    print(f"✅ Done! Tagged {success} new | {len(failed)} failed")
    print(f"   Total in DB: {inventory_collection.count_documents({})}")

    if failed:
        print(f"\n⚠️  Failed URLs — re-run to retry:")
        for u in failed:
            print(f"   {u}")


if __name__ == "__main__":
    build()