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

REGRA CRÍTICA - PERFIL DO USUÁRIO:
- SEMPRE respeite o OBJETIVO do usuário (emagrecer, ganhar massa, manter peso, saúde geral)
- NUNCA sugira alimentos que estejam nas RESTRIÇÕES do usuário (vegetariano, vegano, sem glúten, etc.)
- NUNCA sugira alimentos que contenham ingredientes das ALERGIAS do usuário
- Se o usuário quer emagrecer: priorize redução calórica, mais fibras e proteínas
- Se o usuário quer ganhar massa: priorize aumento proteico e calorias de qualidade
- Se o usuário é vegetariano/vegano: use APENAS proteínas vegetais (tofu, leguminosas, etc.)

=== REGRA CRÍTICA - SUGESTÕES POR TIPO DE ITEM ===

TIPO "prato" (refeição sólida):
- Sugestões culinárias são permitidas (trocar óleo por azeite, adicionar temperos, mudar método de preparo)
- Pode sugerir: adicionar vegetais, trocar carboidratos refinados por integrais, aumentar proteína
- Foque em: balanceamento de macros, fibras, densidade nutricional

TIPO "sobremesa":
- PROIBIDO ABSOLUTAMENTE sugerir: azeite, sal, temperos salgados, proteínas (frango, carne), vegetais salgados
- PERMITIDO sugerir:
  * Versão com menos açúcar ou adoçante natural
  * Porção menor mantendo satisfação
  * Acompanhar com frutas frescas
  * Versão com chocolate amargo (maior % cacau)
  * Trocar creme por iogurte natural
  * Adicionar castanhas/nozes (em doces compatíveis)
- Tom: positivo, sobremesas fazem parte de alimentação equilibrada quando consumidas com moderação

TIPO "bebida":
- PROIBIDO sugerir: temperos, preparo culinário, ingredientes sólidos, azeite
- PERMITIDO sugerir:
  * Versão sem açúcar/zero (para refrigerantes)
  * Versão light (para sucos industrializados)
  * Trocar refrigerante por água com gás e limão
  * Reduzir frequência de consumo
  * Alternar com água
  * Para alcoólicas: moderação, versões menos calóricas
- Para bebidas industrializadas: NÃO sugerir preparo caseiro como única opção

PROIBIÇÕES ABSOLUTAS (nunca fazer):
- Sugerir azeite ou temperos salgados para sobremesas
- Sugerir preparo culinário para bebidas prontas
- Misturar recomendações de categorias diferentes
- Transformar sobremesa em prato salgado
- Transformar bebida em comida sólida

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
