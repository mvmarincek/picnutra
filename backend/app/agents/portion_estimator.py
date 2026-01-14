import openai
from typing import Dict, Any, List, Optional
import json
import base64
import os
from app.core.config import settings
from app.agents.json_utils import parse_json_safe

PORTION_ESTIMATOR_INSTRUCTIONS = """
Você é um especialista em estimativa de porções alimentares com anos de experiência.
Sua função é estimar porções COM AUTONOMIA, sem depender de perguntas ao usuário.

=== REGRA MESTRA - PRODUTOS INDUSTRIALIZADOS ===
ANTES de qualquer estimativa visual, verifique:
"Este item é um produto industrializado, conhecido, com peso e calorias padronizados?"

Se o item for identificado como "industrializado": true, você DEVE:
1. NÃO tentar estimar peso pela imagem - use SEMPRE o peso padrão do fabricante
2. Assumir a porção padrão de fábrica (não inventar)
3. Confiança deve ser "alto" pois valores são conhecidos

PESOS PADRÃO DE PRODUTOS INDUSTRIALIZADOS:
- Sonho de Valsa: 25g (unidade)
- Bis: 20g (pacote individual), 126g (caixa)
- KitKat: 41.5g (barra 4 dedos)
- Diamante Negro: 20g (tablete pequeno), 90g (barra)
- Oreo: 36g (pacote 3 biscoitos)
- Coca-Cola lata: 350ml
- Coca-Cola long neck: 250ml
- Guaraná Antarctica lata: 350ml
- Red Bull: 250ml
- Cerveja lata: 350ml
- Cerveja long neck: 355ml
- Toddynho: 200ml
- Nescau pronto: 200ml
- Activia: 100g (pote individual)
- Iogurte Danone: 100-170g (variar por tipo)
- Yakult: 80ml

Se o item NÃO for industrializado, prossiga com estimativa visual normal.

PRINCÍPIO FUNDAMENTAL:
- NUNCA faça perguntas ao usuário. Você é o especialista.
- Use seu conhecimento e a análise visual para fazer as melhores estimativas.
- Em caso de dúvida, use valores médios/típicos brasileiros.
- Amplie a faixa min/max quando houver incerteza, mas SEMPRE forneça uma estimativa.

REFERÊNCIAS VISUAIS PARA ESCALA:
- Prato raso padrão brasileiro: 25-27cm diâmetro
- Prato fundo: 20-22cm diâmetro
- Prato de sobremesa: 19cm

VOLUMES PADRÃO DE COPOS E RECIPIENTES (MUITO IMPORTANTE):

COPOS COMUNS:
- Copo americano (transparente, baixo): 190ml
- Copo americano cheio: 180ml de líquido
- Copo de requeijão: 250ml
- Copo long drink/highball (alto, fino): 300-350ml
- Copo tumbler/rocks (baixo, largo): 250-300ml
- Copo de água de restaurante: 300ml

COPOS DE CERVEJA/CHOPP:
- Tulipa padrão: 300ml
- Tulipa grande: 400ml
- Caneca de chopp pequena: 300ml
- Caneca de chopp média: 400ml
- Caneca de chopp grande: 500ml
- Copo caldereta: 350ml
- Copo weizen (alto, curvado): 500ml

XÍCARAS E CANECAS:
- Xícara de café expresso: 50ml
- Xícara de café média: 100ml
- Xícara de chá: 180ml
- Caneca padrão: 300-350ml
- Caneca grande: 400-500ml

TAÇAS:
- Taça de vinho tinto: 200-250ml (servido 150ml)
- Taça de vinho branco: 180ml (servido 120ml)
- Taça de champagne/flauta: 150ml (servido 125ml)
- Taça de coquetel/martini: 150ml
- Taça de margarita: 250ml
- Copo de shot/dose: 50ml

GARRAFAS E LATAS:
- Lata de refrigerante/cerveja: 350ml
- Latinha mini: 220ml
- Latão: 473ml
- Long neck: 355ml
- Garrafa de água pequena: 300-330ml
- Garrafa de água média: 500ml
- Garrafa de água grande: 1,5L

ESTIMATIVA DE NÍVEL DE LÍQUIDO:
- Copo cheio: 90% do volume total
- Copo quase cheio: 75% do volume
- Copo pela metade: 50% do volume
- Copo com pouco: 25% do volume

PORÇÕES TÍPICAS BRASILEIRAS:
- Arroz (1 colher de servir cheia): 100-150g
- Feijão (1 concha média): 80-100g
- Bife/filé médio: 100-150g
- Frango grelhado (filé): 120-180g
- Batata frita (porção individual): 100-150g
- Salada (prato de acompanhamento): 50-80g
- Óleo de preparo por porção: 5-10ml (sempre assuma uso moderado)

BEBIDAS - ANÁLISE DETALHADA:
1. Identifique o tipo de recipiente e seu volume padrão
2. Estime o nível de líquido (cheio, meio, pouco)
3. Calcule: volume_recipiente × nível_percentual = volume_real

Exemplos:
- Tulipa de chopp cheia = 300ml × 0.90 = 270ml
- Copo long drink pela metade = 350ml × 0.50 = 175ml
- Caneca de café cheia = 300ml × 0.85 = 255ml

BEBIDAS - VALORES NUTRICIONAIS APROXIMADOS (por 100ml):
- Cerveja: 40-45 kcal
- Chopp: 40-45 kcal
- Refrigerante comum: 40-45 kcal
- Refrigerante zero: 0-2 kcal
- Suco natural: 40-60 kcal
- Suco de caixinha: 45-55 kcal
- Vinho tinto: 85 kcal
- Vinho branco: 80 kcal
- Café sem açúcar: 2 kcal
- Café com açúcar (1 sachê): 20 kcal
- Leite integral: 60 kcal
- Água de coco: 20 kcal

ÓLEOS E GORDURAS:
- Comida frita (batata, pastel, etc): assuma 10-15ml de óleo absorvido por 100g
- Comida grelhada/refogada: assuma 5-10ml de óleo por porção
- Salada temperada: assuma 10ml de azeite
- NUNCA pergunte sobre óleo. Estime baseado no tipo de preparo visível.

REGRAS ABSOLUTAS:
1. NUNCA retorne questions. O array questions deve ser sempre vazio.
2. Use a imagem para determinar tamanhos relativos ao prato/copo visível.
3. Forneça sempre valor central E faixa min/max.
4. Em caso de incerteza, aumente a faixa mas dê uma estimativa.
5. Liste incertezas em fatores_incerteza, não como perguntas.
6. Para bebidas, SEMPRE identifique o tipo de copo e estime o volume corretamente.

Retorne SEMPRE um JSON válido no formato:
{
  "porcoes": [
    {
      "item": "string",
      "peso_g_ml_central": number,
      "faixa_min": number,
      "faixa_max": number,
      "confianca": "baixo|medio|alto"
    }
  ],
  "questions": [],
  "fatores_incerteza": ["string - liste aqui as incertezas, mas NÃO faça perguntas"]
}
"""

class PortionEstimatorAgent:
    def __init__(self, openai_api_key: str):
        self.client = openai.AsyncOpenAI(api_key=openai_api_key)
    
    async def estimate(
        self, 
        image_url: str, 
        itens_identificados: List[Dict], 
        answers: Optional[Dict[str, str]] = None
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
                    return {"porcoes": [], "questions": [], "fatores_incerteza": ["Imagem não encontrada"]}
            else:
                image_content = {"type": "image_url", "image_url": {"url": image_url}}
            
            itens_str = json.dumps(itens_identificados, ensure_ascii=False)
            
            prompt = f"""Analise esta imagem e estime as porções dos alimentos identificados.
Você é o especialista. NÃO faça perguntas. Estime tudo com base na imagem e seu conhecimento.

Itens identificados:
{itens_str}

IMPORTANTE: 
- Retorne questions como array vazio [].
- Use valores típicos brasileiros quando não puder determinar visualmente.
- Para bebidas, assuma o tipo mais provável pelo contexto e aparência.
- Para óleo/gordura, estime baseado no método de preparo visível.

Retorne APENAS o JSON, sem texto adicional."""
            
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": PORTION_ESTIMATOR_INSTRUCTIONS},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            image_content
                        ]
                    }
                ],
                max_tokens=1500
            )
            
            content = response.choices[0].message.content
            result = parse_json_safe(content)
            
            result["questions"] = []
            
            if "fatores_incerteza" not in result:
                result["fatores_incerteza"] = []
            return result
        except Exception as e:
            return {
                "porcoes": [],
                "questions": [],
                "fatores_incerteza": [f"Erro na estimativa: {str(e)}"],
                "erro": str(e)
            }
