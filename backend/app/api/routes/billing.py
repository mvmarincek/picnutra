from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import json

from app.db.database import get_db
from app.models.models import User, CreditTransaction
from app.core.security import get_current_user
from app.core.config import settings
from app.services.asaas_service import asaas_service
from app.services.email_service import send_credits_purchased_email

router = APIRouter(prefix="/billing", tags=["billing"])

class CreatePixPaymentRequest(BaseModel):
    package: str

class CreatePixPaymentResponse(BaseModel):
    payment_id: str
    pix_code: str
    pix_qr_code_base64: str
    value: float
    expiration_date: str

class CreateCardPaymentRequest(BaseModel):
    package: str
    card_holder_name: str
    card_number: str
    expiry_month: str
    expiry_year: str
    cvv: str
    holder_cpf: str
    holder_phone: str
    postal_code: str
    address_number: str

class PaymentStatusResponse(BaseModel):
    status: str
    confirmed: bool

class BillingStatusResponse(BaseModel):
    plan: str
    credit_balance: int
    pro_analyses_remaining: int

@router.get("/packages")
async def get_packages():
    return settings.CREDIT_PACKAGES

@router.get("/status", response_model=BillingStatusResponse)
async def get_billing_status(current_user: User = Depends(get_current_user)):
    return BillingStatusResponse(
        plan=current_user.plan,
        credit_balance=current_user.credit_balance,
        pro_analyses_remaining=current_user.pro_analyses_remaining or 0
    )

@router.post("/create-pix-payment", response_model=CreatePixPaymentResponse)
async def create_pix_payment(
    request: CreatePixPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if request.package not in settings.CREDIT_PACKAGES:
        raise HTTPException(status_code=400, detail="Pacote inválido")
    
    package = settings.CREDIT_PACKAGES[request.package]
    value = package["price"] / 100
    credits = package["credits"]
    
    try:
        customer = await asaas_service.get_customer_by_email(current_user.email)
        if not customer:
            customer = await asaas_service.create_customer(current_user.email)
        
        customer_id = customer["id"]
        
        external_reference = json.dumps({
            "user_id": current_user.id,
            "credits": credits,
            "type": "credits"
        })
        
        payment = await asaas_service.create_pix_payment(
            customer_id=customer_id,
            value=value,
            description=f"Nutri-Vision - {credits} Créditos",
            external_reference=external_reference
        )
        
        pix_data = await asaas_service.get_pix_qr_code(payment["id"])
        
        return CreatePixPaymentResponse(
            payment_id=payment["id"],
            pix_code=pix_data.get("payload", ""),
            pix_qr_code_base64=pix_data.get("encodedImage", ""),
            value=value,
            expiration_date=pix_data.get("expirationDate", "")
        )
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao criar pagamento: {str(e)}")

@router.post("/create-card-payment")
async def create_card_payment(
    request: CreateCardPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if request.package not in settings.CREDIT_PACKAGES:
        raise HTTPException(status_code=400, detail="Pacote inválido")
    
    package = settings.CREDIT_PACKAGES[request.package]
    value = package["price"] / 100
    credits = package["credits"]
    
    try:
        customer = await asaas_service.get_customer_by_email(current_user.email)
        if not customer:
            customer = await asaas_service.create_customer(current_user.email)
        
        customer_id = customer["id"]
        
        external_reference = json.dumps({
            "user_id": current_user.id,
            "credits": credits,
            "type": "credits"
        })
        
        payment = await asaas_service.create_credit_card_payment(
            customer_id=customer_id,
            value=value,
            description=f"Nutri-Vision - {credits} Créditos",
            external_reference=external_reference,
            card_holder_name=request.card_holder_name,
            card_number=request.card_number,
            expiry_month=request.expiry_month,
            expiry_year=request.expiry_year,
            cvv=request.cvv,
            holder_cpf=request.holder_cpf,
            holder_email=current_user.email,
            holder_phone=request.holder_phone,
            postal_code=request.postal_code,
            address_number=request.address_number
        )
        
        if payment.get("status") == "CONFIRMED":
            current_user.credit_balance += credits
            
            transaction = CreditTransaction(
                user_id=current_user.id,
                credits_added=credits,
                payment_id=payment["id"],
                description=f"Compra de {credits} créditos (Cartão)"
            )
            db.add(transaction)
            await db.commit()
            
            send_credits_purchased_email(current_user.email, credits, current_user.credit_balance)
            
            return {"status": "confirmed", "credits_added": credits, "new_balance": current_user.credit_balance}
        
        return {"status": payment.get("status", "pending"), "payment_id": payment["id"]}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar pagamento: {str(e)}")

@router.get("/payment-status/{payment_id}", response_model=PaymentStatusResponse)
async def get_payment_status(
    payment_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        payment = await asaas_service.get_payment(payment_id)
        status = payment.get("status", "PENDING")
        confirmed = status in ["CONFIRMED", "RECEIVED"]
        
        return PaymentStatusResponse(status=status, confirmed=confirmed)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao verificar status: {str(e)}")

@router.post("/webhook")
async def asaas_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    try:
        body = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    event_type = body.get("event")
    payment = body.get("payment", {})
    
    if event_type == "PAYMENT_CONFIRMED" or event_type == "PAYMENT_RECEIVED":
        external_reference = payment.get("externalReference")
        
        if external_reference:
            try:
                ref_data = json.loads(external_reference)
                user_id = ref_data.get("user_id")
                credits = ref_data.get("credits")
                payment_type = ref_data.get("type")
                
                if user_id and credits and payment_type == "credits":
                    result = await db.execute(select(User).where(User.id == int(user_id)))
                    user = result.scalar_one_or_none()
                    
                    if user:
                        existing = await db.execute(
                            select(CreditTransaction).where(
                                CreditTransaction.payment_id == payment.get("id")
                            )
                        )
                        if existing.scalar_one_or_none():
                            return {"status": "already_processed"}
                        
                        user.credit_balance += int(credits)
                        
                        transaction = CreditTransaction(
                            user_id=user.id,
                            credits_added=int(credits),
                            payment_id=payment.get("id"),
                            description=f"Compra de {credits} créditos (PIX)"
                        )
                        db.add(transaction)
                        await db.commit()
                        
                        send_credits_purchased_email(user.email, int(credits), user.credit_balance)
                        
                        return {"status": "credits_added", "credits": credits}
            except json.JSONDecodeError:
                pass
    
    return {"status": "ok"}
