import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = os.getenv("DATABASE_URL", "")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

async def migrate():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set")
        return
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        migrations = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(64)",
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_referral_code ON users(referral_code)",
            "ALTER TABLE meals ADD COLUMN IF NOT EXISTS user_notes TEXT",
            "ALTER TABLE meals ADD COLUMN IF NOT EXISTS weight_grams FLOAT",
            "ALTER TABLE meals ADD COLUMN IF NOT EXISTS volume_ml FLOAT",
        ]
        
        for sql in migrations:
            print(f"Executing: {sql}")
            try:
                await conn.execute(text(sql))
                print("OK")
            except Exception as e:
                print(f"Error: {e}")
    
    await engine.dispose()
    print("Migration completed!")

if __name__ == "__main__":
    asyncio.run(migrate())
