from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, JSON, Enum, Boolean
from sqlalchemy.orm import relationship
import enum
from app.db.database import Base

class PlanType(str, enum.Enum):
    FREE = "free"
    PRO = "pro"

class JobStatus(str, enum.Enum):
    RECEIVED = "received"
    RUNNING = "running"
    WAITING_USER = "waiting_user"
    COMPLETED = "completed"
    FAILED = "failed"

class JobType(str, enum.Enum):
    ANALYZE_MEAL = "analyze_meal"
    GENERATE_SUGGESTION_IMAGE = "generate_suggestion_image"

class MealStatus(str, enum.Enum):
    PENDING = "pending"
    ANALYZING = "analyzing"
    WAITING_USER = "waiting_user"
    COMPLETED = "completed"
    FAILED = "failed"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    plan = Column(String(20), default=PlanType.FREE.value)
    credit_balance = Column(Integer, default=0)
    stripe_customer_id = Column(String(255), nullable=True)
    pro_analyses_remaining = Column(Integer, default=0)
    referral_code = Column(String(20), unique=True, nullable=True, index=True)
    referred_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    profile = relationship("Profile", back_populates="user", uselist=False)
    meals = relationship("Meal", back_populates="user")
    jobs = relationship("Job", back_populates="user")
    credit_transactions = relationship("CreditTransaction", back_populates="user")
    referrals = relationship("Referral", back_populates="referrer", foreign_keys="Referral.referrer_id")

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    objetivo = Column(String(50), nullable=True)
    restricoes = Column(JSON, default=list)
    alergias = Column(JSON, default=list)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="profile")

class Meal(Base):
    __tablename__ = "meals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_url = Column(String(500), nullable=False)
    meal_type = Column(String(50), default="prato")
    status = Column(String(20), default=MealStatus.PENDING.value)
    mode = Column(String(20), default="simple")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="meals")
    analysis = relationship("MealAnalysis", back_populates="meal", uselist=False)
    jobs = relationship("Job", back_populates="meal")

class MealAnalysis(Base):
    __tablename__ = "meal_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id"), unique=True)
    itens_identificados = Column(JSON, default=list)
    porcoes_estimadas = Column(JSON, default=list)
    calorias_central = Column(Float, nullable=True)
    calorias_min = Column(Float, nullable=True)
    calorias_max = Column(Float, nullable=True)
    proteina_g = Column(Float, nullable=True)
    carbo_g = Column(Float, nullable=True)
    gordura_g = Column(Float, nullable=True)
    fibra_g = Column(Float, nullable=True)
    confianca = Column(String(20), nullable=True)
    incertezas = Column(JSON, default=list)
    beneficios = Column(JSON, default=list)
    pontos_de_atencao = Column(JSON, default=list)
    recomendacoes_praticas = Column(JSON, default=list)
    sugestao_melhorada_texto = Column(Text, nullable=True)
    sugestao_melhorada_imagem_url = Column(String(500), nullable=True)
    mudancas_sugeridas = Column(JSON, default=list)
    calorias_nova_versao = Column(JSON, nullable=True)
    macros_nova_versao = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    meal = relationship("Meal", back_populates="analysis")

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=True)
    tipo = Column(String(50), default=JobType.ANALYZE_MEAL.value)
    status = Column(String(20), default=JobStatus.RECEIVED.value)
    etapa_atual = Column(String(100), nullable=True)
    questions = Column(JSON, default=list)
    answers = Column(JSON, default=dict)
    resultado_final = Column(JSON, nullable=True)
    erro = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="jobs")
    meal = relationship("Meal", back_populates="jobs")

class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    credits_added = Column(Integer, nullable=False)
    credits_used = Column(Integer, default=0)
    stripe_payment_id = Column(String(255), nullable=True)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="credit_transactions")

class Referral(Base):
    __tablename__ = "referrals"
    
    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    referred_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    credits_awarded = Column(Integer, default=12)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    referrer = relationship("User", back_populates="referrals", foreign_keys=[referrer_id])
