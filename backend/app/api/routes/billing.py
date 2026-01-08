from fastapi import APIRouter, Depends, HTTPException, Request, Header, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import stripe
from app.db.database import get_db
from app.models.models import User, CreditTransaction
from app.schemas.schemas import (
    CreditCheckoutRequest, CreditCheckoutResponse, ProSubscriptionResponse,
    BillingStatusResponse, CreditBalanceResponse
)
from app.core.security import get_current_user
from app.core.config import settings
from app.services.email_service import send_upgraded_to_pro_email, send_credits_purchased_email, send_subscription_cancelled_email

router = APIRouter(prefix="/billing", tags=["billing"])

stripe.api_key = settings.STRIPE_SECRET_KEY

@router.post("/create-credit-checkout", response_model=CreditCheckoutResponse)
async def create_credit_checkout(
    request: CreditCheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if request.package not in settings.CREDIT_PACKAGES:
        raise HTTPException(status_code=400, detail="Pacote inválido")
    
    package = settings.CREDIT_PACKAGES[request.package]
    
    try:
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(email=current_user.email)
            current_user.stripe_customer_id = customer.id
            await db.commit()
        
        session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "brl",
                    "product_data": {
                        "name": f"Nutri-Vision - {package['credits']} Créditos",
                        "description": f"Pacote de {package['credits']} créditos para análises nutricionais"
                    },
                    "unit_amount": package["price"]
                },
                "quantity": 1
            }],
            mode="payment",
            success_url=f"{settings.FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/billing/cancel",
            metadata={
                "user_id": str(current_user.id),
                "credits": str(package["credits"]),
                "type": "credits"
            }
        )
        
        return CreditCheckoutResponse(checkout_url=session.url)
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/create-pro-subscription-checkout", response_model=ProSubscriptionResponse)
async def create_pro_subscription_checkout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(email=current_user.email)
            current_user.stripe_customer_id = customer.id
            await db.commit()
        
        session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "brl",
                    "product_data": {
                        "name": "Nutri-Vision Pro",
                        "description": f"Assinatura mensal com {settings.PRO_MONTHLY_ANALYSES} análises completas/mês"
                    },
                    "unit_amount": 4990,
                    "recurring": {
                        "interval": "month"
                    }
                },
                "quantity": 1
            }],
            mode="subscription",
            success_url=f"{settings.FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/billing/cancel",
            metadata={
                "user_id": str(current_user.id),
                "type": "pro_subscription"
            }
        )
        
        return ProSubscriptionResponse(checkout_url=session.url)
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    db: AsyncSession = Depends(get_db)
):
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})
        user_id = metadata.get("user_id")
        
        if user_id:
            result = await db.execute(select(User).where(User.id == int(user_id)))
            user = result.scalar_one_or_none()
            
            if user:
                if metadata.get("type") == "credits":
                    credits = int(metadata.get("credits", 0))
                    user.credit_balance += credits
                    
                    transaction = CreditTransaction(
                        user_id=user.id,
                        credits_added=credits,
                        stripe_payment_id=session.get("payment_intent"),
                        description=f"Compra de {credits} créditos"
                    )
                    db.add(transaction)
                    await db.commit()
                    await db.refresh(user)
                    
                    send_credits_purchased_email(user.email, credits, user.credit_balance)
                
                elif metadata.get("type") == "pro_subscription":
                    user.plan = "pro"
                    user.pro_analyses_remaining = settings.PRO_MONTHLY_ANALYSES
                    await db.commit()
                    
                    send_upgraded_to_pro_email(user.email)
    
    elif event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        
        result = await db.execute(
            select(User).where(User.stripe_customer_id == customer_id)
        )
        user = result.scalar_one_or_none()
        
        if user:
            if subscription.get("status") == "active":
                user.plan = "pro"
                if subscription.get("current_period_start"):
                    user.pro_analyses_remaining = settings.PRO_MONTHLY_ANALYSES
            else:
                user.plan = "free"
            await db.commit()
    
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        
        result = await db.execute(
            select(User).where(User.stripe_customer_id == customer_id)
        )
        user = result.scalar_one_or_none()
        
        if user:
            user.plan = "free"
            user.pro_analyses_remaining = 0
            await db.commit()
            
            send_subscription_cancelled_email(user.email)
    
    return {"status": "ok"}

@router.get("/status", response_model=BillingStatusResponse)
async def get_billing_status(
    current_user: User = Depends(get_current_user)
):
    return BillingStatusResponse(
        plan=current_user.plan,
        credit_balance=current_user.credit_balance,
        pro_analyses_remaining=current_user.pro_analyses_remaining,
        stripe_customer_id=current_user.stripe_customer_id
    )

@router.get("/packages")
async def get_credit_packages():
    return settings.CREDIT_PACKAGES
