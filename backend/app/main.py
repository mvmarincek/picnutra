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
from app.models.models import ErrorLog

logger = logging.getLogger(__name__)

class ClientError(BaseModel):
    error_message: str
    error_stack: Optional[str] = None
    error_type: Optional[str] = "frontend"
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    user_agent: str
    url: str
    user_id: Optional[int] = None
    extra_data: Optional[dict] = None
    timestamp: Optional[str] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield

app = FastAPI(
    title="PicNutra API",
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
    return {"message": "PicNutra API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/test-login")
async def test_login():
    from sqlalchemy import text
    from app.core.security import verify_password, create_access_token, create_refresh_token
    result = {}
    try:
        async with async_session() as db:
            r = await db.execute(text("SELECT id, email, password_hash FROM users WHERE email = 'teste@picnutra.com'"))
            row = r.fetchone()
            if not row:
                result["error"] = "User not found"
                return result
            
            user_id, email, password_hash = row
            result["user_found"] = True
            result["user_id"] = user_id
            result["email"] = email
            result["hash_length"] = len(password_hash) if password_hash else 0
            
            try:
                valid = verify_password("Teste123!", password_hash)
                result["password_valid"] = valid
            except Exception as e:
                result["password_error"] = str(e)
            
            try:
                token = create_access_token(data={"sub": str(user_id)})
                result["token_created"] = True
                result["token_preview"] = token[:20] + "..."
            except Exception as e:
                result["token_error"] = str(e)
                
    except Exception as e:
        result["db_error"] = str(e)
    return result

@app.get("/test-db")
async def test_db():
    from sqlalchemy import text
    from app.core.security import get_password_hash
    result = {"database": "unknown"}
    try:
        async with async_session() as db:
            r = await db.execute(text("SELECT COUNT(*) FROM users"))
            count = r.scalar()
            result["database"] = "connected"
            result["user_count"] = count
            
            check = await db.execute(text("SELECT id FROM users WHERE email = 'teste@picnutra.com'"))
            exists = check.scalar()
            
            if not exists:
                hashed = get_password_hash("Teste123!")
                await db.execute(text(
                    "INSERT INTO users (email, password_hash, name, credit_balance, email_verified, referral_code) "
                    "VALUES ('teste@picnutra.com', :pwd, 'Usuario Teste', 36, true, 'TESTE123')"
                ), {"pwd": hashed})
                await db.commit()
                result["test_user"] = "created"
            else:
                result["test_user"] = "already exists"
            
            result["login"] = {"email": "teste@picnutra.com", "password": "Teste123!"}
    except Exception as e:
        result["database"] = "error"
        result["error"] = str(e)
    return result

@app.get("/test-email/{email}")
async def test_email(email: str):
    import resend
    import os
    
    api_key = os.getenv("RESEND_API_KEY", "")
    result = {
        "api_key_configured": bool(api_key),
        "api_key_prefix": api_key[:10] + "..." if api_key else "NOT SET"
    }
    
    if not api_key:
        result["error"] = "RESEND_API_KEY not configured"
        return result
    
    try:
        resend.api_key = api_key
        response = resend.Emails.send({
            "from": "PicNutra <picnutra-noreply@picnutra.com>",
            "to": email,
            "subject": "Teste PicNutra - Email funcionando!",
            "html": "<h1>Teste OK!</h1><p>Se voce recebeu este email, o Resend esta funcionando corretamente.</p>"
        })
        result["status"] = "sent"
        result["resend_response"] = str(response)
    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)
    
    return result

@app.post("/log-error")
async def log_client_error(error: ClientError):
    logger.error(f"""
=== CLIENT ERROR ===
Time: {error.timestamp or datetime.utcnow().isoformat()}
URL: {error.url}
User-Agent: {error.user_agent}
User ID: {error.user_id}
Type: {error.error_type}
File: {error.file_name} | Type: {error.file_type} | Size: {error.file_size}
Error: {error.error_message}
Stack: {error.error_stack}
====================
""")
    
    try:
        async with async_session() as db:
            extra = error.extra_data or {}
            if error.file_name:
                extra["file_name"] = error.file_name
                extra["file_type"] = error.file_type
                extra["file_size"] = error.file_size
            
            error_log = ErrorLog(
                user_id=error.user_id,
                error_type=error.error_type or "frontend",
                error_message=error.error_message,
                error_stack=error.error_stack,
                url=error.url,
                user_agent=error.user_agent,
                extra_data=extra if extra else None
            )
            db.add(error_log)
            await db.commit()
    except Exception as e:
        logger.error(f"Failed to save error log: {e}")
    
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
        """CREATE TABLE IF NOT EXISTS email_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(100) UNIQUE NOT NULL,
            value TEXT NOT NULL,
            description VARCHAR(255),
            updated_at TIMESTAMP DEFAULT NOW()
        )""",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_email_settings_key ON email_settings(key)",
        "INSERT INTO email_settings (key, value, description) VALUES ('admin_email', 'mvmarincek@gmail.com', 'Email do administrador') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('support_email', 'picnutra-contato@picnutra.com', 'Email de suporte') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('app_url', 'https://picnutra.vercel.app', 'URL base da aplicacao') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('frontend_url', 'https://picnutra.vercel.app', 'URL do frontend') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('from_name', 'PicNutra', 'Nome do remetente') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('from_email', 'picnutra-noreply@picnutra.com', 'Email do remetente') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('welcome_credits', '36', 'Creditos de bonus para novos usuarios') ON CONFLICT (key) DO NOTHING",
        "INSERT INTO email_settings (key, value, description) VALUES ('referral_credits', '12', 'Creditos por indicacao') ON CONFLICT (key) DO NOTHING",
        "ALTER TABLE meal_analysis DROP COLUMN IF EXISTS receita",
        """CREATE TABLE IF NOT EXISTS error_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            error_type VARCHAR(50) NOT NULL,
            error_message TEXT NOT NULL,
            error_stack TEXT,
            url VARCHAR(500),
            user_agent VARCHAR(500),
            extra_data JSONB,
            resolved BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        )""",
        "CREATE INDEX IF NOT EXISTS ix_error_logs_error_type ON error_logs(error_type)",
        "CREATE INDEX IF NOT EXISTS ix_error_logs_created_at ON error_logs(created_at)",
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
