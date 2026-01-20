from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.core.config import settings

Base = declarative_base()

_engine = None
_async_session = None

def get_database_url():
    url = settings.DATABASE_URL
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

def get_engine():
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            get_database_url(),
            echo=False,
            pool_pre_ping=True,
            pool_recycle=300
        )
    return _engine

def get_session_maker():
    global _async_session
    if _async_session is None:
        _async_session = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False
        )
    return _async_session

def async_session():
    return get_session_maker()()

async def get_db():
    session_maker = get_session_maker()
    async with session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def run_migrations(conn):
    migrations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(14)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_started_at TIMESTAMP",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMP",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()",
        "ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS balance_after INTEGER",
        "ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50)",
        """CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            asaas_payment_id VARCHAR(255),
            asaas_subscription_id VARCHAR(255),
            payment_type VARCHAR(50),
            billing_type VARCHAR(20),
            amount FLOAT,
            status VARCHAR(50) DEFAULT 'pending',
            description VARCHAR(255),
            credits_purchased INTEGER,
            pix_code TEXT,
            pix_qr_code_url VARCHAR(500),
            boleto_url VARCHAR(500),
            paid_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )""",
        "UPDATE users SET is_admin = TRUE WHERE email = 'mvmarincek@gmail.com'",
    ]
    
    for sql in migrations:
        try:
            await conn.execute(text(sql))
        except Exception as e:
            print(f"Migration warning: {e}")

async def init_db():
    import asyncio
    from app.models import models
    try:
        async with asyncio.timeout(30):
            async with get_engine().begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                await run_migrations(conn)
        print("[DB] Database initialized successfully")
    except asyncio.TimeoutError:
        print("[DB] Database connection timeout - continuing without migrations")
    except Exception as e:
        print(f"[DB] Database initialization error: {e} - continuing anyway")
