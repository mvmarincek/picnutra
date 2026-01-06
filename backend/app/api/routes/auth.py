from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, TokenResponse, UserResponse
from app.core.security import get_password_hash, verify_password, create_access_token
from app.services.email_service import send_welcome_email, send_password_reset_email
import secrets
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

password_reset_tokens = {}

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        credit_balance=27
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    background_tasks.add_task(send_welcome_email, user.email)
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if user:
        token = secrets.token_urlsafe(32)
        password_reset_tokens[token] = {
            "user_id": user.id,
            "email": user.email,
            "expires": datetime.utcnow() + timedelta(hours=1)
        }
        background_tasks.add_task(send_password_reset_email, user.email, token)
    
    return {"message": "Se o email existir, você receberá instruções para redefinir sua senha."}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    token_data = password_reset_tokens.get(request.token)
    
    if not token_data:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")
    
    if datetime.utcnow() > token_data["expires"]:
        del password_reset_tokens[request.token]
        raise HTTPException(status_code=400, detail="Token expirado")
    
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 6 caracteres")
    
    result = await db.execute(select(User).where(User.id == token_data["user_id"]))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=400, detail="Usuário não encontrado")
    
    user.password_hash = get_password_hash(request.new_password)
    await db.commit()
    
    del password_reset_tokens[request.token]
    
    return {"message": "Senha alterada com sucesso!"}

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha inválidos"
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if user:
        token = secrets.token_urlsafe(32)
        password_reset_tokens[token] = {
            "user_id": user.id,
            "email": user.email,
            "expires": datetime.utcnow() + timedelta(hours=1)
        }
        background_tasks.add_task(send_password_reset_email, user.email, token)
    
    return {"message": "Se o email existir, você receberá instruções para redefinir sua senha."}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    token_data = password_reset_tokens.get(request.token)
    
    if not token_data:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")
    
    if datetime.utcnow() > token_data["expires"]:
        del password_reset_tokens[request.token]
        raise HTTPException(status_code=400, detail="Token expirado")
    
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 6 caracteres")
    
    result = await db.execute(select(User).where(User.id == token_data["user_id"]))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=400, detail="Usuário não encontrado")
    
    user.password_hash = get_password_hash(request.new_password)
    await db.commit()
    
    del password_reset_tokens[request.token]
    
    return {"message": "Senha alterada com sucesso!"}

@router.post("/create-test-user", response_model=TokenResponse)
async def create_test_user(db: AsyncSession = Depends(get_db)):
    test_email = "teste@nutrivision.com"
    test_password = "teste123"
    
    result = await db.execute(select(User).where(User.email == test_email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        existing_user.credit_balance = 100000
        await db.commit()
        await db.refresh(existing_user)
        access_token = create_access_token(data={"sub": str(existing_user.id)})
        return TokenResponse(
            access_token=access_token,
            user=UserResponse.model_validate(existing_user)
        )
    
    user = User(
        email=test_email,
        password_hash=get_password_hash(test_password),
        credit_balance=100000
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if user:
        token = secrets.token_urlsafe(32)
        password_reset_tokens[token] = {
            "user_id": user.id,
            "email": user.email,
            "expires": datetime.utcnow() + timedelta(hours=1)
        }
        background_tasks.add_task(send_password_reset_email, user.email, token)
    
    return {"message": "Se o email existir, você receberá instruções para redefinir sua senha."}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    token_data = password_reset_tokens.get(request.token)
    
    if not token_data:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")
    
    if datetime.utcnow() > token_data["expires"]:
        del password_reset_tokens[request.token]
        raise HTTPException(status_code=400, detail="Token expirado")
    
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 6 caracteres")
    
    result = await db.execute(select(User).where(User.id == token_data["user_id"]))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=400, detail="Usuário não encontrado")
    
    user.password_hash = get_password_hash(request.new_password)
    await db.commit()
    
    del password_reset_tokens[request.token]
    
    return {"message": "Senha alterada com sucesso!"}
