from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, profile

app = FastAPI(
    title="OutfitIQ API",
    description="AI Powered Virtual Stylist & Smart Dressing Room",
    version="1.0.0"
)

# CORS - Allow React to talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   
        
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(profile.router, prefix="/profile", tags=["Body Profile"])

@app.get("/", tags=["Health Check"])
def root():
    return {
        "message": "OutfitIQ API is running! 🚀",
        "docs": "Visit /docs to test all APIs"
    }
