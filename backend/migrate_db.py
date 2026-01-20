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
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(14)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_started_at TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()",
            "CREATE INDEX IF NOT EXISTS ix_users_cpf ON users(cpf)",
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
            "CREATE INDEX IF NOT EXISTS ix_payments_asaas_payment_id ON payments(asaas_payment_id)",
            "CREATE INDEX IF NOT EXISTS ix_payments_user_id ON payments(user_id)",
            "ALTER TABLE payments ALTER COLUMN pix_qr_code_url TYPE TEXT",
            "ALTER TABLE payments ALTER COLUMN boleto_url TYPE TEXT",
            "ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS balance_after INTEGER",
            "ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50)",
            "UPDATE users SET is_admin = TRUE WHERE email = 'mvmarincek@gmail.com'",
            """CREATE TABLE IF NOT EXISTS email_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                to_email VARCHAR(255) NOT NULL,
                subject VARCHAR(500) NOT NULL,
                email_type VARCHAR(50) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                error_message TEXT,
                resend_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW()
            )""",
            "CREATE INDEX IF NOT EXISTS ix_email_logs_to_email ON email_logs(to_email)",
            "CREATE INDEX IF NOT EXISTS ix_email_logs_email_type ON email_logs(email_type)",
            "CREATE INDEX IF NOT EXISTS ix_email_logs_status ON email_logs(status)",
            """CREATE TABLE IF NOT EXISTS email_settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(100) UNIQUE NOT NULL,
                value TEXT NOT NULL,
                description VARCHAR(255),
                updated_at TIMESTAMP DEFAULT NOW()
            )""",
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_email_settings_key ON email_settings(key)",
            """INSERT INTO email_settings (key, value, description) VALUES 
                ('admin_email', 'mvmarincek@gmail.com', 'Email do administrador para receber notificacoes'),
                ('support_email', 'suporte@picnutra.com', 'Email de suporte exibido nos emails'),
                ('app_url', 'https://picnutra.vercel.app', 'URL base da aplicacao'),
                ('frontend_url', 'https://picnutra.vercel.app', 'URL do frontend para links nos emails'),
                ('from_name', 'PicNutra', 'Nome do remetente nos emails'),
                ('from_email', 'picnutra-noreply@picnutra.com', 'Email do remetente'),
                ('welcome_credits', '36', 'Creditos de bonus para novos usuarios'),
                ('referral_credits', '12', 'Creditos por indicacao')
            ON CONFLICT (key) DO NOTHING""",
        ]
        
        for sql in migrations:
            print(f"Executing: {sql[:80]}...")
            try:
                await conn.execute(text(sql))
                print("OK")
            except Exception as e:
                print(f"Error: {e}")
    
    await engine.dispose()
    print("Migration completed!")

if __name__ == "__main__":
    asyncio.run(migrate())
