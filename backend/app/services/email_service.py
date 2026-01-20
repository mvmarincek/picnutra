import resend
import os
from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

resend.api_key = os.getenv("RESEND_API_KEY", "")

_pending_emails = []
_settings_cache: Dict[str, str] = {}
_settings_loaded = False

DEFAULT_SETTINGS = {
    "admin_email": "mvmarincek@gmail.com",
    "support_email": "suporte@ai8hub.com",
    "app_url": "https://picnutra.vercel.app",
    "frontend_url": "https://picnutra.vercel.app",
    "from_name": "PicNutra",
    "from_email": "picnutra-noreply@ai8hub.com",
    "welcome_credits": "36",
    "referral_credits": "12"
}

def get_setting(key: str) -> str:
    if key in _settings_cache:
        return _settings_cache[key]
    return DEFAULT_SETTINGS.get(key, "")

async def load_email_settings(db: AsyncSession):
    global _settings_cache, _settings_loaded
    try:
        from app.models.models import EmailSettings
        result = await db.execute(select(EmailSettings))
        settings = result.scalars().all()
        for s in settings:
            _settings_cache[s.key] = s.value
        _settings_loaded = True
    except Exception as e:
        print(f"[EMAIL] Could not load settings from DB: {e}")

def get_email_logo():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <defs><linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#10b981"/><stop offset="50%" style="stop-color:#14b8a6"/><stop offset="100%" style="stop-color:#06b6d4"/>
        </linearGradient></defs>
        <rect width="48" height="48" rx="10" fill="url(#bgGrad)"/>
        <ellipse cx="24" cy="29" rx="13" ry="8" fill="white"/>
        <path d="M11 29 Q11 21 24 21 Q37 21 37 29" fill="white"/>
        <ellipse cx="24" cy="21" rx="13" ry="3" fill="rgba(255,255,255,0.3)"/>
        <path d="M17 18 Q18.5 13 20 18" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M23 16 Q24.5 10 26 16" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M28 18 Q29.5 13 31 18" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>'''

def get_email_header(title: str, subtitle: str = "", gradient: str = "linear-gradient(135deg, #10b981, #14b8a6, #06b6d4)"):
    logo = get_email_logo()
    subtitle_html = f'<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">{subtitle}</p>' if subtitle else ''
    return f'''
        <div style="background: {gradient}; padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 20px;">
            <div style="margin-bottom: 15px;">{logo}</div>
            <h1 style="color: white; margin: 0; font-size: 28px;">{title}</h1>
            {subtitle_html}
        </div>
    '''

def get_email_footer():
    support_email = get_setting("support_email")
    app_url = get_setting("app_url")
    return f"""
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0 0 10px 0;">
                Cuide da sua saude, uma refeicao de cada vez.<br>
                Equipe Nutri-Vision
            </p>
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
                Duvidas? Entre em contato: <a href="mailto:{support_email}" style="color: #10b981;">{support_email}</a><br>
                <a href="{app_url}/privacy" style="color: #94a3b8;">Politica de Privacidade</a> | 
                <a href="{app_url}/terms" style="color: #94a3b8;">Termos de Uso</a>
            </p>
        </div>
    """

def send_email(to: str, subject: str, html_content: str, email_type: str = "generic", user_id: Optional[int] = None):
    from_name = get_setting("from_name")
    from_email = get_setting("from_email")
    
    log_entry = {
        "to_email": to,
        "subject": subject,
        "email_type": email_type,
        "user_id": user_id,
        "status": "pending",
        "error_message": None,
        "resend_id": None
    }
    
    if not resend.api_key:
        print(f"[EMAIL] RESEND_API_KEY not configured!")
        print(f"[EMAIL] Would send to: {to}")
        print(f"[EMAIL] Subject: {subject}")
        log_entry["status"] = "failed"
        log_entry["error_message"] = "RESEND_API_KEY not configured"
        _save_email_log_sync(log_entry)
        return False
    
    try:
        result = resend.Emails.send({
            "from": f"{from_name} <{from_email}>",
            "to": to,
            "subject": subject,
            "html": html_content
        })
        print(f"[EMAIL] Sent successfully to {to}: {result}")
        log_entry["status"] = "sent"
        log_entry["resend_id"] = result.get("id") if isinstance(result, dict) else str(result)
        _save_email_log_sync(log_entry)
        return True
    except Exception as e:
        print(f"[EMAIL] Error sending to {to}: {e}")
        log_entry["status"] = "failed"
        log_entry["error_message"] = str(e)
        _save_email_log_sync(log_entry)
        return False

def _save_email_log_sync(log_entry: dict):
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(_save_email_log_async(log_entry))
        else:
            loop.run_until_complete(_save_email_log_async(log_entry))
    except RuntimeError:
        asyncio.run(_save_email_log_async(log_entry))

async def _save_email_log_async(log_entry: dict):
    from app.models.models import EmailLog, ErrorLog
    from app.db.database import async_session
    
    try:
        async with async_session() as db:
            email_log = EmailLog(
                user_id=log_entry.get("user_id"),
                to_email=log_entry["to_email"],
                subject=log_entry["subject"],
                email_type=log_entry["email_type"],
                status=log_entry["status"],
                error_message=log_entry.get("error_message"),
                resend_id=log_entry.get("resend_id")
            )
            db.add(email_log)
            
            if log_entry["status"] == "failed":
                error_log = ErrorLog(
                    user_id=log_entry.get("user_id"),
                    error_type="email",
                    error_message=f"Falha ao enviar email: {log_entry.get('error_message', 'Unknown error')}",
                    extra_data={
                        "to_email": log_entry["to_email"],
                        "email_type": log_entry["email_type"],
                        "subject": log_entry["subject"]
                    }
                )
                db.add(error_log)
            
            await db.commit()
    except Exception as e:
        print(f"[EMAIL] Failed to save email log: {e}")
        _pending_emails.append(log_entry)

async def flush_email_logs(db: AsyncSession):
    from app.models.models import EmailLog
    global _pending_emails
    
    if not _pending_emails:
        return
    
    for entry in _pending_emails:
        email_log = EmailLog(
            user_id=entry.get("user_id"),
            to_email=entry["to_email"],
            subject=entry["subject"],
            email_type=entry["email_type"],
            status=entry["status"],
            error_message=entry.get("error_message"),
            resend_id=entry.get("resend_id")
        )
        db.add(email_log)
    
    try:
        await db.commit()
        _pending_emails = []
    except Exception as e:
        print(f"[EMAIL] Error saving logs: {e}")
        await db.rollback()

def send_welcome_email(user_email: str, user_id: Optional[int] = None):
    frontend_url = get_setting("frontend_url")
    welcome_credits = get_setting("welcome_credits")
    subject = f"Bem-vindo ao Nutri-Vision! Voce ganhou {welcome_credits} creditos!"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0fdfa;">
        {get_email_header("Nutri-Vision", "Sua jornada para uma alimentacao saudavel comeca agora!")}
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🎁</span>
            </div>
            <h2 style="color: #10b981; margin: 0 0 20px 0; text-align: center;">Voce ganhou {welcome_credits} creditos de bonus!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0;">
                Parabens por dar o primeiro passo em direcao a uma alimentacao mais consciente!
            </p>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 20px 0;">
                Com seus <strong style="color: #10b981;">{welcome_credits} creditos de bonus</strong>, voce pode fazer <strong>{int(welcome_credits) // 12} analises completas</strong> com:
            </p>
            <ul style="color: #334155; line-height: 2; padding-left: 20px; margin: 0 0 20px 0;">
                <li>Analise detalhada de calorias, proteinas, carboidratos e gorduras</li>
                <li>Sugestoes de melhorias para suas refeicoes</li>
                <li>Visualizacao de versoes otimizadas dos seus pratos</li>
            </ul>
            <div style="background: linear-gradient(135deg, #ecfdf5, #f0fdfa); border-radius: 15px; padding: 15px; margin-bottom: 15px;">
                <p style="color: #047857; margin: 0; text-align: center;">
                    <strong>Analises simples sao sempre gratuitas e ilimitadas!</strong>
                </p>
            </div>
            <p style="color: #64748b; line-height: 1.8; margin: 0; font-size: 14px;">
                Quando seus creditos acabarem, voce pode continuar usando analises simples gratuitamente ou assinar o plano PRO para acesso ilimitado a todas as funcionalidades.
            </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="{frontend_url}/home" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6, #06b6d4); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Usar meus creditos
            </a>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="welcome", user_id=user_id)

def send_password_reset_email(user_email: str, reset_token: str, user_id: Optional[int] = None):
    frontend_url = get_setting("frontend_url")
    reset_url = f"{frontend_url}/reset-password?token={reset_token}"
    subject = "Recuperacao de Senha - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0fdfa;">
        {get_email_header("Nutri-Vision", "Recuperacao de Senha")}
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <p style="color: #334155; line-height: 1.8; margin: 0 0 20px 0;">
                Recebemos uma solicitacao para redefinir a senha da sua conta. Clique no botao abaixo para criar uma nova senha:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6, #06b6d4); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                    Redefinir Senha
                </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
                Se voce nao solicitou a recuperacao de senha, ignore este email. O link expira em 1 hora.
            </p>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="password_reset", user_id=user_id)

def send_suggestion_email(user_email: str, user_id: int, mensagem: str):
    admin_email = get_setting("admin_email")
    subject = "Nova Sugestao - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0fdfa;">
        {get_email_header("Nutri-Vision", "Nova Sugestao de Usuario")}
        
        <div style="background: #f0fdfa; border-radius: 15px; padding: 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Usuario:</strong> {user_email}</p>
            <p style="margin: 0;"><strong>ID:</strong> {user_id}</p>
        </div>
        
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 15px; padding: 20px;">
            <h3 style="color: #f59e0b; margin: 0 0 15px 0;">Sugestao:</h3>
            <p style="color: #334155; line-height: 1.6; margin: 0; white-space: pre-wrap;">{mensagem}</p>
        </div>
    </body>
    </html>
    """
    return send_email(admin_email, subject, html, email_type="suggestion", user_id=user_id)

def send_referral_activated_email(referrer_email: str, referred_email: str, credits_earned: int, new_balance: int, referrer_id: Optional[int] = None):
    frontend_url = get_setting("frontend_url")
    subject = "Voce ganhou creditos! - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0fdfa;">
        {get_email_header("Nutri-Vision", "Parabens! Sua indicacao deu certo!")}
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🎉</span>
            </div>
            <h2 style="color: #10b981; margin: 0 0 20px 0; text-align: center;">+{credits_earned} creditos!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0; text-align: center;">
                Seu amigo <strong>{referred_email}</strong> se cadastrou usando seu link de indicacao!
            </p>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0; text-align: center;">
                Seu novo saldo: <strong style="color: #10b981;">{new_balance} creditos</strong>
            </p>
            <div style="background: linear-gradient(135deg, #ecfdf5, #f0fdfa); border-radius: 15px; padding: 15px;">
                <p style="color: #047857; margin: 0; text-align: center; font-size: 14px;">
                    Com {new_balance} creditos voce pode fazer <strong>{new_balance // 12} analise(s) completa(s)</strong>!
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="{frontend_url}/home" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6, #06b6d4); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Usar meus creditos
            </a>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(referrer_email, subject, html, email_type="referral", user_id=referrer_id)

def send_upgraded_to_pro_email(user_email: str, user_id: Optional[int] = None):
    frontend_url = get_setting("frontend_url")
    subject = "Bem-vindo ao Nutri-Vision PRO!"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #faf5ff;">
        {get_email_header("Nutri-Vision PRO", "Sua assinatura foi ativada com sucesso!", "linear-gradient(135deg, #8b5cf6, #a855f7, #d946ef)")}
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">👑</span>
            </div>
            <h2 style="color: #8b5cf6; margin: 0 0 20px 0; text-align: center;">Parabens! Voce agora e PRO!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 20px 0;">
                Como assinante PRO, voce tem:
            </p>
            <ul style="color: #334155; line-height: 2; padding-left: 20px; margin: 0 0 20px 0;">
                <li><strong>90 analises PRO por mes</strong></li>
                <li><strong>Analises simples ilimitadas</strong></li>
                <li><strong>Sem anuncios</strong></li>
                <li>Sugestoes visuais de melhorias</li>
                <li>Acesso a todos os recursos premium</li>
            </ul>
            <div style="background: #faf5ff; border-radius: 15px; padding: 15px;">
                <p style="color: #7c3aed; margin: 0; text-align: center; font-size: 14px;">
                    Sua assinatura sera renovada automaticamente todo mes e suas analises PRO serao resetadas.
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="{frontend_url}/home" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7, #d946ef); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Comecar a usar
            </a>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="pro_upgrade", user_id=user_id)

def send_credits_purchased_email(user_email: str, credits_purchased: int, new_balance: int, user_id: Optional[int] = None):
    frontend_url = get_setting("frontend_url")
    subject = f"Compra confirmada: +{credits_purchased} creditos - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0fdfa;">
        {get_email_header("Nutri-Vision", "Compra confirmada!")}
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">✅</span>
            </div>
            <h2 style="color: #10b981; margin: 0 0 20px 0; text-align: center;">+{credits_purchased} creditos adicionados!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0; text-align: center;">
                Sua compra foi processada com sucesso.
            </p>
            <div style="background: linear-gradient(135deg, #ecfdf5, #f0fdfa); border-radius: 15px; padding: 20px; text-align: center;">
                <p style="color: #047857; margin: 0 0 10px 0; font-size: 14px;">Seu novo saldo:</p>
                <p style="color: #10b981; margin: 0; font-size: 32px; font-weight: bold;">{new_balance} creditos</p>
                <p style="color: #047857; margin: 10px 0 0 0; font-size: 14px;">
                    ({new_balance // 12} analise(s) completa(s) disponiveis)
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="{frontend_url}/home" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6, #06b6d4); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Usar meus creditos
            </a>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="credits_purchase", user_id=user_id)

def send_subscription_cancelled_email(user_email: str, user_id: Optional[int] = None):
    frontend_url = get_setting("frontend_url")
    subject = "Assinatura PRO cancelada - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f1f5f9;">
        {get_email_header("Nutri-Vision", "Assinatura cancelada", "linear-gradient(135deg, #64748b, #475569)")}
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0;">
                Sua assinatura PRO foi cancelada. Voce voltou para o plano FREE.
            </p>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 20px 0;">
                Voce ainda pode usar:
            </p>
            <ul style="color: #334155; line-height: 2; padding-left: 20px; margin: 0 0 20px 0;">
                <li>Analises simples gratuitas e ilimitadas</li>
                <li>Seus creditos restantes para analises completas</li>
            </ul>
            <p style="color: #64748b; font-size: 14px; margin: 0;">
                Sentiremos sua falta! Voce pode voltar ao PRO a qualquer momento.
            </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="{frontend_url}/billing" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7, #d946ef); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Voltar ao PRO
            </a>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="subscription_cancelled", user_id=user_id)

def send_email_verification(user_email: str, verification_token: str, user_id: Optional[int] = None):
    frontend_url = get_setting("frontend_url")
    verify_url = f"{frontend_url}/verify-email?token={verification_token}"
    subject = "Confirme seu email - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0fdfa;">
        {get_email_header("Nutri-Vision", "Confirme seu email para ativar sua conta")}
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">📧</span>
            </div>
            <h2 style="color: #10b981; margin: 0 0 20px 0; text-align: center;">Quase la!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 20px 0; text-align: center;">
                Clique no botao abaixo para confirmar seu email e ativar sua conta no Nutri-Vision.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verify_url}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6, #06b6d4); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                    Confirmar Email
                </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                Se voce nao criou uma conta no Nutri-Vision, ignore este email.
            </p>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="email_verification", user_id=user_id)

def send_email_verified_success(user_email: str, user_id: Optional[int] = None):
    frontend_url = get_setting("frontend_url")
    welcome_credits = get_setting("welcome_credits")
    subject = "Email confirmado! Bem-vindo ao Nutri-Vision!"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0fdfa;">
        {get_email_header("Nutri-Vision", "Sua conta foi ativada com sucesso!")}
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🎉</span>
            </div>
            <h2 style="color: #10b981; margin: 0 0 20px 0; text-align: center;">Conta ativada!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0; text-align: center;">
                Seu email foi confirmado e sua conta esta pronta para uso.
            </p>
            <div style="background: linear-gradient(135deg, #ecfdf5, #f0fdfa); border-radius: 15px; padding: 15px; margin-bottom: 15px;">
                <p style="color: #047857; margin: 0; text-align: center;">
                    <strong>Voce tem {welcome_credits} creditos de bonus para comecar!</strong>
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="{frontend_url}/home" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6, #06b6d4); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Comecar a usar
            </a>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="email_verified", user_id=user_id)

def send_subscription_renewed_email(user_email: str, analyses_remaining: int = 90, user_id: Optional[int] = None):
    frontend_url = get_setting("frontend_url")
    subject = "Assinatura PRO renovada - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #faf5ff;">
        {get_email_header("Nutri-Vision PRO", "Assinatura renovada!", "linear-gradient(135deg, #8b5cf6, #a855f7, #d946ef)")}
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">👑</span>
            </div>
            <h2 style="color: #8b5cf6; margin: 0 0 20px 0; text-align: center;">Renovacao confirmada!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0; text-align: center;">
                Sua assinatura PRO foi renovada automaticamente.
            </p>
            <div style="background: linear-gradient(135deg, #faf5ff, #f5f3ff); border-radius: 15px; padding: 20px; text-align: center; margin-bottom: 15px;">
                <p style="color: #7c3aed; margin: 0 0 10px 0; font-size: 14px;">Suas analises PRO foram resetadas:</p>
                <p style="color: #8b5cf6; margin: 0; font-size: 32px; font-weight: bold;">{analyses_remaining} analises</p>
                <p style="color: #7c3aed; margin: 10px 0 0 0; font-size: 14px;">disponiveis este mes</p>
            </div>
            <p style="color: #334155; line-height: 1.8; margin: 0; text-align: center;">
                Continue aproveitando todos os beneficios PRO!
            </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="{frontend_url}/home" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7, #d946ef); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Continuar usando
            </a>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="subscription_renewed", user_id=user_id)

def send_payment_failed_email(user_email: str, user_id: Optional[int] = None):
    frontend_url = get_setting("frontend_url")
    support_email = get_setting("support_email")
    subject = "Problema com seu pagamento - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef2f2;">
        {get_email_header("Nutri-Vision", "Acao necessaria", "linear-gradient(135deg, #ef4444, #f97316)")}
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">⚠️</span>
            </div>
            <h2 style="color: #ef4444; margin: 0 0 20px 0; text-align: center;">Falha no pagamento</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0; text-align: center;">
                Nao conseguimos processar o pagamento da sua assinatura PRO.
            </p>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 20px 0; text-align: center;">
                Por favor, atualize seus dados de pagamento para continuar usando o plano PRO.
            </p>
            <div style="background: #fef2f2; border-radius: 15px; padding: 15px;">
                <p style="color: #991b1b; margin: 0; text-align: center; font-size: 14px;">
                    Se o pagamento nao for atualizado, sua assinatura sera cancelada automaticamente.
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="{frontend_url}/billing" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6, #06b6d4); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Atualizar pagamento
            </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            Precisa de ajuda? Entre em contato: <a href="mailto:{support_email}" style="color: #10b981;">{support_email}</a><br>
            Equipe Nutri-Vision
        </p>
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="payment_failed", user_id=user_id)
