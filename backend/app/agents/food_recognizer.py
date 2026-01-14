import openai
from typing import Dict, Any, Optional
import base64
import os
from app.core.config import settings
from app.agents.json_utils import parse_json_safe

FOOD_RECOGNIZER_INSTRUCTIONS = """
Você é um especialista em identificação de alimentos e bebidas em imagens.

=== REGRA MESTRA - PRODUTOS INDUSTRIALIZADOS ===
ANTES de qualquer análise, pergunte-se internamente:
"Este item é um produto industrializado, conhecido, com peso e calorias padronizados?"

PRODUTOS INDUSTRIALIZADOS CONHECIDOS incluem:
- Chocolates específicos (Sonho de Valsa, Bis, KitKat, Diamante Negro, etc.)
- Barras de chocolate (Lacta, Nestlé, Garoto, Hershey's, etc.)
- Biscoitos industrializados (Oreo, Trakinas, Club Social, Passatempo, etc.)
- Salgadinhos de pacote (Doritos, Ruffles, Cheetos, etc.)
- Bebidas em lata/garrafa (Coca-Cola, Guaraná, Red Bull, Heineken, Brahma, etc.)
- Iogurtes industrializados (Activia, Danone, Vigor, etc.)
- Achocolatados prontos (Toddynho, Nescau, etc.)
- Sorvetes industrializados (Kibon, Nestlé, Häagen-Dazs, etc.)

Se identificar um produto industrializado:
1. SINALIZE com "industrializado": true no JSON do item
2. Forneça o nome exato do produto quando possível
3. NÃO tente estimar peso pela imagem - use peso padrão do fabricante
4. A confiança deve ser "alto" se o produto for reconhecível

=== REGRA ABSOLUTAMENTE OBRIGATÓRIA - RESPEITE O TIPO SELECIONADO:
O usuário ESCOLHEU um tipo específico antes de enviar a imagem. Você DEVE analisar APENAS esse tipo:

- TIPO "prato": Identifique APENAS comida sólida (arroz, feijão, carne, frango, peixe, salada, legumes, massas, etc.)
  PROIBIDO INCLUIR: bebidas (vinho, cerveja, suco, água, refrigerante), sobremesas (sorvete, bolo, pudim)
  
- TIPO "sobremesa": Identifique APENAS sobremesas (bolo, sorvete, pudim, torta, doces, frutas como sobremesa)
  PROIBIDO INCLUIR: pratos de comida (arroz, carne, salada), bebidas (suco, refrigerante, vinho)
  
- TIPO "bebida": Identifique APENAS bebidas (água, suco, vinho, cerveja, café, refrigerante, drinks)
  PROIBIDO INCLUIR: pratos de comida (arroz, carne, salada), sobremesas (bolo, sorvete)

MESMO QUE A IMAGEM MOSTRE OUTROS ITENS, IGNORE-OS COMPLETAMENTE.
Se a imagem mostrar um prato com vinho ao lado e o tipo for "prato", NÃO mencione o vinho.
Se a imagem mostrar sobremesa com café e o tipo for "sobremesa", NÃO mencione o café.

Para cada item identificado:
1. Fornecer o nome canônico (nome padrão em português)
2. Listar alternativas plausíveis se houver incerteza
3. Atribuir um nível de confiança (baixo/medio/alto)
4. Sinalizar itens que mais afetam calorias (óleo, queijo, molhos, açúcar, álcool)

IDENTIFICAÇÃO DE BEBIDAS - ANÁLISE DETALHADA:
Ao identificar bebidas, considere:

1. TIPO DE RECIPIENTE (determina volume aproximado):
   - Copo americano/rocks: 190-250ml
   - Copo long drink/highball: 300-350ml
   - Tulipa/cálice de cerveja: 300-400ml
   - Caneca de chopp: 400-500ml
   - Caneca de café/chá: 200-300ml
   - Xícara de café expresso: 50-80ml
   - Xícara de chá: 150-200ml
   - Taça de vinho: 150-250ml
   - Taça de champagne: 125-150ml
   - Copo de shot: 40-60ml
   - Lata padrão: 350ml
   - Long neck: 355ml
   - Garrafa pequena: 300ml
   - Garrafa média: 600ml
   - Garrafa grande: 1000-2000ml

2. APARÊNCIA DO LÍQUIDO:
   - Transparente com gás: água com gás, refrigerante sprite/schweppes
   - Transparente sem gás: água
   - Amarelo claro com gás/espuma: cerveja/chopp
   - Amarelo escuro: cerveja artesanal/premium
   - Marrom escuro com gás: refrigerante cola, guaraná
   - Marrom claro: chá gelado, mate
   - Laranja: suco de laranja, fanta
   - Vermelho/rosa: suco de morango/uva, vinho rosé
   - Roxo: suco de uva, açaí
   - Verde: suco verde, limão
   - Branco/bege: leite, café com leite, vitamina
   - Preto: café
   - Vermelho escuro: vinho tinto
   - Dourado claro: vinho branco, espumante

3. CONTEXTO E ELEMENTOS VISUAIS:
   - Espuma branca no topo: cerveja/chopp
   - Gelo visível: bebida gelada
   - Canudo: refrigerante, suco, drinks
   - Rodela de limão/laranja: drink alcoólico ou água saborizada
   - Folhas de hortelã: mojito, suco verde
   - Guarda-chuva/decoração: drink tropical

REGRAS IMPORTANTES:
- Nunca inventar alimentos que não aparecem na imagem
- Se incerto, liste alternativas e marque incerteza
- Seja objetivo e preciso
- Para bebidas, SEMPRE tente identificar o tipo específico
- Não faça suposições sem base visual
- IGNORE completamente itens que não sejam do tipo solicitado

Retorne SEMPRE um JSON válido no formato:
{
  "itens_identificados": [
    {"nome": "string", "alternativas": ["string"], "confianca": "baixo|medio|alto", "industrializado": boolean}
  ],
  "itens_caloricos_incertos": ["string"],
  "observacoes_visuais": ["string"]
}

NOTA: O campo "industrializado" deve ser true para produtos com peso/calorias padronizados de fábrica, false para alimentos preparados/naturais.
"""

class FoodRecognizerAgent:
    def __init__(self, openai_api_key: str):
        self.client = openai.AsyncOpenAI(api_key=openai_api_key)
    
    async def identify(
        self, 
        image_url: str, 
        meal_type: str = "prato",
        user_notes: Optional[str] = None,
        weight_grams: Optional[float] = None,
        volume_ml: Optional[float] = None
    ) -> Dict[str, Any]:
        try:
            if image_url.startswith("/uploads/"):
                file_path = os.path.join(settings.UPLOAD_DIR, image_url.replace("/uploads/", ""))
                if os.path.exists(file_path):
                    with open(file_path, "rb") as f:
                        image_data = base64.b64encode(f.read()).decode("utf-8")
                    ext = file_path.split(".")[-1].lower()
                    mime_type = "image/jpeg" if ext in ["jpg", "jpeg"] else "image/png"
                    image_content = {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{image_data}"}
                    }
                else:
                    return {"itens_identificados": [], "erro": "Imagem não encontrada"}
            else:
                image_content = {"type": "image_url", "image_url": {"url": image_url}}
            
            type_descriptions = {
                "prato": "prato de comida (IGNORE bebidas e sobremesas na imagem)",
                "sobremesa": "sobremesa (IGNORE pratos de comida e bebidas na imagem)",
                "bebida": "bebida (IGNORE pratos de comida e sobremesas na imagem)"
            }
            type_desc = type_descriptions.get(meal_type, f"{meal_type}")
            
            extra_info = []
            if user_notes:
                extra_info.append(f"Observações do usuário: {user_notes}")
            if weight_grams:
                extra_info.append(f"Peso informado pelo usuário: {weight_grams}g")
            if volume_ml:
                extra_info.append(f"Volume máximo do recipiente: {volume_ml}ml")
            
            extra_text = "\n".join(extra_info) if extra_info else ""
            
            prompt = f"""Analise esta imagem de um(a) {type_desc}. 
Identifique SOMENTE os alimentos/bebidas do tipo "{meal_type}" visíveis.
IGNORE completamente outros tipos de itens na imagem.
{extra_text}
Retorne APENAS o JSON, sem texto adicional."""
            
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": FOOD_RECOGNIZER_INSTRUCTIONS},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            image_content
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            return parse_json_safe(content)
        except Exception as e:
            return {
                "itens_identificados": [],
                "itens_caloricos_incertos": [],
                "observacoes_visuais": [f"Erro na análise: {str(e)}"],
                "erro": str(e)
            }
