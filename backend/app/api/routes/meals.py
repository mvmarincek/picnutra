from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import os
import uuid
import aiofiles
from PIL import Image
from io import BytesIO

from app.db.database import get_db
from app.models.models import User, Meal, MealAnalysis, Job, JobStatus, MealStatus
from app.schemas.schemas import (
    MealUploadResponse, AnalyzeRequest, AnalyzeResponse, 
    AnswersRequest, MealListItem, MealDetailResponse, MealAnalysisResponse,
    ItemIdentificado, PorcaoEstimada, CaloriasInfo, MacrosInfo
)
from app.core.security import get_current_user
from app.core.config import settings
from app.agents.orchestrator import NutriOrchestrator

router = APIRouter(prefix="/meals", tags=["meals"])

async def run_analysis_task(
    job_id: int,
    meal_id: int,
    user_id: int,
    mode: str,
    answers: Optional[dict] = None
):
    from app.db.database import async_session
    import logging
    logger = logging.getLogger(__name__)
    
    async with async_session() as db:
        job = None
        user = None
        source = None
        credits_deducted = False
        
        try:
            job = await db.get(Job, job_id)
            meal = await db.get(Meal, meal_id)
            user = await db.get(User, user_id)
            
            logger.info(f"[job_id={job_id}] Starting analysis for meal_id={meal_id}, user_id={user_id}, mode={mode}")
            
            orchestrator = NutriOrchestrator(settings.OPENAI_API_KEY)
            
            valid, source = await orchestrator.validate_credits(user, mode)
            if not valid:
                logger.warning(f"[job_id={job_id}] Credit validation failed: {source}")
                job.status = JobStatus.FAILED.value
                job.erro = source
                await db.commit()
                return
            
            await orchestrator.deduct_credits(db, user, mode, source)
            credits_deducted = True
            logger.info(f"[job_id={job_id}] Credits deducted (source={source})")
            
            result = await orchestrator.run_analysis(db, job, meal, user, mode, answers)
            
            if "erro" in result:
                logger.error(f"[job_id={job_id}] Analysis failed: {result['erro']}")
                if credits_deducted and source != "free_unlimited":
                    await db.refresh(user)
                    await orchestrator.refund_credits(db, user, mode, source)
                    logger.info(f"[job_id={job_id}] Credits refunded due to analysis failure")
            else:
                logger.info(f"[job_id={job_id}] Analysis completed successfully")
            
        except Exception as e:
            logger.error(f"[job_id={job_id}] Exception during analysis: {str(e)}")
            if job:
                job.status = JobStatus.FAILED.value
                job.erro = str(e)
                await db.commit()
            
            if credits_deducted and user and source and source != "free_unlimited":
                try:
                    await db.refresh(user)
                    await orchestrator.refund_credits(db, user, mode, source)
                    logger.info(f"[job_id={job_id}] Credits refunded due to exception")
                except Exception as refund_error:
                    logger.error(f"[job_id={job_id}] Failed to refund credits: {str(refund_error)}")

@router.post("/upload-image", response_model=MealUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    meal_type: str = Form(default="prato"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")
    
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Imagem muito grande (máx 10MB)")
    
    try:
        img = Image.open(BytesIO(content))
        if img.width > 2048 or img.height > 2048:
            img.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
        
        output = BytesIO()
        img_format = "JPEG" if file.content_type == "image/jpeg" else "PNG"
        img.save(output, format=img_format, quality=85, optimize=True)
        content = output.getvalue()
    except Exception:
        pass
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)
    
    image_url = f"/uploads/{filename}"
    
    meal = Meal(
        user_id=current_user.id,
        image_url=image_url,
        meal_type=meal_type,
        status=MealStatus.PENDING.value
    )
    db.add(meal)
    await db.commit()
    await db.refresh(meal)
    
    return MealUploadResponse(meal_id=meal.id, image_url=image_url)

@router.post("/{meal_id}/analyze", response_model=AnalyzeResponse)
async def analyze_meal(
    meal_id: int,
    request: AnalyzeRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Meal).where(Meal.id == meal_id, Meal.user_id == current_user.id)
    )
    meal = result.scalar_one_or_none()
    
    if not meal:
        raise HTTPException(status_code=404, detail="Refeição não encontrada")
    
    is_free_simple = current_user.plan == "free" and request.mode == "simple"
    cost = settings.CREDIT_COST_FULL if request.mode == "full" else settings.CREDIT_COST_SIMPLE
    has_pro_quota = current_user.plan == "pro" and current_user.pro_analyses_remaining > 0
    has_credits = current_user.credit_balance >= cost
    
    if not is_free_simple and not has_pro_quota and not has_credits:
        raise HTTPException(
            status_code=402, 
            detail=f"Créditos insuficientes. Necessário: {cost}, Disponível: {current_user.credit_balance}"
        )
    
    meal.status = MealStatus.ANALYZING.value
    meal.mode = request.mode
    
    job = Job(
        user_id=current_user.id,
        meal_id=meal.id,
        tipo="analyze_meal",
        status=JobStatus.RECEIVED.value,
        etapa_atual="Iniciando análise..."
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    background_tasks.add_task(
        run_analysis_task,
        job.id,
        meal.id,
        current_user.id,
        request.mode,
        None
    )
    
    return AnalyzeResponse(job_id=job.id)

@router.post("/{meal_id}/answers", response_model=AnalyzeResponse)
async def submit_answers(
    meal_id: int,
    request: AnswersRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Meal).where(Meal.id == meal_id, Meal.user_id == current_user.id)
    )
    meal = result.scalar_one_or_none()
    
    if not meal:
        raise HTTPException(status_code=404, detail="Refeição não encontrada")
    
    job_result = await db.execute(
        select(Job).where(
            Job.meal_id == meal_id,
            Job.status == JobStatus.WAITING_USER.value
        ).order_by(Job.created_at.desc())
    )
    job = job_result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=400, detail="Nenhum job aguardando respostas")
    
    job.answers = request.answers
    job.status = JobStatus.RECEIVED.value
    job.etapa_atual = "Processando respostas..."
    await db.commit()
    
    background_tasks.add_task(
        run_analysis_task,
        job.id,
        meal.id,
        current_user.id,
        meal.mode,
        request.answers
    )
    
    return AnalyzeResponse(job_id=job.id)

@router.get("", response_model=List[MealListItem])
async def list_meals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Meal)
        .where(Meal.user_id == current_user.id)
        .where(Meal.status != MealStatus.PENDING.value)
        .order_by(Meal.created_at.desc())
    )
    meals = result.scalars().all()
    
    response = []
    for meal in meals:
        analysis_result = await db.execute(
            select(MealAnalysis).where(MealAnalysis.meal_id == meal.id)
        )
        analysis = analysis_result.scalar_one_or_none()
        
        response.append(MealListItem(
            id=meal.id,
            image_url=meal.image_url,
            meal_type=meal.meal_type,
            status=meal.status,
            mode=meal.mode,
            created_at=meal.created_at,
            calorias_central=analysis.calorias_central if analysis else None
        ))
    
    return response

@router.get("/{meal_id}", response_model=MealDetailResponse)
async def get_meal(
    meal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Meal).where(Meal.id == meal_id, Meal.user_id == current_user.id)
    )
    meal = result.scalar_one_or_none()
    
    if not meal:
        raise HTTPException(status_code=404, detail="Refeição não encontrada")
    
    analysis_result = await db.execute(
        select(MealAnalysis).where(MealAnalysis.meal_id == meal.id)
    )
    analysis = analysis_result.scalar_one_or_none()
    
    analysis_response = None
    if analysis:
        analysis_response = MealAnalysisResponse(
            id=analysis.id,
            meal_id=analysis.meal_id,
            itens_identificados=[ItemIdentificado(**i) for i in analysis.itens_identificados],
            porcoes_estimadas=[PorcaoEstimada(**p) for p in analysis.porcoes_estimadas],
            calorias=CaloriasInfo(
                central=analysis.calorias_central,
                min=analysis.calorias_min,
                max=analysis.calorias_max
            ),
            macros=MacrosInfo(
                proteina_g=analysis.proteina_g,
                carbo_g=analysis.carbo_g,
                gordura_g=analysis.gordura_g,
                fibra_g=analysis.fibra_g
            ),
            confianca=analysis.confianca,
            incertezas=analysis.incertezas,
            beneficios=analysis.beneficios,
            pontos_de_atencao=analysis.pontos_de_atencao,
            recomendacoes_praticas=analysis.recomendacoes_praticas,
            sugestao_melhorada_texto=analysis.sugestao_melhorada_texto,
            sugestao_melhorada_imagem_url=analysis.sugestao_melhorada_imagem_url,
            mudancas_sugeridas=analysis.mudancas_sugeridas,
            calorias_nova_versao=CaloriasInfo(**analysis.calorias_nova_versao) if analysis.calorias_nova_versao else None,
            macros_nova_versao=MacrosInfo(**analysis.macros_nova_versao) if analysis.macros_nova_versao else None,
            created_at=analysis.created_at
        )
    
    return MealDetailResponse(
        id=meal.id,
        image_url=meal.image_url,
        meal_type=meal.meal_type,
        status=meal.status,
        mode=meal.mode,
        created_at=meal.created_at,
        analysis=analysis_response
    )

@router.delete("/{meal_id}")
async def delete_meal(
    meal_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Meal).where(Meal.id == meal_id, Meal.user_id == current_user.id)
    )
    meal = result.scalar_one_or_none()
    
    if not meal:
        raise HTTPException(status_code=404, detail="Refeição não encontrada")
    
    analysis_result = await db.execute(
        select(MealAnalysis).where(MealAnalysis.meal_id == meal.id)
    )
    analysis = analysis_result.scalar_one_or_none()
    if analysis:
        await db.delete(analysis)
    
    jobs_result = await db.execute(
        select(Job).where(Job.meal_id == meal.id)
    )
    for job in jobs_result.scalars().all():
        await db.delete(job)
    
    if meal.image_url:
        filepath = os.path.join(settings.UPLOAD_DIR, meal.image_url.split("/")[-1])
        if os.path.exists(filepath):
            os.remove(filepath)
    
    await db.delete(meal)
    await db.commit()
    
    return {"message": "Refeição excluída com sucesso"}
