from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import json

from app.db.database import get_db
from app.models.models import User, CreditTransaction, Payment
from app.core.security import get_current_user
from app.core.config import settings
from app.services.asaas_service import asaas_service
from app.services.email_service import send_credits_purchased_email, send_upgraded_to_pro_email
from datetime import datetime

router = APIRouter(prefix="/billing", tags=["billing"])

class CreatePixPaymentRequest(BaseModel):
    package: str
    cpf: str

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

class CreateProSubscriptionRequest(BaseModel):
    billing_type: str
    card_holder_name: Optional[str] = None
    card_number: Optional[str] = None
    expiry_month: Optional[str] = None
    expiry_year: Optional[str] = None
    cvv: Optional[str] = None
    holder_cpf: Optional[str] = None
    holder_phone: Optional[str] = None
    postal_code: Optional[str] = None
    address_number: Optional[str] = None

class CreatePixPaymentResponse(BaseModel):
    payment_id: str
    pix_code: str
    pix_qr_code_base64: str
    value: float
    expiration_date: str

class PaymentStatusResponse(BaseModel):
    status: str
    confirmed: bool

class BillingStatusResponse(BaseModel):
    plan: str
    credit_balance: int
    pro_analyses_remaining: int
    has_subscription: bool

@router.get("/packages")
async def get_packages():
    return settings.CREDIT_PACKAGES

@router.get("/status", response_model=BillingStatusResponse)
async def get_billing_status(current_user: User = Depends(get_current_user)):
    return BillingStatusResponse(
        plan=current_user.plan,
        credit_balance=current_user.credit_balance,
        pro_analyses_remaining=current_user.pro_analyses_remaining or 0,
        has_subscription=bool(current_user.asaas_subscription_id)
    )

async def get_or_create_customer(user: User, db: AsyncSession, cpf: Optional[str] = None):
    if cpf and not user.cpf:
        user.cpf = cpf
    
    if user.asaas_customer_id:
        if cpf:
            await asaas_service.update_customer(user.asaas_customer_id, cpf)
        return user.asaas_customer_id
    
    customer = await asaas_service.get_customer_by_email(user.email)
    if not customer:
        customer = await asaas_service.create_customer(user.email, cpf=cpf)
    elif cpf:
        await asaas_service.update_customer(customer["id"], cpf)
    
    user.asaas_customer_id = customer["id"]
    await db.commit()
    return customer["id"]

@router.post("/create-pix-payment", response_model=CreatePixPaymentResponse)
async def create_pix_payment(
    request: CreatePixPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if request.package not in settings.CREDIT_PACKAGES:
        raise HTTPException(status_code=400, detail="Pacote invalido")
    
    package = settings.CREDIT_PACKAGES[request.package]
    value = package["price"] / 100
    credits = package["credits"]
    
    try:
        customer_id = await get_or_create_customer(current_user, db, cpf=request.cpf)
        
        external_reference = json.dumps({
            "user_id": current_user.id,
            "credits": credits,
            "type": "credits"
        })
        
        payment = await asaas_service.create_pix_payment(
            customer_id=customer_id,
            value=value,
            description=f"Nutri-Vision - {credits} Creditos",
            external_reference=external_reference
        )
        
        pix_data = await asaas_service.get_pix_qr_code(payment["id"])
        
        db_payment = Payment(
            user_id=current_user.id,
            asaas_payment_id=payment["id"],
            payment_type="credits",
            billing_type="PIX",
            amount=value,
            status="pending",
            description=f"Compra de {credits} creditos",
            credits_purchased=credits,
            pix_code=pix_data.get("payload", ""),
            pix_qr_code_url=pix_data.get("encodedImage", "")
        )
        db.add(db_payment)
        await db.commit()
        
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
        raise HTTPException(status_code=400, detail="Pacote invalido")
    
    package = settings.CREDIT_PACKAGES[request.package]
    value = package["price"] / 100
    credits = package["credits"]
    
    try:
        customer_id = await get_or_create_customer(current_user, db, cpf=request.holder_cpf)
        
        external_reference = json.dumps({
            "user_id": current_user.id,
            "credits": credits,
            "type": "credits"
        })
        
        payment = await asaas_service.create_credit_card_payment(
            customer_id=customer_id,
            value=value,
            description=f"Nutri-Vision - {credits} Creditos",
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
        
        payment_status = "confirmed" if payment.get("status") == "CONFIRMED" else "pending"
        
        db_payment = Payment(
            user_id=current_user.id,
            asaas_payment_id=payment["id"],
            payment_type="credits",
            billing_type="CREDIT_CARD",
            amount=value,
            status=payment_status,
            description=f"Compra de {credits} creditos (Cartao)",
            credits_purchased=credits,
            paid_at=datetime.utcnow() if payment_status == "confirmed" else None
        )
        db.add(db_payment)
        
        if payment.get("status") == "CONFIRMED":
            current_user.credit_balance += credits
            
            transaction = CreditTransaction(
                user_id=current_user.id,
                credits_added=credits,
                balance_after=current_user.credit_balance,
                transaction_type="purchase",
                description=f"Compra de {credits} creditos (Cartao)"
            )
            db.add(transaction)
            await db.commit()
            
            send_credits_purchased_email(current_user.email, credits, current_user.credit_balance)
            
            return {"status": "confirmed", "credits_added": credits, "new_balance": current_user.credit_balance}
        
        await db.commit()
        return {"status": payment.get("status", "pending"), "payment_id": payment["id"]}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar pagamento: {str(e)}")

@router.post("/create-pro-subscription")
async def create_pro_subscription(
    request: CreateProSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.plan == "pro":
        raise HTTPException(status_code=400, detail="Voce ja e assinante PRO")
    
    if request.billing_type not in ["PIX", "CREDIT_CARD", "BOLETO"]:
        raise HTTPException(status_code=400, detail="Tipo de pagamento invalido")
    
    try:
        cpf = request.holder_cpf if request.billing_type in ["CREDIT_CARD", "BOLETO"] else None
        customer_id = await get_or_create_customer(current_user, db, cpf=cpf)
        
        if cpf:
            await asaas_service.update_customer(customer_id, cpf)
        
        external_reference = json.dumps({
            "user_id": current_user.id,
            "type": "pro_subscription"
        })
        
        card_data = None
        card_holder_info = None
        
        if request.billing_type == "CREDIT_CARD":
            card_data = {
                "holderName": request.card_holder_name,
                "number": request.card_number,
                "expiryMonth": request.expiry_month,
                "expiryYear": request.expiry_year,
                "ccv": request.cvv
            }
            card_holder_info = {
                "name": request.card_holder_name,
                "email": current_user.email,
                "cpfCnpj": request.holder_cpf,
                "postalCode": request.postal_code,
                "addressNumber": request.address_number,
                "phone": request.holder_phone
            }
        
        subscription = await asaas_service.create_subscription(
            customer_id=customer_id,
            value=49.90,
            billing_type=request.billing_type,
            description="Nutri-Vision PRO - Assinatura Mensal",
            external_reference=external_reference,
            card_data=card_data,
            card_holder_info=card_holder_info
        )
        
        current_user.asaas_subscription_id = subscription["id"]
        
        if request.billing_type == "CREDIT_CARD" and subscription.get("status") == "ACTIVE":
            current_user.plan = "pro"
            current_user.pro_analyses_remaining = settings.PRO_MONTHLY_ANALYSES
            await db.commit()
            send_upgraded_to_pro_email(current_user.email)
            return {"status": "active", "message": "Assinatura PRO ativada com sucesso!"}
        
        await db.commit()
        
        if request.billing_type == "PIX":
            payments = subscription.get("payments", [])
            if payments:
                first_payment_id = payments[0].get("id") if isinstance(payments[0], dict) else payments[0]
                pix_data = await asaas_service.get_pix_qr_code(first_payment_id)
                return {
                    "status": "pending",
                    "payment_id": first_payment_id,
                    "pix_code": pix_data.get("payload", ""),
                    "pix_qr_code_base64": pix_data.get("encodedImage", ""),
                    "message": "Pague o PIX para ativar sua assinatura"
                }
        
        if request.billing_type == "BOLETO":
            payments = subscription.get("payments", [])
            if payments:
                first_payment_id = payments[0].get("id") if isinstance(payments[0], dict) else payments[0]
                boleto_url = await asaas_service.get_boleto_url(first_payment_id)
                return {
                    "status": "pending",
                    "payment_id": first_payment_id,
                    "boleto_url": boleto_url,
                    "message": "Pague o boleto para ativar sua assinatura"
                }
        
        return {"status": "pending", "subscription_id": subscription["id"]}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao criar assinatura: {str(e)}")

@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not current_user.asaas_subscription_id:
        raise HTTPException(status_code=400, detail="Voce nao possui assinatura ativa")
    
    try:
        await asaas_service.cancel_subscription(current_user.asaas_subscription_id)
        current_user.asaas_subscription_id = None
        current_user.plan = "free"
        await db.commit()
        
        return {"status": "cancelled", "message": "Assinatura cancelada com sucesso"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao cancelar assinatura: {str(e)}")

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
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        body = await request.json()
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    event_type = body.get("event")
    payment = body.get("payment", {})
    subscription = body.get("subscription", {})
    
    logger.info(f"[webhook] Received event: {event_type}")
    
    if event_type in ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]:
        external_reference = payment.get("externalReference")
        asaas_payment_id = payment.get("id")
        
        db_payment_result = await db.execute(
            select(Payment).where(Payment.asaas_payment_id == asaas_payment_id)
        )
        db_payment = db_payment_result.scalar_one_or_none()
        if db_payment:
            db_payment.status = "confirmed"
            db_payment.paid_at = datetime.utcnow()
        
        if external_reference:
            try:
                ref_data = json.loads(external_reference)
                user_id = ref_data.get("user_id")
                credits = ref_data.get("credits")
                payment_type = ref_data.get("type")
                
                logger.info(f"[webhook] Processing payment for user_id={user_id}, type={payment_type}")
                
                if user_id:
                    result = await db.execute(select(User).where(User.id == int(user_id)))
                    user = result.scalar_one_or_none()
                    
                    if user:
                        if payment_type == "credits" and credits:
                            existing = await db.execute(
                                select(CreditTransaction).where(
                                    CreditTransaction.transaction_type == "purchase",
                                    CreditTransaction.description.contains(asaas_payment_id) if asaas_payment_id else False
                                )
                            )
                            if existing.scalar_one_or_none():
                                logger.info(f"[webhook] Payment {asaas_payment_id} already processed")
                                return {"status": "already_processed"}
                            
                            user.credit_balance += int(credits)
                            
                            transaction = CreditTransaction(
                                user_id=user.id,
                                credits_added=int(credits),
                                balance_after=user.credit_balance,
                                transaction_type="purchase",
                                description=f"Compra de {credits} creditos (PIX) - {asaas_payment_id}"
                            )
                            db.add(transaction)
                            await db.commit()
                            
                            logger.info(f"[webhook] Added {credits} credits to user_id={user_id}")
                            send_credits_purchased_email(user.email, int(credits), user.credit_balance)
                            return {"status": "credits_added", "credits": credits}
                        
                        elif payment_type == "pro_subscription":
                            if user.plan != "pro":
                                user.plan = "pro"
                                user.pro_analyses_remaining = settings.PRO_MONTHLY_ANALYSES
                                user.pro_started_at = datetime.utcnow()
                                await db.commit()
                                logger.info(f"[webhook] PRO activated for user_id={user_id}")
                                send_upgraded_to_pro_email(user.email)
                                return {"status": "pro_activated"}
                            else:
                                user.pro_analyses_remaining = settings.PRO_MONTHLY_ANALYSES
                                await db.commit()
                                logger.info(f"[webhook] PRO renewed for user_id={user_id}")
                                return {"status": "pro_renewed"}
                            
            except json.JSONDecodeError:
                logger.error(f"[webhook] Failed to parse externalReference: {external_reference}")
    
    elif event_type == "PAYMENT_OVERDUE":
        external_reference = payment.get("externalReference")
        if external_reference:
            try:
                ref_data = json.loads(external_reference)
                user_id = ref_data.get("user_id")
                payment_type = ref_data.get("type")
                
                if user_id and payment_type == "pro_subscription":
                    result = await db.execute(select(User).where(User.id == int(user_id)))
                    user = result.scalar_one_or_none()
                    if user and user.plan == "pro":
                        logger.warning(f"[webhook] Payment overdue for PRO user_id={user_id}")
            except json.JSONDecodeError:
                pass
    
    elif event_type in ["SUBSCRIPTION_DELETED", "SUBSCRIPTION_INACTIVE", "SUBSCRIPTION_INACTIVATED"]:
        subscription_id = subscription.get("id") or body.get("id")
        if subscription_id:
            result = await db.execute(
                select(User).where(User.asaas_subscription_id == subscription_id)
            )
            user = result.scalar_one_or_none()
            if user:
                user.plan = "free"
                user.asaas_subscription_id = None
                await db.commit()
                logger.info(f"[webhook] Subscription cancelled for user_id={user.id}")
                return {"status": "subscription_cancelled"}
    
    return {"status": "ok"}
