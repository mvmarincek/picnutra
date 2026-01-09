import openai
from typing import Dict, Any, List, Optional
from app.agents.json_utils import parse_json_safe
import json

MEAL_OPTIMIZER_INSTRUCTIONS = """
Você é um especialista em otimização de refeições. Sua função é:

1. Analisar a refeição atual e criar uma versão mais balanceada
2. Manter a "cara" do item original (não mudar completamente)
3. Fazer ajustes realistas e práticos
4. Estimar calorias e macros da versão otimizada
5. Gerar um prompt de imagem para visualização

REGRA CRÍTICA - TIPO DE ITEM:
- Se o tipo for "prato": sugira SOMENTE uma versão melhorada do prato de comida. NÃO inclua bebidas ou sobremesas.
- Se o tipo for "sobremesa": sugira SOMENTE uma versão melhorada da sobremesa. NÃO inclua pratos de comida ou bebidas.
- Se o tipo for "bebida": sugira SOMENTE uma versão melhorada da bebida. NÃO inclua pratos de comida ou sobremesas.

PRINCÍPIOS DE OTIMIZAÇÃO:
- Aumentar proteína se baixa
- Aumentar fibra/vegetais
- Reduzir gordura saturada se alta
- Reduzir açúcares simples
- Manter sabor e praticidade
- Respeitar restrições alimentares

REGRAS PARA O PROMPT DE IMAGEM:
- Descreva APENAS alimentos reais e existentes
- NÃO invente comidas fictícias ou combinações surreais
- Use nomes de alimentos comuns e reconhecíveis
- Descreva o item como seria servido em um restaurante real
- Seja específico sobre os ingredientes visíveis
- GERE SOMENTE o tipo de item solicitado (prato, sobremesa ou bebida)

Retorne SEMPRE um JSON válido no formato:
{
  "sugestao_melhorada_texto": "string (descrição do item otimizado)",
  "mudancas_sugeridas": ["string"],
  "calorias_nova_versao": {"central": number, "min": number, "max": number},
  "macros_nova_versao": {"proteina_g": number, "carbo_g": number, "gordura_g": number, "fibra_g": number},
  "prompt_para_imagem": "string (prompt em inglês descrevendo SOMENTE o tipo de item solicitado, sem inventar ingredientes)"
}
"""

class MealOptimizerAgent:
    def __init__(self, openai_api_key: str):
        self.client = openai.AsyncOpenAI(api_key=openai_api_key)
    
    async def optimize(
        self,
        itens: List[Dict],
        porcoes: List[Dict],
        calorias: Dict[str, float],
        macros: Dict[str, float],
        perfil: Optional[Dict[str, Any]] = None,
        meal_type: str = "prato"
    ) -> Dict[str, Any]:
        perfil_str = json.dumps(perfil, ensure_ascii=False) if perfil else "Perfil não informado"
        itens_str = json.dumps(itens, ensure_ascii=False)
        porcoes_str = json.dumps(porcoes, ensure_ascii=False)
        
        type_descriptions = {
            "prato": "prato de comida (NÃO inclua bebidas ou sobremesas na sugestão)",
            "sobremesa": "sobremesa (NÃO inclua pratos de comida ou bebidas na sugestão)",
            "bebida": "bebida (NÃO inclua pratos de comida ou sobremesas na sugestão)"
        }
        type_desc = type_descriptions.get(meal_type, meal_type)
        
        prompt = f"""Crie uma versão otimizada deste(a) {type_desc}.

TIPO DO ITEM: {meal_type}
IMPORTANTE: Sugira SOMENTE uma versão melhorada do tipo "{meal_type}". NÃO inclua outros tipos de itens.

ITENS ATUAIS:
{itens_str}

PORÇÕES ATUAIS:
{porcoes_str}

VALORES ATUAIS:
- Calorias: {calorias['central']} kcal
- Proteína: {macros['proteina_g']}g
- Carboidratos: {macros['carbo_g']}g
- Gordura: {macros['gordura_g']}g
- Fibra: {macros.get('fibra_g', 0)}g

PERFIL DO USUÁRIO:
{perfil_str}

Sugira uma versão melhorada mantendo a essência do {meal_type}.
O prompt de imagem deve descrever SOMENTE um(a) {meal_type}.
Retorne APENAS o JSON, sem texto adicional."""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": MEAL_OPTIMIZER_INSTRUCTIONS},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500
            )
            
            content = response.choices[0].message.content
            return parse_json_safe(content)
        except Exception as e:
            return {
                "sugestao_melhorada_texto": "Não foi possível gerar sugestão",
                "mudancas_sugeridas": [],
                "calorias_nova_versao": calorias,
                "macros_nova_versao": macros,
                "prompt_para_imagem": "",
                "erro": str(e)
            }
