from app.database import profiles_collection, inventory_collection

profile = profiles_collection.find_one({"email": "maajb1122@gmail.com"}, {"_id": 0})
print("PROFILE:", profile)
print("INVENTORY TOTAL:", inventory_collection.count_documents({}))
print("MALE:", inventory_collection.count_documents({"gender": "male"}))
print("FEMALE:", inventory_collection.count_documents({"gender": "female"}))

if profile:
    gender = profile.get("gender")
    occasion = profile.get("occasion")
    tops = list(inventory_collection.find({"gender": gender, "category": "top"}, {"_id": 0, "id": 1, "occasion": 1}))
    bottoms = list(inventory_collection.find({"gender": gender, "category": "bottom"}, {"_id": 0, "id": 1, "occasion": 1}))
    print(f"Gender: {gender}, Occasion: {occasion}")
    print(f"Tops found: {len(tops)}", tops)
    print(f"Bottoms found: {len(bottoms)}", bottoms)