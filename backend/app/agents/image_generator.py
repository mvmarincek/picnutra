import openai
from typing import Optional

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
            
            full_prompt = f"""REALISTIC food photography of {item_type}: {prompt}

IMPORTANT RULES:
- Show ONLY real, existing foods that are commonly eaten
- Do NOT invent or hallucinate fictional foods
- Do NOT create surreal or impossible food combinations
- The item must look like something from a real restaurant or home kitchen
- Generate ONLY the type specified: {meal_type}

Style: Professional food photography, natural daylight, shallow depth of field, top-down 45-degree angle view, on appropriate serving ware, minimal garnish, photorealistic, high resolution."""

            response = await self.client.images.generate(
                model="dall-e-3",
                prompt=full_prompt,
                size="1024x1024",
                quality="standard",
                n=1
            )
            return response.data[0].url
        except Exception as e:
            print(f"Erro ao gerar imagem: {e}")
            return None
