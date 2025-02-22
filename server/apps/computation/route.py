# route.py
from fastapi import APIRouter, HTTPException
import base64
from io import BytesIO
from PIL import Image
from apps.computation.utils import analyze_image
from schema import ImageData
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post('', response_model=dict)
async def process_image(data: ImageData):
    try:
        # Extract and decode image
        image_part = data.image.split(",")[1]
        image_data = base64.b64decode(image_part)
        image = Image.open(BytesIO(image_data))
        
        # Process image
        analysis_results = analyze_image(image, data.dict_of_vars)
        
        if not analysis_results:
            logger.warning("No results returned from analysis")
            return {
                "status": "warning",
                "data": [],
                "message": "Analysis completed but no results were obtained"
            }
        
        return {
            "status": "success",
            "data": analysis_results,
            "message": "Analysis completed successfully"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Processing error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "message": "Analysis failed",
                "type": type(e).__name__
            }
        )