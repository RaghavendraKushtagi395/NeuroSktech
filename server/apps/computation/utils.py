# utils.py
import google.generativeai as genai
import ast
import json
import re
import logging
from PIL import Image
from typing import List, Dict, Any
from constants import GEMINI_API_KEY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

genai.configure(api_key=GEMINI_API_KEY)

def clean_response_text(text: str) -> str:
    """Clean and format the response text for parsing."""
    logger.info(f"Original response text: {text}")
    text = re.sub(r'```(?:json)?\n?(.*?)\n?```', r'\1', text, flags=re.DOTALL)
    text = re.sub(r'\s+', ' ', text).strip()
    logger.info(f"Cleaned response text: {text}")
    return text

def detect_image_content_type(img: Image) -> str:
    """Detect whether the image contains mathematical expressions or other concepts."""
    model = genai.GenerativeModel(model_name="gemini-2.0-flash")
    detection_prompt = (
        "Does this image contain:\n"
        "1. Mathematical expression/equation/formula/graphical problem/\n"
        "2. Drawing/symbol/concept\n"
        "Reply with ONLY the number (1 or 2)"
    )
    
    try:
        response = model.generate_content([detection_prompt, img])
        response_text = clean_response_text(response.text)
        return 'math' if '1' in response_text else 'concept'
    except Exception as e:
        logger.error(f"Error in content type detection: {e}")
        return 'math'

def analyze_image(img: Image, dict_of_vars: dict) -> List[Dict[str, Any]]:
    """Analyze an image containing mathematical expressions or concepts and return results."""
    content_type = detect_image_content_type(img)
    model = genai.GenerativeModel(model_name="gemini-2.0-flash")
    
    if content_type == 'math':
        prompt = (
            "Analyze this image and return ONLY a JSON array containing the mathematical solution or if it is a graphical problem calculate the solution."
            "Format: [{\"expr\": \"expression\", \"result\": value, \"assign\": false}]\n"
            f"Available variables: {json.dumps(dict_of_vars, ensure_ascii=False)}\n"
            "Return ONLY the JSON array, no other text."
        )
    else:
        prompt = (
            "This image shows a drawing or symbol. "
            "Provide a very brief analysis in this exact format:\n"
            "[{\"expr\": \"key element (max 3-4 words)\", "
            "\"result\": \"core concept (1-2 words)\", \"assign\": false}]\n"
            "Example 1: [{\"expr\": \"heart shape\", \"result\": \"love\"}]\n"
            "Example 2: [{\"expr\": \"peace symbol\", \"result\": \"peace\"}]\n"
            "Return ONLY the JSON array, no explanations."
        )
    
    try:
        response = model.generate_content([prompt, img])
        logger.info(f"Received response from Gemini API")
        
        cleaned_text = clean_response_text(response.text)
        
        try:
            answers = json.loads(cleaned_text)
        except json.JSONDecodeError:
            fixed_text = cleaned_text.replace("'", '"')
            fixed_text = re.sub(r'(\w+):', r'"\1":', fixed_text)
            try:
                answers = json.loads(fixed_text)
            except json.JSONDecodeError:
                try:
                    answers = ast.literal_eval(cleaned_text)
                except Exception:
                    logger.error("All parsing attempts failed")
                    return []
        
        formatted_answers = []
        for answer in answers:
            formatted_answer = {
                'expr': str(answer.get('expr', '')),
                'result': answer.get('result', ''),
                'assign': bool(answer.get('assign', False))
            }
            formatted_answers.append(formatted_answer)
        
        logger.info(f"Formatted answers: {formatted_answers}")
        return formatted_answers
        
    except Exception as e:
        logger.error(f"Error in analyze_image: {e}", exc_info=True)
        return []