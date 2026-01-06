from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://localhost/nutrivision"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    OPENAI_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    UPLOAD_DIR: str = "./uploads"
    
    CREDIT_COST_SIMPLE: int = 5
    CREDIT_COST_FULL: int = 12
    PRO_MONTHLY_ANALYSES: int = 30
    
    CREDIT_PACKAGES: dict = {
        "50": {"credits": 50, "price": 990},
        "100": {"credits": 100, "price": 1790},
        "300": {"credits": 300, "price": 4490},
        "1000": {"credits": 1000, "price": 12990}
    }
    
    class Config:
        env_file = ".env"
        extra = "allow"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
