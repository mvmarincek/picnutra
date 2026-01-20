from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://localhost/nutrivision"
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200
    OPENAI_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "https://picnutra-api.onrender.com"
    UPLOAD_DIR: str = "./uploads"
    
    ASAAS_API_KEY: str = ""
    ASAAS_WALLET_ID: str = ""
    ASAAS_BASE_URL: str = "https://api.asaas.com/v3"
    ASAAS_WEBHOOK_TOKEN: str = ""
    
    RESEND_API_KEY: str = ""
    
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    CREDIT_COST_SIMPLE: int = 1
    CREDIT_COST_FULL: int = 12
    PRO_MONTHLY_ANALYSES: int = 90
    
    CREDIT_PACKAGES: dict = {
        "12": {"credits": 12, "price": 490},
        "36": {"credits": 36, "price": 1290},
        "60": {"credits": 60, "price": 1990},
        "120": {"credits": 120, "price": 3490}
    }
    
    class Config:
        env_file = ".env"
        extra = "allow"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
