from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import json
import httpx

from app.db.database import get_db
from app.models.models import User, CreditTransaction, Payment
from app.core.security import get_current_user
from app.core.config import settings
from app.services.asaas_service import asaas_service
from app.services.email_service import send_credits_purchased_email, send_upgraded_to_pro_email, send_subscription_cancelled_email, send_subscription_renewed_email, flush_email_logs
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
        try:
            if cpf:
                await asaas_service.update_customer(user.asaas_customer_id, cpf)
            existing = await asaas_service.get_customer_by_email(user.email)
            if existing and existing["id"] == user.asaas_customer_id:
                return user.asaas_customer_id
        except Exception:
            pass
        user.asaas_customer_id = None
    
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
        
        try:
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
        except Exception as db_error:
            import logging
            logging.getLogger(__name__).warning(f"Failed to save payment to DB: {db_error}")
        
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
            
            send_credits_purchased_email(current_user.email, credits, current_user.credit_balance, current_user.id)
            
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
    
    if request.billing_type not in ["PIX", "CREDIT_CARD"]:
        raise HTTPException(status_code=400, detail="Tipo de pagamento invalido")
    
    try:
        cpf = request.holder_cpf if request.holder_cpf else None
        customer_id = await get_or_create_customer(current_user, db, cpf=cpf)
        
        if cpf:
            await asaas_service.update_customer(customer_id, cpf)
        
        external_reference = json.dumps({
            "user_id": current_user.id,
            "type": "pro_subscription"
        })
        
        if request.billing_type == "PIX":
            payment = await asaas_service.create_pix_payment(
                customer_id=customer_id,
                value=49.90,
                description="Nutri-Vision PRO - Primeira mensalidade",
                external_reference=external_reference
            )
            
            payment_id = payment.get("id")
            pix_data = await asaas_service.get_pix_qr_code(payment_id)
            
            db_payment = Payment(
                user_id=current_user.id,
                asaas_payment_id=payment_id,
                payment_type="pro_subscription",
                billing_type="PIX",
                amount=49.90,
                status="pending",
                pix_code=pix_data.get("payload", "")[:500] if pix_data.get("payload") else None
            )
            db.add(db_payment)
            await db.commit()
            
            return {
                "status": "pending",
                "payment_id": payment_id,
                "pix_code": pix_data.get("payload", ""),
                "pix_qr_code_base64": pix_data.get("encodedImage", ""),
                "message": "Pague o PIX para ativar sua assinatura PRO"
            }
        
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
                billing_type="CREDIT_CARD",
                description="Nutri-Vision PRO - Assinatura Mensal",
                external_reference=external_reference,
                card_data=card_data,
                card_holder_info=card_holder_info,
                next_due_days=1
            )
            
            current_user.asaas_subscription_id = subscription["id"]
            current_user.plan = "pro"
            current_user.pro_analyses_remaining = settings.PRO_MONTHLY_ANALYSES
            current_user.pro_started_at = datetime.utcnow()
            await db.commit()
            send_upgraded_to_pro_email(current_user.email, current_user.id)
            await flush_email_logs(db)
            return {"status": "active", "message": "Assinatura PRO ativada com sucesso!"}
        
        return {"status": "error", "message": "Tipo de pagamento nao suportado"}
    
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
        user_email = current_user.email
        current_user.asaas_subscription_id = None
        current_user.plan = "free"
        current_user.pro_analyses_remaining = 0
        await db.commit()
        
        send_subscription_cancelled_email(user_email, current_user.id)
        await flush_email_logs(db)
        
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
                            send_credits_purchased_email(user.email, int(credits), user.credit_balance, user.id)
                            await flush_email_logs(db)
                            return {"status": "credits_added", "credits": credits}
                        
                        elif payment_type == "pro_subscription":
                            if user.plan != "pro":
                                user.plan = "pro"
                                user.pro_analyses_remaining = settings.PRO_MONTHLY_ANALYSES
                                user.pro_started_at = datetime.utcnow()
                                
                                if not user.asaas_subscription_id and user.asaas_customer_id:
                                    try:
                                        from datetime import timedelta
                                        next_month = datetime.utcnow() + timedelta(days=30)
                                        
                                        subscription = await asaas_service.create_subscription(
                                            customer_id=user.asaas_customer_id,
                                            value=49.90,
                                            billing_type="PIX",
                                            description="Nutri-Vision PRO - Assinatura Mensal",
                                            external_reference=json.dumps({
                                                "user_id": user.id,
                                                "type": "pro_subscription"
                                            })
                                        )
                                        user.asaas_subscription_id = subscription.get("id")
                                        logger.info(f"[webhook] Created recurring subscription for user_id={user_id}")
                                    except Exception as sub_error:
                                        logger.error(f"[webhook] Failed to create subscription: {sub_error}")
                                
                                await db.commit()
                                logger.info(f"[webhook] PRO activated for user_id={user_id}")
                                send_upgraded_to_pro_email(user.email, user.id)
                                await flush_email_logs(db)
                                return {"status": "pro_activated"}
                            else:
                                user.pro_analyses_remaining = settings.PRO_MONTHLY_ANALYSES
                                await db.commit()
                                logger.info(f"[webhook] PRO renewed for user_id={user_id}")
                                send_subscription_renewed_email(user.email, settings.PRO_MONTHLY_ANALYSES, user.id)
                                await flush_email_logs(db)
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

@router.get("/debug-pix/{cpf}")
async def debug_pix_payment(
    cpf: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import traceback
    result = {
        "step": "start",
        "user_id": current_user.id,
        "user_email": current_user.email,
        "cpf_received": cpf,
        "cpf_cleaned": cpf.replace(".", "").replace("-", ""),
        "asaas_customer_id": current_user.asaas_customer_id,
    }
    
    try:
        result["step"] = "get_or_create_customer"
        clean_cpf = cpf.replace(".", "").replace("-", "")
        customer_id = await get_or_create_customer(current_user, db, cpf=clean_cpf)
        result["customer_id"] = customer_id
        
        result["step"] = "create_payment"
        external_reference = json.dumps({
            "user_id": current_user.id,
            "credits": 10,
            "type": "credits"
        })
        
        payment = await asaas_service.create_pix_payment(
            customer_id=customer_id,
            value=9.90,
            description="Teste PIX",
            external_reference=external_reference
        )
        result["payment"] = payment
        result["payment_id"] = payment.get("id")
        
        result["step"] = "get_qr_code"
        pix_data = await asaas_service.get_pix_qr_code(payment["id"])
        result["pix_payload"] = pix_data.get("payload", "")[:50] + "..." if pix_data.get("payload") else None
        result["has_qr_code"] = bool(pix_data.get("encodedImage"))
        
        result["step"] = "success"
        result["success"] = True
        
    except Exception as e:
        result["error"] = str(e)
        result["error_type"] = type(e).__name__
        result["traceback"] = traceback.format_exc()
        result["success"] = False
    
    return result

@router.post("/test-confirm-payment/{payment_id}")
async def test_confirm_payment(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    import logging
    logger = logging.getLogger(__name__)
    
    result = await db.execute(
        select(Payment).where(Payment.asaas_payment_id == payment_id)
    )
    db_payment = result.scalar_one_or_none()
    
    if not db_payment:
        raise HTTPException(status_code=404, detail="Pagamento nao encontrado")
    
    if db_payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Pagamento nao pertence a este usuario")
    
    if db_payment.status == "confirmed":
        raise HTTPException(status_code=400, detail="Pagamento ja confirmado")
    
    db_payment.status = "confirmed"
    db_payment.paid_at = datetime.utcnow()
    
    if db_payment.payment_type == "pro_subscription":
        current_user.plan = "pro"
        current_user.pro_analyses_remaining = settings.PRO_MONTHLY_ANALYSES
        current_user.pro_started_at = datetime.utcnow()
        
        if not current_user.asaas_subscription_id and current_user.asaas_customer_id:
            try:
                subscription = await asaas_service.create_subscription(
                    customer_id=current_user.asaas_customer_id,
                    value=49.90,
                    billing_type="PIX",
                    description="Nutri-Vision PRO - Assinatura Mensal",
                    external_reference=json.dumps({
                        "user_id": current_user.id,
                        "type": "pro_subscription"
                    })
                )
                current_user.asaas_subscription_id = subscription.get("id")
                logger.info(f"[test] Created subscription {subscription.get('id')} for user {current_user.id}")
            except Exception as e:
                logger.error(f"[test] Failed to create subscription: {e}")
        
        await db.commit()
        send_upgraded_to_pro_email(current_user.email)
        await flush_email_logs(db)
        
        return {
            "status": "success",
            "message": "Pagamento confirmado! Voce agora e PRO!",
            "plan": "pro",
            "pro_analyses_remaining": current_user.pro_analyses_remaining,
            "subscription_id": current_user.asaas_subscription_id
        }
    
    elif db_payment.payment_type == "credits":
        credits = 10
        if db_payment.amount == 9.90:
            credits = 10
        elif db_payment.amount == 24.90:
            credits = 30
        elif db_payment.amount == 39.90:
            credits = 50
        
        current_user.credit_balance += credits
        
        transaction = CreditTransaction(
            user_id=current_user.id,
            credits_added=credits,
            balance_after=current_user.credit_balance,
            transaction_type="purchase",
            description=f"Compra de {credits} creditos (teste) - {payment_id}"
        )
        db.add(transaction)
        await db.commit()
        
        send_credits_purchased_email(current_user.email, credits, current_user.credit_balance)
        await flush_email_logs(db)
        
        return {
            "status": "success",
            "message": f"Pagamento confirmado! {credits} creditos adicionados!",
            "credits_added": credits,
            "new_balance": current_user.credit_balance
        }
    
    await db.commit()
    await flush_email_logs(db)
    return {"status": "success", "message": "Pagamento confirmado"}
