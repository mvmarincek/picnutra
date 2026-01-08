from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
import os

from app.db.database import init_db, async_session
from app.core.config import settings
from app.api.routes import auth, profile, meals, jobs, billing, credits, feedback

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

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/")
async def root():
    return {"message": "Nutri-Vision API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/run-migration")
async def run_migration():
    migrations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(64)",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_referral_code ON users(referral_code)",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)",
        "ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS asaas_subscription_id VARCHAR(255)",
        "ALTER TABLE users DROP COLUMN IF EXISTS stripe_customer_id",
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
