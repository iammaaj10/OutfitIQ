from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, profile, recommend, tryon

app = FastAPI(
    title="OutfitIQ API",
    description="AI Powered Virtual Stylist & Smart Dressing Room",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/auth",      tags=["Authentication"])
app.include_router(profile.router,   prefix="/profile",   tags=["Body Profile"])
app.include_router(recommend.router, prefix="/recommend", tags=["Recommendations"])
app.include_router(tryon.router,     prefix="/tryon",     tags=["Virtual Try-On"])

@app.get("/", tags=["Health Check"])
def root():
    return {
        "message": "OutfitIQ API is running! 🚀",
        "docs":    "Visit /docs to test all APIs"
    }