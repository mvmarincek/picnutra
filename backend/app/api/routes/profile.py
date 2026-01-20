from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.db.database import get_db
from app.models.models import User, Profile, Meal, MealAnalysis
from app.schemas.schemas import ProfileCreate, ProfileResponse
from app.core.security import get_current_user
from app.core.config import settings
from PIL import Image
from io import BytesIO
import base64
import secrets

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    return ProfileResponse.model_validate(profile)

@router.post("", response_model=ProfileResponse)
async def create_or_update_profile(
    profile_data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if profile:
        profile.objetivo = profile_data.objetivo
        profile.restricoes = profile_data.restricoes or []
        profile.alergias = profile_data.alergias or []
    else:
        profile = Profile(
            user_id=current_user.id,
            objetivo=profile_data.objetivo,
            restricoes=profile_data.restricoes or [],
            alergias=profile_data.alergias or []
        )
        db.add(profile)
    
    await db.commit()
    await db.refresh(profile)
    
    return ProfileResponse.model_validate(profile)

@router.post("/avatar", response_model=ProfileResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Arquivo deve ser uma imagem")
    
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Imagem muito grande (max 5MB)")
    
    try:
        img = Image.open(BytesIO(content))
        img = img.convert("RGB")
        size = min(img.width, img.height)
        left = (img.width - size) // 2
        top = (img.height - size) // 2
        img = img.crop((left, top, left + size, top + size))
        img = img.resize((256, 256), Image.Resampling.LANCZOS)
        
        output = BytesIO()
        img.save(output, format="JPEG", quality=80, optimize=True)
        content = output.getvalue()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Erro ao processar imagem")
    
    avatar_base64 = f"data:image/jpeg;base64,{base64.b64encode(content).decode('utf-8')}"
    
    result = await db.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if profile:
        profile.avatar_url = avatar_base64
    else:
        profile = Profile(
            user_id=current_user.id,
            avatar_url=avatar_base64
        )
        db.add(profile)
    
    await db.commit()
    await db.refresh(profile)
    
    return ProfileResponse.model_validate(profile)

@router.post("/generate-share-token")
async def generate_share_token(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.public_share_token:
        current_user.public_share_token = secrets.token_urlsafe(16)
        await db.commit()
        await db.refresh(current_user)
    
    return {
        "share_token": current_user.public_share_token,
        "share_url": f"https://picnutra.vercel.app/historico/{current_user.public_share_token}"
    }

@router.get("/public/{share_token}")
async def get_public_history(
    share_token: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.public_share_token == share_token)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Histórico não encontrado")
    
    meals_result = await db.execute(
        select(Meal)
        .where(Meal.user_id == user.id, Meal.status == "completed")
        .order_by(desc(Meal.created_at))
        .limit(50)
    )
    meals = meals_result.scalars().all()
    
    history = []
    for meal in meals:
        analysis_result = await db.execute(
            select(MealAnalysis).where(MealAnalysis.meal_id == meal.id)
        )
        analysis = analysis_result.scalar_one_or_none()
        
        if analysis:
            try:
                calorias = 0
                if analysis.calorias:
                    if isinstance(analysis.calorias, dict):
                        calorias = analysis.calorias.get("central", 0)
                    else:
                        calorias = float(analysis.calorias) if analysis.calorias else 0
                
                macros = analysis.macros if isinstance(analysis.macros, dict) else {}
                
                history.append({
                    "id": meal.id,
                    "meal_type": meal.meal_type,
                    "image_url": meal.image_url,
                    "created_at": meal.created_at.isoformat(),
                    "calorias": calorias,
                    "proteina": macros.get("proteina_g", 0) or 0,
                    "carboidrato": macros.get("carboidrato_g", 0) or 0,
                    "gordura": macros.get("gordura_g", 0) or 0,
                    "fibra": macros.get("fibra_g", 0) or 0,
                })
            except Exception:
                continue
    
    total_meals = len(history)
    avg_calorias = sum(m["calorias"] for m in history) / total_meals if total_meals > 0 else 0
    avg_proteina = sum(m["proteina"] for m in history) / total_meals if total_meals > 0 else 0
    avg_carboidrato = sum(m["carboidrato"] for m in history) / total_meals if total_meals > 0 else 0
    avg_gordura = sum(m["gordura"] for m in history) / total_meals if total_meals > 0 else 0
    avg_fibra = sum(m["fibra"] for m in history) / total_meals if total_meals > 0 else 0
    
    return {
        "user_name": user.name or "Usuário",
        "total_meals": total_meals,
        "averages": {
            "calorias": round(avg_calorias, 1),
            "proteina": round(avg_proteina, 1),
            "carboidrato": round(avg_carboidrato, 1),
            "gordura": round(avg_gordura, 1),
            "fibra": round(avg_fibra, 1),
        },
        "meals": history
    }
