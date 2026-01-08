from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.db.database import get_db
from app.models.models import User, Referral
from app.schemas.schemas import UserCreate, UserLogin, TokenResponse, UserResponse
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user
from app.services.email_service import send_welcome_email, send_password_reset_email, send_referral_activated_email
import secrets
import string
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

password_reset_tokens = {}

def generate_referral_code():
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

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
    
    referrer = None
    if user_data.referral_code:
        referrer_result = await db.execute(
            select(User).where(User.referral_code == user_data.referral_code.upper())
        )
        referrer = referrer_result.scalar_one_or_none()
    
    referral_code = generate_referral_code()
    while True:
        check = await db.execute(select(User).where(User.referral_code == referral_code))
        if not check.scalar_one_or_none():
            break
        referral_code = generate_referral_code()
    
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        credit_balance=36,
        referral_code=referral_code,
        referred_by=referrer.id if referrer else None
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    if referrer:
        referrer.credit_balance += 12
        
        referral_record = Referral(
            referrer_id=referrer.id,
            referred_id=user.id,
            credits_awarded=12
        )
        db.add(referral_record)
        await db.commit()
        await db.refresh(referrer)
        
        background_tasks.add_task(
            send_referral_activated_email,
            referrer.email,
            user.email,
            12,
            referrer.credit_balance
        )
    
    background_tasks.add_task(send_welcome_email, user.email)
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )

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
    
    if not user:
        return {"exists": False, "message": "Email não encontrado. Deseja criar uma conta?"}
    
    token = secrets.token_urlsafe(32)
    password_reset_tokens[token] = {
        "user_id": user.id,
        "email": user.email,
        "expires": datetime.utcnow() + timedelta(hours=1)
    }
    
    background_tasks.add_task(send_password_reset_email, user.email, token)
    
    return {"exists": True, "message": "Email de recuperação enviado!"}

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

@router.post("/downgrade-to-free", response_model=UserResponse)
async def downgrade_to_free(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.plan == "free":
        raise HTTPException(status_code=400, detail="Você já está no plano FREE")
    
    current_user.plan = "free"
    await db.commit()
    await db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)

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
