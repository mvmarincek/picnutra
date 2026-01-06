from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import User, Meal, MealAnalysis, Job, JobStatus, Profile
from app.agents.food_recognizer import FoodRecognizerAgent
from app.agents.portion_estimator import PortionEstimatorAgent
from app.agents.nutrition_calculator import NutritionCalculatorAgent
from app.agents.health_advisor import HealthAdvisorAgent
from app.agents.meal_optimizer import MealOptimizerAgent
from app.agents.image_generator import ImageGenerationManager
from app.core.config import settings
import asyncio

class NutriOrchestrator:
    def __init__(self, openai_api_key: str):
        self.food_recognizer = FoodRecognizerAgent(openai_api_key)
        self.portion_estimator = PortionEstimatorAgent(openai_api_key)
        self.nutrition_calculator = NutritionCalculatorAgent()
        self.health_advisor = HealthAdvisorAgent(openai_api_key)
        self.meal_optimizer = MealOptimizerAgent(openai_api_key)
        self.image_generator = ImageGenerationManager(openai_api_key)
    
    async def validate_credits(self, user: User, mode: str) -> tuple[bool, str]:
        cost = settings.CREDIT_COST_FULL if mode == "full" else settings.CREDIT_COST_SIMPLE
        if user.plan == "pro" and user.pro_analyses_remaining > 0:
            return True, "pro_quota"
        if user.credit_balance >= cost:
            return True, "credits"
        return False, f"Créditos insuficientes. Necessário: {cost}, Disponível: {user.credit_balance}"
    
    async def deduct_credits(self, db: AsyncSession, user: User, mode: str, source: str):
        cost = settings.CREDIT_COST_FULL if mode == "full" else settings.CREDIT_COST_SIMPLE
        if source == "pro_quota":
            user.pro_analyses_remaining -= 1
        else:
            user.credit_balance -= cost
        await db.commit()
    
    async def run_analysis(
        self,
        db: AsyncSession,
        job: Job,
        meal: Meal,
        user: User,
        mode: str = "simple",
        answers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        try:
            profile_result = await db.execute(
                select(Profile).where(Profile.user_id == user.id)
            )
            profile = profile_result.scalar_one_or_none()
            perfil = None
            if profile:
                perfil = {
                    "objetivo": profile.objetivo,
                    "restricoes": profile.restricoes,
                    "alergias": profile.alergias
                }
            
            job.status = JobStatus.RUNNING.value
            job.etapa_atual = "Identificando alimentos..."
            await db.commit()
            
            recognition_result = await self.food_recognizer.identify(
                meal.image_url, 
                meal.meal_type
            )
            
            if "erro" in recognition_result:
                job.status = JobStatus.FAILED.value
                job.erro = recognition_result["erro"]
                await db.commit()
                return {"erro": recognition_result["erro"]}
            
            job.etapa_atual = "Estimando porções..."
            await db.commit()
            
            portion_result = await self.portion_estimator.estimate(
                meal.image_url,
                recognition_result.get("itens_identificados", []),
                answers
            )
            
            if portion_result.get("questions") and not answers:
                job.status = JobStatus.WAITING_USER.value
                job.etapa_atual = "Aguardando respostas do usuário"
                job.questions = portion_result["questions"]
                await db.commit()
                return {
                    "status": "waiting_user",
                    "questions": portion_result["questions"]
                }
            
            job.etapa_atual = "Calculando nutrientes..."
            await db.commit()
            
            nutrition_result = await self.nutrition_calculator.calculate(
                portion_result.get("porcoes", [])
            )
            
            job.etapa_atual = "Analisando impacto nutricional..."
            await db.commit()
            
            optimization_result = None
            image_url = None
            
            if mode == "full":
                health_result, optimization_result = await asyncio.gather(
                    self.health_advisor.analyze(
                        nutrition_result["calorias"],
                        nutrition_result["macros"],
                        perfil
                    ),
                    self.meal_optimizer.optimize(
                        recognition_result.get("itens_identificados", []),
                        portion_result.get("porcoes", []),
                        nutrition_result["calorias"],
                        nutrition_result["macros"],
                        perfil
                    )
                )
                
                if optimization_result.get("prompt_para_imagem"):
                    job.etapa_atual = "Gerando imagem da sugestão..."
                    await db.commit()
                    
                    image_url = await self.image_generator.generate(
                        optimization_result["prompt_para_imagem"]
                    )
            else:
                health_result = await self.health_advisor.analyze(
                    nutrition_result["calorias"],
                    nutrition_result["macros"],
                    perfil
                )
            
            analysis = MealAnalysis(
                meal_id=meal.id,
                itens_identificados=recognition_result.get("itens_identificados", []),
                porcoes_estimadas=portion_result.get("porcoes", []),
                calorias_central=nutrition_result["calorias"]["central"],
                calorias_min=nutrition_result["calorias"]["min"],
                calorias_max=nutrition_result["calorias"]["max"],
                proteina_g=nutrition_result["macros"]["proteina_g"],
                carbo_g=nutrition_result["macros"]["carbo_g"],
                gordura_g=nutrition_result["macros"]["gordura_g"],
                fibra_g=nutrition_result["macros"].get("fibra_g"),
                confianca=nutrition_result["confianca_total"],
                incertezas=portion_result.get("fatores_incerteza", []) + nutrition_result.get("principais_fontes_de_erro", []),
                beneficios=health_result.get("beneficios", []),
                pontos_de_atencao=health_result.get("pontos_de_atencao", []),
                recomendacoes_praticas=health_result.get("recomendacoes_praticas", []),
                sugestao_melhorada_texto=optimization_result.get("sugestao_melhorada_texto") if optimization_result else None,
                sugestao_melhorada_imagem_url=image_url,
                mudancas_sugeridas=optimization_result.get("mudancas_sugeridas") if optimization_result else None,
                calorias_nova_versao=optimization_result.get("calorias_nova_versao") if optimization_result else None,
                macros_nova_versao=optimization_result.get("macros_nova_versao") if optimization_result else None
            )
            
            db.add(analysis)
            
            meal.status = "completed"
            job.status = JobStatus.COMPLETED.value
            job.etapa_atual = "Análise concluída"
            job.resultado_final = {
                "itens_identificados": recognition_result.get("itens_identificados", []),
                "porcoes_estimadas": portion_result.get("porcoes", []),
                "calorias": nutrition_result["calorias"],
                "macros": nutrition_result["macros"],
                "confianca": nutrition_result["confianca_total"],
                "incertezas": analysis.incertezas,
                "beneficios": health_result.get("beneficios", []),
                "pontos_de_atencao": health_result.get("pontos_de_atencao", []),
                "recomendacoes_praticas": health_result.get("recomendacoes_praticas", []),
                "aviso": health_result.get("aviso", ""),
                "sugestao_melhorada_texto": analysis.sugestao_melhorada_texto,
                "sugestao_melhorada_imagem_url": analysis.sugestao_melhorada_imagem_url,
                "mudancas_sugeridas": analysis.mudancas_sugeridas,
                "calorias_nova_versao": analysis.calorias_nova_versao,
                "macros_nova_versao": analysis.macros_nova_versao
            }
            
            await db.commit()
            
            return job.resultado_final
            
        except Exception as e:
            job.status = JobStatus.FAILED.value
            job.erro = str(e)
            meal.status = "failed"
            await db.commit()
            return {"erro": str(e)}
