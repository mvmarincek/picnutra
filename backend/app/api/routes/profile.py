from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.models import User, Profile
from app.schemas.schemas import ProfileCreate, ProfileResponse
from app.core.security import get_current_user
from app.core.config import settings
from PIL import Image
from io import BytesIO
import aiofiles
import uuid
import os

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
    if not file.content_type.startswith("image/"):
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
        img.save(output, format="JPEG", quality=85, optimize=True)
        content = output.getvalue()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Erro ao processar imagem")
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    filename = f"avatar_{current_user.id}_{uuid.uuid4()}.jpg"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)
    
    avatar_url = f"/uploads/{filename}"
    
    result = await db.execute(
        select(Profile).where(Profile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    
    if profile:
        if profile.avatar_url:
            old_path = os.path.join(settings.UPLOAD_DIR, profile.avatar_url.replace("/uploads/", ""))
            if os.path.exists(old_path):
                os.remove(old_path)
        profile.avatar_url = avatar_url
    else:
        profile = Profile(
            user_id=current_user.id,
            avatar_url=avatar_url
        )
        db.add(profile)
    
    await db.commit()
    await db.refresh(profile)
    
    return ProfileResponse.model_validate(profile)
