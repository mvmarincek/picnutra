from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime, timedelta
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Payment, CreditTransaction, Meal, Referral, EmailLog, EmailSettings

router = APIRouter(prefix="/admin", tags=["admin"])

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado")
    return current_user

@router.get("/stats")
async def get_dashboard_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    today = datetime.utcnow().date()
    month_start = today.replace(day=1)
    
    total_users = await db.scalar(select(func.count(User.id)))
    pro_users = await db.scalar(select(func.count(User.id)).where(User.plan == "pro"))
    verified_users = await db.scalar(select(func.count(User.id)).where(User.email_verified == True))
    
    new_users_today = await db.scalar(
        select(func.count(User.id)).where(func.date(User.created_at) == today)
    )
    new_users_month = await db.scalar(
        select(func.count(User.id)).where(func.date(User.created_at) >= month_start)
    )
    
    total_revenue = await db.scalar(
        select(func.sum(Payment.amount)).where(Payment.status == "confirmed")
    ) or 0
    
    revenue_month = await db.scalar(
        select(func.sum(Payment.amount))
        .where(Payment.status == "confirmed")
        .where(func.date(Payment.paid_at) >= month_start)
    ) or 0
    
    total_meals = await db.scalar(select(func.count(Meal.id)))
    meals_today = await db.scalar(
        select(func.count(Meal.id)).where(func.date(Meal.created_at) == today)
    )
    
    pending_payments = await db.scalar(
        select(func.count(Payment.id)).where(Payment.status == "pending")
    )
    
    return {
        "users": {
            "total": total_users,
            "pro": pro_users,
            "verified": verified_users,
            "new_today": new_users_today,
            "new_month": new_users_month
        },
        "revenue": {
            "total": total_revenue,
            "month": revenue_month
        },
        "meals": {
            "total": total_meals,
            "today": meals_today
        },
        "pending_payments": pending_payments
    }

@router.get("/users")
async def list_users(
    search: Optional[str] = None,
    plan: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(User).order_by(desc(User.created_at))
    
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (User.email.ilike(search_filter)) |
            (User.name.ilike(search_filter)) |
            (User.cpf.ilike(search_filter))
        )
    
    if plan:
        query = query.where(User.plan == plan)
    
    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    users = result.scalars().all()
    
    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "cpf": u.cpf,
                "phone": u.phone,
                "plan": u.plan,
                "credit_balance": u.credit_balance,
                "pro_analyses_remaining": u.pro_analyses_remaining,
                "email_verified": u.email_verified,
                "is_admin": u.is_admin,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "pro_started_at": u.pro_started_at.isoformat() if u.pro_started_at else None,
                "pro_expires_at": u.pro_expires_at.isoformat() if u.pro_expires_at else None
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if total else 1
    }

@router.get("/users/{user_id}")
async def get_user_details(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    
    payments_result = await db.execute(
        select(Payment)
        .where(Payment.user_id == user_id)
        .order_by(desc(Payment.created_at))
        .limit(50)
    )
    payments = payments_result.scalars().all()
    
    transactions_result = await db.execute(
        select(CreditTransaction)
        .where(CreditTransaction.user_id == user_id)
        .order_by(desc(CreditTransaction.created_at))
        .limit(50)
    )
    transactions = transactions_result.scalars().all()
    
    meals_result = await db.execute(
        select(Meal)
        .where(Meal.user_id == user_id)
        .order_by(desc(Meal.created_at))
        .limit(20)
    )
    meals = meals_result.scalars().all()
    
    referrals_result = await db.execute(
        select(Referral).where(Referral.referrer_id == user_id)
    )
    referrals = referrals_result.scalars().all()
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "cpf": user.cpf,
            "phone": user.phone,
            "plan": user.plan,
            "credit_balance": user.credit_balance,
            "pro_analyses_remaining": user.pro_analyses_remaining,
            "asaas_customer_id": user.asaas_customer_id,
            "asaas_subscription_id": user.asaas_subscription_id,
            "referral_code": user.referral_code,
            "email_verified": user.email_verified,
            "is_admin": user.is_admin,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "pro_started_at": user.pro_started_at.isoformat() if user.pro_started_at else None,
            "pro_expires_at": user.pro_expires_at.isoformat() if user.pro_expires_at else None
        },
        "payments": [
            {
                "id": p.id,
                "asaas_payment_id": p.asaas_payment_id,
                "payment_type": p.payment_type,
                "billing_type": p.billing_type,
                "amount": p.amount,
                "status": p.status,
                "description": p.description,
                "credits_purchased": p.credits_purchased,
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in payments
        ],
        "transactions": [
            {
                "id": t.id,
                "credits_added": t.credits_added,
                "credits_used": t.credits_used,
                "balance_after": t.balance_after,
                "transaction_type": t.transaction_type,
                "description": t.description,
                "created_at": t.created_at.isoformat() if t.created_at else None
            }
            for t in transactions
        ],
        "meals_count": len(meals),
        "referrals_count": len(referrals)
    }

@router.get("/payments")
async def list_payments(
    status: Optional[str] = None,
    payment_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Payment, User.email).join(User).order_by(desc(Payment.created_at))
    
    if status:
        query = query.where(Payment.status == status)
    if payment_type:
        query = query.where(Payment.payment_type == payment_type)
    
    total = await db.scalar(
        select(func.count(Payment.id))
        .where(Payment.status == status if status else True)
        .where(Payment.payment_type == payment_type if payment_type else True)
    )
    
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    rows = result.all()
    
    return {
        "payments": [
            {
                "id": p.id,
                "user_id": p.user_id,
                "user_email": email,
                "asaas_payment_id": p.asaas_payment_id,
                "payment_type": p.payment_type,
                "billing_type": p.billing_type,
                "amount": p.amount,
                "status": p.status,
                "description": p.description,
                "credits_purchased": p.credits_purchased,
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p, email in rows
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if total else 1
    }

@router.post("/users/{user_id}/add-credits")
async def add_credits_to_user(
    user_id: int,
    credits: int = Query(..., ge=1),
    reason: str = Query(...),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    
    user.credit_balance += credits
    
    transaction = CreditTransaction(
        user_id=user_id,
        credits_added=credits,
        balance_after=user.credit_balance,
        transaction_type="admin_credit",
        description=f"Admin: {reason}"
    )
    db.add(transaction)
    await db.commit()
    
    return {"success": True, "new_balance": user.credit_balance}

@router.post("/users/{user_id}/toggle-admin")
async def toggle_admin(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="Voce nao pode remover seu proprio admin")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    
    user.is_admin = not user.is_admin
    await db.commit()
    
    return {"success": True, "is_admin": user.is_admin}

@router.post("/users/{user_id}/set-pro")
async def set_user_pro(
    user_id: int,
    months: int = Query(1, ge=1, le=12),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    
    from app.core.config import get_settings
    settings = get_settings()
    
    now = datetime.utcnow()
    user.plan = "pro"
    user.pro_started_at = now
    user.pro_expires_at = now + timedelta(days=30 * months)
    user.pro_analyses_remaining = settings.PRO_MONTHLY_ANALYSES * months
    
    transaction = CreditTransaction(
        user_id=user_id,
        credits_added=0,
        transaction_type="admin_pro",
        description=f"Admin: PRO ativado por {months} mes(es)"
    )
    db.add(transaction)
    await db.commit()
    
    return {
        "success": True,
        "plan": user.plan,
        "pro_expires_at": user.pro_expires_at.isoformat()
    }

@router.get("/email-logs")
async def list_email_logs(
    email_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(EmailLog).order_by(desc(EmailLog.created_at))
    
    if email_type:
        query = query.where(EmailLog.email_type == email_type)
    if status:
        query = query.where(EmailLog.status == status)
    if search:
        query = query.where(EmailLog.to_email.ilike(f"%{search}%"))
    
    count_query = select(func.count(EmailLog.id))
    if email_type:
        count_query = count_query.where(EmailLog.email_type == email_type)
    if status:
        count_query = count_query.where(EmailLog.status == status)
    if search:
        count_query = count_query.where(EmailLog.to_email.ilike(f"%{search}%"))
    
    total = await db.scalar(count_query)
    
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    logs = result.scalars().all()
    
    return {
        "email_logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "to_email": log.to_email,
                "subject": log.subject,
                "email_type": log.email_type,
                "status": log.status,
                "error_message": log.error_message,
                "resend_id": log.resend_id,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ],
        "total": total or 0,
        "page": page,
        "pages": ((total or 0) + limit - 1) // limit if total else 1
    }

@router.get("/email-stats")
async def get_email_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    total_sent = await db.scalar(
        select(func.count(EmailLog.id)).where(EmailLog.status == "sent")
    ) or 0
    
    total_failed = await db.scalar(
        select(func.count(EmailLog.id)).where(EmailLog.status == "failed")
    ) or 0
    
    by_type_result = await db.execute(
        select(EmailLog.email_type, func.count(EmailLog.id))
        .group_by(EmailLog.email_type)
    )
    by_type = {row[0]: row[1] for row in by_type_result.all()}
    
    return {
        "total_sent": total_sent,
        "total_failed": total_failed,
        "by_type": by_type
    }

@router.get("/email-settings")
async def get_email_settings(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(EmailSettings).order_by(EmailSettings.key))
    settings = result.scalars().all()
    
    return {
        "settings": [
            {
                "id": s.id,
                "key": s.key,
                "value": s.value,
                "description": s.description,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None
            }
            for s in settings
        ]
    }

@router.put("/email-settings/{key}")
async def update_email_setting(
    key: str,
    value: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(EmailSettings).where(EmailSettings.key == key))
    setting = result.scalar_one_or_none()
    
    if not setting:
        setting = EmailSettings(key=key, value=value)
        db.add(setting)
    else:
        setting.value = value
        setting.updated_at = datetime.utcnow()
    
    await db.commit()
    
    from app.services.email_service import _settings_cache
    _settings_cache[key] = value
    
    return {"success": True, "key": key, "value": value}

@router.post("/email-settings/reload")
async def reload_email_settings(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    from app.services.email_service import load_email_settings
    await load_email_settings(db)
    return {"success": True, "message": "Configuracoes de email recarregadas"}

@router.get("/users/{user_id}/email-logs")
async def get_user_email_logs(
    user_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(EmailLog).where(EmailLog.user_id == user_id).order_by(desc(EmailLog.created_at))
    
    total = await db.scalar(
        select(func.count(EmailLog.id)).where(EmailLog.user_id == user_id)
    )
    
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    logs = result.scalars().all()
    
    return {
        "email_logs": [
            {
                "id": log.id,
                "to_email": log.to_email,
                "subject": log.subject,
                "email_type": log.email_type,
                "status": log.status,
                "error_message": log.error_message,
                "resend_id": log.resend_id,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ],
        "total": total or 0,
        "page": page,
        "pages": ((total or 0) + limit - 1) // limit if total else 1
    }
