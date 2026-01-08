from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    plan: str
    credit_balance: int
    pro_analyses_remaining: int
    referral_code: Optional[str] = None
    email_verified: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ProfileCreate(BaseModel):
    objetivo: Optional[str] = None
    restricoes: Optional[List[str]] = []
    alergias: Optional[List[str]] = []

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    objetivo: Optional[str]
    restricoes: List[str]
    alergias: List[str]
    avatar_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class MealUploadResponse(BaseModel):
    meal_id: int
    image_url: str

class AnalyzeRequest(BaseModel):
    mode: str = "simple"
    user_context: Optional[Dict[str, Any]] = None

class AnalyzeResponse(BaseModel):
    job_id: int

class AnswersRequest(BaseModel):
    answers: Dict[str, str]

class QuestionItem(BaseModel):
    id: str
    question: str
    options: Optional[List[str]] = None

class JobResponse(BaseModel):
    id: int
    status: str
    etapa_atual: Optional[str]
    questions: Optional[List[QuestionItem]] = None
    resultado_final: Optional[Dict[str, Any]] = None
    erro: Optional[str] = None

class ItemIdentificado(BaseModel):
    nome: str
    alternativas: List[str] = []
    confianca: str

class PorcaoEstimada(BaseModel):
    item: str
    peso_g_ml_central: float
    faixa_min: float
    faixa_max: float
    confianca: str

class CaloriasInfo(BaseModel):
    central: float
    min: float
    max: float

class MacrosInfo(BaseModel):
    proteina_g: float
    carbo_g: float
    gordura_g: float
    fibra_g: Optional[float] = None

class MealAnalysisResponse(BaseModel):
    id: int
    meal_id: int
    itens_identificados: List[ItemIdentificado]
    porcoes_estimadas: List[PorcaoEstimada]
    calorias: CaloriasInfo
    macros: MacrosInfo
    confianca: str
    incertezas: List[str]
    beneficios: List[str]
    pontos_de_atencao: List[str]
    recomendacoes_praticas: List[str]
    sugestao_melhorada_texto: Optional[str] = None
    sugestao_melhorada_imagem_url: Optional[str] = None
    mudancas_sugeridas: Optional[List[str]] = None
    calorias_nova_versao: Optional[CaloriasInfo] = None
    macros_nova_versao: Optional[MacrosInfo] = None
    created_at: datetime

class MealListItem(BaseModel):
    id: int
    image_url: str
    meal_type: str
    status: str
    mode: str
    created_at: datetime
    calorias_central: Optional[float] = None
    
    class Config:
        from_attributes = True

class MealDetailResponse(BaseModel):
    id: int
    image_url: str
    meal_type: str
    status: str
    mode: str
    created_at: datetime
    analysis: Optional[MealAnalysisResponse] = None

class CreditCheckoutRequest(BaseModel):
    package: str

class CreditCheckoutResponse(BaseModel):
    checkout_url: str

class ProSubscriptionResponse(BaseModel):
    checkout_url: str

class BillingStatusResponse(BaseModel):
    plan: str
    credit_balance: int
    pro_analyses_remaining: int
    stripe_customer_id: Optional[str]

class CreditBalanceResponse(BaseModel):
    credit_balance: int
    pro_analyses_remaining: int
