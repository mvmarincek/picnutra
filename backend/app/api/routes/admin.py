from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime, timedelta
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User, Payment, CreditTransaction, Meal, Referral, EmailLog, EmailSettings
import csv
import io

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

@router.get("/charts")
async def get_chart_data(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    today = datetime.utcnow().date()
    
    revenue_by_day = []
    users_by_day = []
    meals_by_day = []
    
    for i in range(29, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%d/%m")
        
        credits_revenue = await db.scalar(
            select(func.sum(Payment.amount))
            .where(Payment.status == "confirmed")
            .where(Payment.payment_type == "credits")
            .where(func.date(Payment.paid_at) == day)
        ) or 0
        
        subscription_revenue = await db.scalar(
            select(func.sum(Payment.amount))
            .where(Payment.status == "confirmed")
            .where(Payment.payment_type == "subscription")
            .where(func.date(Payment.paid_at) == day)
        ) or 0
        
        revenue_by_day.append({
            "date": day_str,
            "credits": float(credits_revenue),
            "subscriptions": float(subscription_revenue)
        })
        
        organic_users = await db.scalar(
            select(func.count(User.id))
            .where(func.date(User.created_at) == day)
            .where(User.referred_by == None)
        ) or 0
        
        referred_users = await db.scalar(
            select(func.count(User.id))
            .where(func.date(User.created_at) == day)
            .where(User.referred_by != None)
        ) or 0
        
        users_by_day.append({
            "date": day_str, 
            "organic": organic_users,
            "referred": referred_users
        })
        
        meals_count = await db.scalar(
            select(func.count(Meal.id)).where(func.date(Meal.created_at) == day)
        ) or 0
        meals_by_day.append({"date": day_str, "count": meals_count})
    
    total_credits_revenue = await db.scalar(
        select(func.sum(Payment.amount))
        .where(Payment.status == "confirmed")
        .where(Payment.payment_type == "credits")
    ) or 0
    
    total_subscription_revenue = await db.scalar(
        select(func.sum(Payment.amount))
        .where(Payment.status == "confirmed")
        .where(Payment.payment_type == "subscription")
    ) or 0
    
    conversion_rate = 0
    total_users = await db.scalar(select(func.count(User.id)))
    paying_users = await db.scalar(
        select(func.count(func.distinct(Payment.user_id)))
        .where(Payment.status == "confirmed")
    )
    if total_users and total_users > 0:
        conversion_rate = round((paying_users / total_users) * 100, 1)
    
    avg_revenue_per_user = 0
    if paying_users and paying_users > 0:
        total_revenue = await db.scalar(
            select(func.sum(Payment.amount)).where(Payment.status == "confirmed")
        ) or 0
        avg_revenue_per_user = round(total_revenue / paying_users, 2)
    
    active_subscriptions = await db.scalar(
        select(func.count(User.id))
        .where(User.plan == "pro")
        .where(User.asaas_subscription_id != None)
    )
    
    total_referrals = await db.scalar(select(func.count(Referral.id))) or 0
    
    referred_who_paid = await db.scalar(
        select(func.count(func.distinct(Payment.user_id)))
        .where(Payment.status == "confirmed")
        .where(Payment.user_id.in_(
            select(Referral.referred_id)
        ))
    ) or 0
    
    return {
        "revenue_by_day": revenue_by_day,
        "users_by_day": users_by_day,
        "meals_by_day": meals_by_day,
        "kpis": {
            "total_credits_revenue": float(total_credits_revenue),
            "total_subscription_revenue": float(total_subscription_revenue),
            "conversion_rate": conversion_rate,
            "avg_revenue_per_user": avg_revenue_per_user,
            "paying_users": paying_users,
            "active_subscriptions": active_subscriptions,
            "total_referrals": total_referrals,
            "referred_who_paid": referred_who_paid
        }
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

@router.delete("/payments/{payment_id}")
async def delete_payment(
    payment_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento nao encontrado")
    
    await db.delete(payment)
    await db.commit()
    
    return {"success": True, "message": "Pagamento excluido com sucesso"}

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

@router.post("/users/{user_id}/reset-pro-analyses")
async def reset_pro_analyses(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    
    from app.core.config import get_settings
    settings = get_settings()
    
    user.pro_analyses_remaining = settings.PRO_MONTHLY_ANALYSES
    await db.commit()
    
    return {"success": True, "pro_analyses_remaining": user.pro_analyses_remaining}

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

@router.post("/users/{user_id}/remove-pro")
async def remove_user_pro(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    
    user.plan = "free"
    user.pro_started_at = None
    user.pro_expires_at = None
    user.pro_analyses_remaining = 0
    user.asaas_subscription_id = None
    
    transaction = CreditTransaction(
        user_id=user_id,
        credits_added=0,
        transaction_type="admin_pro",
        description="Admin: PRO removido"
    )
    db.add(transaction)
    await db.commit()
    
    return {"success": True, "plan": user.plan}

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Nao e possivel excluir um administrador")
    
    await db.delete(user)
    await db.commit()
    
    return {"success": True, "message": "Usuario excluido com sucesso"}

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

@router.get("/export/users")
async def export_users_csv(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).order_by(desc(User.created_at)))
    users = result.scalars().all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Email', 'Nome', 'Telefone', 'CPF', 'Plano', 'Creditos', 'Analises PRO', 'Email Verificado', 'Admin', 'Indicado Por', 'Codigo Indicacao', 'Criado Em'])
    
    for u in users:
        writer.writerow([
            u.id, u.email, u.name or '', u.phone or '', u.cpf or '', u.plan,
            u.credit_balance, u.pro_analyses_remaining, u.email_verified, u.is_admin,
            u.referred_by or '', u.referral_code or '',
            u.created_at.strftime('%Y-%m-%d %H:%M') if u.created_at else ''
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=usuarios_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

@router.get("/export/payments")
async def export_payments_csv(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Payment, User.email)
        .join(User, Payment.user_id == User.id)
        .order_by(desc(Payment.created_at))
    )
    rows = result.all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Usuario Email', 'Tipo Pagamento', 'Tipo Cobranca', 'Valor', 'Status', 'Descricao', 'Creditos', 'Pago Em', 'Criado Em'])
    
    for payment, email in rows:
        writer.writerow([
            payment.id, email, payment.payment_type, payment.billing_type or '',
            payment.amount, payment.status, payment.description or '', payment.credits_purchased or '',
            payment.paid_at.strftime('%Y-%m-%d %H:%M') if payment.paid_at else '',
            payment.created_at.strftime('%Y-%m-%d %H:%M') if payment.created_at else ''
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=pagamentos_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

@router.get("/export/kpis")
async def export_kpis_csv(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    today = datetime.utcnow().date()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Data', 'Receita Creditos', 'Receita Assinaturas', 'Usuarios Organicos', 'Usuarios Indicados', 'Analises'])
    
    for i in range(89, -1, -1):
        day = today - timedelta(days=i)
        
        credits_rev = await db.scalar(
            select(func.sum(Payment.amount))
            .where(Payment.status == "confirmed")
            .where(Payment.payment_type == "credits")
            .where(func.date(Payment.paid_at) == day)
        ) or 0
        
        subs_rev = await db.scalar(
            select(func.sum(Payment.amount))
            .where(Payment.status == "confirmed")
            .where(Payment.payment_type == "subscription")
            .where(func.date(Payment.paid_at) == day)
        ) or 0
        
        organic = await db.scalar(
            select(func.count(User.id))
            .where(func.date(User.created_at) == day)
            .where(User.referred_by == None)
        ) or 0
        
        referred = await db.scalar(
            select(func.count(User.id))
            .where(func.date(User.created_at) == day)
            .where(User.referred_by != None)
        ) or 0
        
        meals = await db.scalar(
            select(func.count(Meal.id)).where(func.date(Meal.created_at) == day)
        ) or 0
        
        writer.writerow([day.strftime('%Y-%m-%d'), credits_rev, subs_rev, organic, referred, meals])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=kpis_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

@router.get("/users/{user_id}/referrals-converted")
async def get_user_referrals_converted(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    total_referred = await db.scalar(
        select(func.count(Referral.id)).where(Referral.referrer_id == user_id)
    ) or 0
    
    referred_who_paid = await db.scalar(
        select(func.count(func.distinct(Payment.user_id)))
        .where(Payment.status == "confirmed")
        .where(Payment.user_id.in_(
            select(Referral.referred_id).where(Referral.referrer_id == user_id)
        ))
    ) or 0
    
    return {
        "total_referred": total_referred,
        "converted": referred_who_paid,
        "conversion_rate": round((referred_who_paid / total_referred * 100), 1) if total_referred > 0 else 0
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

@router.get("/export/users")
async def export_users_csv(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).order_by(desc(User.created_at)))
    users = result.scalars().all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Email', 'Nome', 'Telefone', 'CPF', 'Plano', 'Creditos', 'Analises PRO', 'Email Verificado', 'Admin', 'Indicado Por', 'Codigo Indicacao', 'Criado Em'])
    
    for u in users:
        writer.writerow([
            u.id, u.email, u.name or '', u.phone or '', u.cpf or '', u.plan,
            u.credit_balance, u.pro_analyses_remaining, u.email_verified, u.is_admin,
            u.referred_by or '', u.referral_code or '',
            u.created_at.strftime('%Y-%m-%d %H:%M') if u.created_at else ''
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=usuarios_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

@router.get("/export/payments")
async def export_payments_csv(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Payment, User.email)
        .join(User, Payment.user_id == User.id)
        .order_by(desc(Payment.created_at))
    )
    rows = result.all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Usuario Email', 'Tipo Pagamento', 'Tipo Cobranca', 'Valor', 'Status', 'Descricao', 'Creditos', 'Pago Em', 'Criado Em'])
    
    for payment, email in rows:
        writer.writerow([
            payment.id, email, payment.payment_type, payment.billing_type or '',
            payment.amount, payment.status, payment.description or '', payment.credits_purchased or '',
            payment.paid_at.strftime('%Y-%m-%d %H:%M') if payment.paid_at else '',
            payment.created_at.strftime('%Y-%m-%d %H:%M') if payment.created_at else ''
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=pagamentos_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

@router.get("/export/kpis")
async def export_kpis_csv(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    today = datetime.utcnow().date()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Data', 'Receita Creditos', 'Receita Assinaturas', 'Usuarios Organicos', 'Usuarios Indicados', 'Analises'])
    
    for i in range(89, -1, -1):
        day = today - timedelta(days=i)
        
        credits_rev = await db.scalar(
            select(func.sum(Payment.amount))
            .where(Payment.status == "confirmed")
            .where(Payment.payment_type == "credits")
            .where(func.date(Payment.paid_at) == day)
        ) or 0
        
        subs_rev = await db.scalar(
            select(func.sum(Payment.amount))
            .where(Payment.status == "confirmed")
            .where(Payment.payment_type == "subscription")
            .where(func.date(Payment.paid_at) == day)
        ) or 0
        
        organic = await db.scalar(
            select(func.count(User.id))
            .where(func.date(User.created_at) == day)
            .where(User.referred_by == None)
        ) or 0
        
        referred = await db.scalar(
            select(func.count(User.id))
            .where(func.date(User.created_at) == day)
            .where(User.referred_by != None)
        ) or 0
        
        meals = await db.scalar(
            select(func.count(Meal.id)).where(func.date(Meal.created_at) == day)
        ) or 0
        
        writer.writerow([day.strftime('%Y-%m-%d'), credits_rev, subs_rev, organic, referred, meals])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=kpis_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

@router.get("/users/{user_id}/referrals-converted")
async def get_user_referrals_converted(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    total_referred = await db.scalar(
        select(func.count(Referral.id)).where(Referral.referrer_id == user_id)
    ) or 0
    
    referred_who_paid = await db.scalar(
        select(func.count(func.distinct(Payment.user_id)))
        .where(Payment.status == "confirmed")
        .where(Payment.user_id.in_(
            select(Referral.referred_id).where(Referral.referrer_id == user_id)
        ))
    ) or 0
    
    return {
        "total_referred": total_referred,
        "converted": referred_who_paid,
        "conversion_rate": round((referred_who_paid / total_referred * 100), 1) if total_referred > 0 else 0
    }
