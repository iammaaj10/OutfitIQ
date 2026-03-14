from pydantic import BaseModel
from typing import Optional

class BodyProfile(BaseModel):
    height: float          
    weight: float          
    chest: float           
    waist: float           
    hip: float             
    shoulder_width: float  
    skin_tone: str         
    body_shape: str        
    gender: str           
    occasion: Optional[str] = "casual"  