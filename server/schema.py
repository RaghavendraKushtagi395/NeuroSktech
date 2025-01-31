# schema.py
from pydantic import BaseModel, field_validator
from typing import Dict

class ImageData(BaseModel):
    image: str
    dict_of_vars: Dict[str, float] = {}

    @field_validator('image')
    def validate_image(cls, v):
        if not v.startswith('data:image/'):
            raise ValueError("Invalid image format")
        if len(v) > 7 * 1024 * 1024:  # 7MB
            raise ValueError("Image too large")
        return v