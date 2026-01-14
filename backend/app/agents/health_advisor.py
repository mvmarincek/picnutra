import openai
from typing import Dict, Any, Optional
from app.agents.json_utils import parse_json_safe

HEALTH_ADVISOR_INSTRUCTIONS = """
Você é um consultor nutricional amigável e motivador, como um personal trainer de alimentação. 
Seu tom é sempre positivo, encorajador e prático.

=== REGRA CRÍTICA - DIFERENCIAÇÃO POR TIPO DE ITEM ===
Você DEVE adaptar suas sugestões conforme o TIPO do item analisado:

TIPO "prato" (refeição sólida):
- Sugestões culinárias são permitidas (azeite, temperos, métodos de preparo)
- Foque em balanceamento de macros, vegetais, proteínas
- Pode sugerir: adicionar azeite, temperos, substituir ingredientes

TIPO "sobremesa":
- PROIBIDO ABSOLUTAMENTE sugerir: azeite, sal, temperos salgados, métodos de preparo culinário
- PERMITIDO sugerir: redução de quantidade, versões com menos açúcar, acompanhar com frutas, consumo ocasional
- Tom: realista e não punitivo. Sobremesas fazem parte de uma alimentação equilibrada
- Foque em: moderação, frequência, porção adequada

TIPO "bebida":
- PROIBIDO sugerir: temperos, preparo culinário, ingredientes sólidos
- Se for bebida industrializada: sugerir versões sem açúcar, redução de frequência, moderação
- Se for bebida alcoólica: sugerir moderação, hidratação alternada com água
- PERMITIDO: trocar por versões mais saudáveis (refrigerante → água com gás, suco natural)

NUNCA misture recomendações de categorias diferentes!

DISCLAIMER IMPORTANTE - COMPLIANCE GOOGLE ADS:
- Este é um serviço EDUCATIVO e INFORMATIVO, NÃO é serviço médico
- NUNCA use linguagem prescritiva ou diagnóstica
- SEMPRE use termos de estimativa: "pode indicar", "sugere-se", "aproximadamente", "estima-se"
- NUNCA use: "você deve", "você precisa", "faça isso", "diagnóstico", "tratamento", "cura"
- PREFIRA: "considere", "pode ajudar", "uma opção seria", "sugere-se considerar"
- Todas as análises são ESTIMATIVAS baseadas em reconhecimento de imagem

PRINCÍPIOS BASEADOS EM NUTRIÇÃO MODERNA:
- Dieta Mediterrânea: priorize azeite, peixes, vegetais, grãos integrais
- Alimentação anti-inflamatória: evite ultraprocessados, açúcares refinados
- Densidade nutricional: valorize alimentos ricos em nutrientes por caloria
- Equilíbrio de macros: proteína adequada (1.2-2g/kg), carbos complexos, gorduras boas
- Fibras: mínimo 25g/dia para saúde intestinal e saciedade
- Hidratação: fundamental para metabolismo e energia

REGRAS DE ANÁLISE:
1. SEMPRE comece identificando algo positivo na refeição
2. Use linguagem encorajadora, nunca crítica ou julgadora
3. Dê dicas práticas e fáceis de implementar
4. Considere o objetivo do usuário (emagrecer, ganhar massa, etc.)
5. Mencione benefícios científicos quando relevante
6. Sugira pequenas mudanças, não transformações radicais

FORMATO DAS RECOMENDAÇÕES:
- Seja específico e acionável
- Use frases curtas e diretas
- Inclua o "porquê" de cada sugestão
- Máximo 3 recomendações focadas

REGRAS DE COMPLIANCE:
- NUNCA forneça diagnósticos médicos
- NUNCA prescreva dietas restritivas
- NUNCA sugira tratamentos para condições médicas
- Sempre inclua aviso de que não substitui profissional
- Celebre as boas escolhas do usuário
- Use sempre linguagem de estimativa e sugestão

Retorne SEMPRE um JSON válido no formato:
{
  "beneficios": ["string - pontos positivos da refeição"],
  "pontos_de_atencao": ["string - o que pode ser melhorado, sem ser crítico"],
  "recomendacoes_praticas": ["string - sugestões usando linguagem não prescritiva"],
  "aviso": "string - lembrete sobre natureza estimativa e consultar profissional"
}
"""

class HealthAdvisorAgent:
    def __init__(self, openai_api_key: str):
        self.client = openai.AsyncOpenAI(api_key=openai_api_key)
    
    async def analyze(
        self, 
        calorias: Dict[str, float],
        macros: Dict[str, float],
        perfil: Optional[Dict[str, Any]] = None,
        meal_type: str = "prato"
    ) -> Dict[str, Any]:
        perfil_context = ""
        if perfil:
            if perfil.get("objetivo"):
                objetivos_map = {
                    "emagrecer": "quer emagrecer de forma saudável",
                    "manter": "quer manter o peso atual",
                    "ganhar_massa": "quer ganhar massa muscular",
                    "saude_geral": "busca melhorar a saúde geral"
                }
                perfil_context += f"O usuário {objetivos_map.get(perfil['objetivo'], perfil['objetivo'])}. "
            if perfil.get("restricoes"):
                perfil_context += f"Restrições alimentares: {', '.join(perfil['restricoes'])}. "
            if perfil.get("alergias"):
                perfil_context += f"Alergias: {', '.join(perfil['alergias'])}. "
        
        if not perfil_context:
            perfil_context = "Perfil não informado - forneça dicas gerais de alimentação saudável."
        
        proteina_por_caloria = (macros['proteina_g'] * 4 / calorias['central'] * 100) if calorias['central'] > 0 else 0
        fibra = macros.get('fibra_g', 0)
        
        type_instructions = {
            "prato": "Este é um PRATO/REFEIÇÃO. Sugestões culinárias são permitidas.",
            "sobremesa": "Esta é uma SOBREMESA. PROIBIDO sugerir azeite, sal, temperos salgados. Foque em moderação e versões mais leves.",
            "bebida": "Esta é uma BEBIDA. PROIBIDO sugerir temperos ou preparo culinário. Foque em hidratação, versões sem açúcar, moderação."
        }
        type_context = type_instructions.get(meal_type, type_instructions["prato"])
        
        prompt = f"""Analise este item e forneça orientações motivadoras e práticas.

TIPO DO ITEM: {meal_type}
{type_context}

DADOS NUTRICIONAIS:
- Calorias: {calorias['central']:.0f} kcal (faixa: {calorias['min']:.0f}-{calorias['max']:.0f} kcal)
- Proteína: {macros['proteina_g']:.1f}g ({proteina_por_caloria:.1f}% das calorias)
- Carboidratos: {macros['carbo_g']:.1f}g
- Gordura: {macros['gordura_g']:.1f}g
- Fibra: {fibra:.1f}g

PERFIL DO USUÁRIO:
{perfil_context}

INSTRUÇÕES:
1. Identifique pelo menos 2 pontos positivos (sempre encontre algo bom!)
2. Se houver pontos de atenção, apresente de forma construtiva
3. Dê 3 dicas práticas e motivadoras, explicando o benefício de cada uma
4. Use tom amigável como um personal trainer de alimentação

Retorne APENAS o JSON, sem texto adicional."""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": HEALTH_ADVISOR_INSTRUCTIONS},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1200
            )
            
            content = response.choices[0].message.content
            result = parse_json_safe(content)
            if "aviso" not in result:
                result["aviso"] = "Esta análise é uma estimativa educativa baseada em reconhecimento de imagem. Os valores são aproximados e não substituem orientação de nutricionista ou médico."
            result["is_estimate"] = True
            return result
        except Exception as e:
            return {
                "beneficios": ["Parabéns por registrar sua refeição! O autoconhecimento alimentar é o primeiro passo para uma vida mais saudável."],
                "pontos_de_atencao": [],
                "recomendacoes_praticas": [
                    "Considere continuar registrando suas refeições para entender melhor seus padrões alimentares",
                    "Uma opção seria incluir vegetais coloridos em pelo menos duas refeições por dia",
                    "Manter-se hidratado pode ajudar no metabolismo e energia"
                ],
                "aviso": "Esta análise é uma estimativa educativa e não substitui orientação de nutricionista ou médico.",
                "is_estimate": True,
                "erro": str(e)
            }
