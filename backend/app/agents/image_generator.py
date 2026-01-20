import openai
from typing import Optional
import uuid
from app.services.cloudinary_service import upload_image_from_url

class ImageGenerationManager:
    def __init__(self, openai_api_key: str):
        self.client = openai.AsyncOpenAI(api_key=openai_api_key)
    
    async def generate(self, prompt: str, meal_type: str = "prato") -> Optional[str]:
        if not prompt:
            return None
        
        try:
            type_context = {
                "prato": "a real dish/meal",
                "sobremesa": "a real dessert",
                "bebida": "a real beverage/drink"
            }
            item_type = type_context.get(meal_type, "a real dish")
            
            full_prompt = f"""REALISTIC homemade food photography of {item_type}: {prompt}

Style:
home-style cooking, simple and easy to prepare at home, everyday meal, casual presentation, realistic portions, natural lighting, domestic kitchen or table, simple white plate or bowl, no professional plating, no restaurant style, photorealistic.

IMPORTANT RULES:
- Food must look homemade and achievable
- Show ONLY real, commonly eaten foods
- Avoid gourmet, editorial or restaurant appearance
- Generate ONLY the specified type: {meal_type}"""

            response = await self.client.images.generate(
                model="dall-e-3",
                prompt=full_prompt,
                size="1024x1024",
                quality="standard",
                n=1
            )
            
            openai_url = response.data[0].url
            
            filename = f"suggestion_{uuid.uuid4().hex[:12]}"
            cloudinary_url = await upload_image_from_url(openai_url, filename)
            
            return cloudinary_url
        except Exception as e:
            print(f"Erro ao gerar imagem: {e}")
            return None
