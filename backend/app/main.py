from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
import logging

from app.db.database import init_db, async_session
from app.core.config import settings
from app.api.routes import auth, profile, meals, jobs, billing, credits, feedback, admin

logger = logging.getLogger(__name__)

class ClientError(BaseModel):
    error_message: str
    error_stack: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    user_agent: str
    url: str
    timestamp: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(
    title="Nutri-Vision API",
    description="API para análise nutricional de refeições com IA",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(meals.router)
app.include_router(jobs.router)
app.include_router(billing.router)
app.include_router(credits.router)
app.include_router(feedback.router)
app.include_router(admin.router)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
async def root():
    return {"message": "Nutri-Vision API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/log-error")
async def log_client_error(error: ClientError):
    logger.error(f"""
=== CLIENT ERROR ===
Time: {error.timestamp or datetime.utcnow().isoformat()}
URL: {error.url}
User-Agent: {error.user_agent}
File: {error.file_name} | Type: {error.file_type} | Size: {error.file_size}
Error: {error.error_message}
Stack: {error.error_stack}
====================
""")
    return {"logged": True}

@app.get("/run-migration")
async def run_migration():
    migrations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(64)",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_referral_code ON users(referral_code)",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)",
        "ALTER TABLE profiles ALTER COLUMN avatar_url TYPE TEXT",
        "ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS asaas_subscription_id VARCHAR(255)",
        "ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id",
        "ALTER TABLE meals ADD COLUMN IF NOT EXISTS user_notes TEXT",
        "ALTER TABLE meals ADD COLUMN IF NOT EXISTS weight_grams FLOAT",
        "ALTER TABLE meals ADD COLUMN IF NOT EXISTS volume_ml FLOAT",
    ]
    
    results = []
    async with async_session() as session:
        for sql in migrations:
            try:
                await session.execute(text(sql))
                await session.commit()
                results.append({"sql": sql, "status": "ok"})
            except Exception as e:
                results.append({"sql": sql, "status": "error", "error": str(e)})
    
    return {"migrations": results}

@app.get("/fix-referral-codes")
async def fix_referral_codes():
    import secrets
    import string
    from sqlalchemy import select, update
    from app.models.models import User
    
    async with async_session() as session:
        result = await session.execute(
            select(User).where(User.referral_code == None)
        )
        users = result.scalars().all()
        
        count = 0
        for user in users:
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
            user.referral_code = code
            count += 1
        
        await session.commit()
    
    return {"fixed_users": count}

@app.get("/test-asaas")
async def test_asaas():
    import httpx
    from app.core.config import settings
    
    result = {
        "api_key_configured": bool(settings.ASAAS_API_KEY),
        "api_key_prefix": settings.ASAAS_API_KEY[:20] + "..." if settings.ASAAS_API_KEY else "NOT SET",
        "base_url": settings.ASAAS_BASE_URL
    }
    
    if not settings.ASAAS_API_KEY:
        result["error"] = "ASAAS_API_KEY not configured"
        return result

@app.get("/test-pix")
async def test_pix():
    import httpx
    from app.core.config import settings
    from datetime import datetime, timedelta
    
    result = {}
    
    try:
        async with httpx.AsyncClient() as client:
            due_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            
            payment_response = await client.post(
                f"{settings.ASAAS_BASE_URL}/payments",
                headers={
                    "access_token": settings.ASAAS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "customer": "cus_000007423022",
                    "billingType": "PIX",
                    "value": 4.90,
                    "dueDate": due_date,
                    "description": "Teste PIX"
                }
            )
            result["payment_status"] = payment_response.status_code
            result["payment_response"] = payment_response.json()
            
            if payment_response.status_code == 200:
                payment_id = payment_response.json().get("id")
                if payment_id:
                    pix_response = await client.get(
                        f"{settings.ASAAS_BASE_URL}/payments/{payment_id}/pixQrCode",
                        headers={"access_token": settings.ASAAS_API_KEY}
                    )
                    result["pix_status"] = pix_response.status_code
                    result["pix_response"] = pix_response.json()
    except Exception as e:
        result["error"] = str(e)
    
    return result
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.ASAAS_BASE_URL}/customers",
                headers={"access_token": settings.ASAAS_API_KEY},
                params={"limit": 1}
            )
            result["status_code"] = response.status_code
            result["response"] = response.json()
    except Exception as e:
        result["error"] = str(e)
    
    return result

@app.get("/test-pix")
async def test_pix():
    import httpx
    from app.core.config import settings
    from datetime import datetime, timedelta
    
    result = {}
    
    try:
        async with httpx.AsyncClient() as client:
            due_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            
            payment_response = await client.post(
                f"{settings.ASAAS_BASE_URL}/payments",
                headers={
                    "access_token": settings.ASAAS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "customer": "cus_000007423022",
                    "billingType": "PIX",
                    "value": 4.90,
                    "dueDate": due_date,
                    "description": "Teste PIX"
                }
            )
            result["payment_status"] = payment_response.status_code
            result["payment_response"] = payment_response.json()
            
            if payment_response.status_code == 200:
                payment_id = payment_response.json().get("id")
                if payment_id:
                    pix_response = await client.get(
                        f"{settings.ASAAS_BASE_URL}/payments/{payment_id}/pixQrCode",
                        headers={"access_token": settings.ASAAS_API_KEY}
                    )
                    result["pix_status"] = pix_response.status_code
                    result["pix_response"] = pix_response.json()
    except Exception as e:
        result["error"] = str(e)
    
    return result
