import resend
import os
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

ADMIN_EMAIL = "mvmarincek@gmail.com"
SUPPORT_EMAIL = "suporte@ai8hub.com"
APP_URL = "https://nutrivision.ai8hub.com"
resend.api_key = os.getenv("RESEND_API_KEY", "")

_pending_emails = []

def get_email_footer():
    return f"""
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0 0 10px 0;">
                Cuide da sua saude, uma refeicao de cada vez.<br>
                Equipe Nutri-Vision
            </p>
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
                Duvidas? Entre em contato: <a href="mailto:{SUPPORT_EMAIL}" style="color: #22c55e;">{SUPPORT_EMAIL}</a><br>
                <a href="{APP_URL}/privacy" style="color: #94a3b8;">Politica de Privacidade</a> | 
                <a href="{APP_URL}/terms" style="color: #94a3b8;">Termos de Uso</a>
            </p>
        </div>
    """

def send_email(to: str, subject: str, html_content: str, email_type: str = "generic", user_id: Optional[int] = None):
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
        _pending_emails.append(log_entry)
        return False
    
    try:
        result = resend.Emails.send({
            "from": "Nutri-Vision <nutrivision-noreply@ai8hub.com>",
            "to": to,
            "subject": subject,
            "html": html_content
        })
        print(f"[EMAIL] Sent successfully to {to}: {result}")
        log_entry["status"] = "sent"
        log_entry["resend_id"] = result.get("id") if isinstance(result, dict) else str(result)
        _pending_emails.append(log_entry)
        return True
    except Exception as e:
        print(f"[EMAIL] Error sending to {to}: {e}")
        log_entry["status"] = "failed"
        log_entry["error_message"] = str(e)
        _pending_emails.append(log_entry)
        return False

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

def send_welcome_email(user_email: str):
    subject = "Bem-vindo ao Nutri-Vision! Voce ganhou 36 creditos!"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #22c55e, #14b8a6); padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nutri-Vision</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sua jornada para uma alimentacao saudavel comeca agora!</p>
        </div>
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🎁</span>
            </div>
            <h2 style="color: #22c55e; margin: 0 0 20px 0; text-align: center;">Voce ganhou 36 creditos de bonus!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0;">
                Parabens por dar o primeiro passo em direcao a uma alimentacao mais consciente!
            </p>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 20px 0;">
                Com seus <strong style="color: #22c55e;">36 creditos de bonus</strong>, voce pode fazer <strong>3 analises completas</strong> com:
            </p>
            <ul style="color: #334155; line-height: 2; padding-left: 20px; margin: 0 0 20px 0;">
                <li>Analise detalhada de calorias, proteinas, carboidratos e gorduras</li>
                <li>Sugestoes de melhorias para suas refeicoes</li>
                <li>Visualizacao de versoes otimizadas dos seus pratos</li>
            </ul>
            <div style="background: #f0fdf4; border-radius: 15px; padding: 15px; margin-bottom: 15px;">
                <p style="color: #166534; margin: 0; text-align: center;">
                    <strong>Analises simples sao sempre gratuitas e ilimitadas!</strong>
                </p>
            </div>
            <p style="color: #64748b; line-height: 1.8; margin: 0; font-size: 14px;">
                Quando seus creditos acabarem, voce pode continuar usando analises simples gratuitamente ou assinar o plano PRO para acesso ilimitado a todas as funcionalidades.
            </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://nutrivision-drab.vercel.app/home" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #14b8a6); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Usar meus creditos
            </a>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="welcome")

def send_password_reset_email(user_email: str, reset_token: str):
    reset_url = f"https://nutrivision-drab.vercel.app/reset-password?token={reset_token}"
    subject = "Recuperacao de Senha - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #22c55e, #14b8a6); padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nutri-Vision</h1>
        </div>
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #334155; margin: 0 0 20px 0;">Recuperacao de Senha</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 20px 0;">
                Recebemos uma solicitacao para redefinir a senha da sua conta. Clique no botao abaixo para criar uma nova senha:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #14b8a6); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
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
    return send_email(user_email, subject, html, email_type="password_reset")

def send_suggestion_email(user_email: str, user_id: int, mensagem: str):
    subject = "Nova Sugestao - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #22c55e, #14b8a6); padding: 20px; border-radius: 15px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0;">Nutri-Vision</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Nova Sugestao de Usuario</p>
        </div>
        
        <div style="background: #f8fafc; border-radius: 15px; padding: 20px; margin-bottom: 20px;">
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
    return send_email(ADMIN_EMAIL, subject, html, email_type="suggestion", user_id=user_id)

def send_referral_activated_email(referrer_email: str, referred_email: str, credits_earned: int, new_balance: int):
    subject = "Voce ganhou creditos! - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #22c55e, #14b8a6); padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nutri-Vision</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Parabens! Sua indicacao deu certo!</p>
        </div>
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🎉</span>
            </div>
            <h2 style="color: #22c55e; margin: 0 0 20px 0; text-align: center;">+{credits_earned} creditos!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0; text-align: center;">
                Seu amigo <strong>{referred_email}</strong> se cadastrou usando seu link de indicacao!
            </p>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0; text-align: center;">
                Seu novo saldo: <strong style="color: #22c55e;">{new_balance} creditos</strong>
            </p>
            <div style="background: #f0fdf4; border-radius: 15px; padding: 15px;">
                <p style="color: #166534; margin: 0; text-align: center; font-size: 14px;">
                    Com {new_balance} creditos voce pode fazer <strong>{new_balance // 12} analise(s) completa(s)</strong>!
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://nutrivision-drab.vercel.app/home" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #14b8a6); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Usar meus creditos
            </a>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(referrer_email, subject, html, email_type="referral")

def send_upgraded_to_pro_email(user_email: str):
    subject = "Bem-vindo ao Nutri-Vision PRO!"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nutri-Vision PRO</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sua assinatura foi ativada com sucesso!</p>
        </div>
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">👑</span>
            </div>
            <h2 style="color: #8b5cf6; margin: 0 0 20px 0; text-align: center;">Parabens! Voce agora e PRO!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 20px 0;">
                Como assinante PRO, voce tem:
            </p>
            <ul style="color: #334155; line-height: 2; padding-left: 20px; margin: 0 0 20px 0;">
                <li><strong>Analises completas ilimitadas</strong></li>
                <li><strong>Sem anuncios</strong></li>
                <li>Sugestoes visuais de melhorias</li>
                <li>Acesso a todos os recursos premium</li>
            </ul>
            <div style="background: #faf5ff; border-radius: 15px; padding: 15px;">
                <p style="color: #7c3aed; margin: 0; text-align: center; font-size: 14px;">
                    Sua assinatura sera renovada automaticamente todo mes.
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://nutrivision-drab.vercel.app/home" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Comecar a usar
            </a>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="pro_upgrade")

def send_credits_purchased_email(user_email: str, credits_purchased: int, new_balance: int):
    subject = f"Compra confirmada: +{credits_purchased} creditos - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #22c55e, #14b8a6); padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nutri-Vision</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Compra confirmada!</p>
        </div>
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">✅</span>
            </div>
            <h2 style="color: #22c55e; margin: 0 0 20px 0; text-align: center;">+{credits_purchased} creditos adicionados!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0; text-align: center;">
                Sua compra foi processada com sucesso.
            </p>
            <div style="background: #f0fdf4; border-radius: 15px; padding: 20px; text-align: center;">
                <p style="color: #166534; margin: 0 0 10px 0; font-size: 14px;">Seu novo saldo:</p>
                <p style="color: #22c55e; margin: 0; font-size: 32px; font-weight: bold;">{new_balance} creditos</p>
                <p style="color: #166534; margin: 10px 0 0 0; font-size: 14px;">
                    ({new_balance // 12} analise(s) completa(s) disponiveis)
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://nutrivision-drab.vercel.app/home" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #14b8a6); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Usar meus creditos
            </a>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="credits_purchase")

def send_subscription_cancelled_email(user_email: str):
    subject = "Assinatura PRO cancelada - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #64748b, #475569); padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nutri-Vision</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Assinatura cancelada</p>
        </div>
        
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
            <a href="https://nutrivision-drab.vercel.app/billing" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Voltar ao PRO
            </a>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="subscription_cancelled")

def send_email_verification(user_email: str, verification_token: str):
    verify_url = f"https://nutrivision-drab.vercel.app/verify-email?token={verification_token}"
    subject = "Confirme seu email - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #22c55e, #14b8a6); padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nutri-Vision</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Confirme seu email para ativar sua conta</p>
        </div>
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">📧</span>
            </div>
            <h2 style="color: #22c55e; margin: 0 0 20px 0; text-align: center;">Quase la!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 20px 0; text-align: center;">
                Clique no botao abaixo para confirmar seu email e ativar sua conta no Nutri-Vision.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verify_url}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #14b8a6); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
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
    return send_email(user_email, subject, html, email_type="email_verification")

def send_email_verified_success(user_email: str):
    subject = "Email confirmado! Bem-vindo ao Nutri-Vision!"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #22c55e, #14b8a6); padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nutri-Vision</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sua conta foi ativada com sucesso!</p>
        </div>
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">🎉</span>
            </div>
            <h2 style="color: #22c55e; margin: 0 0 20px 0; text-align: center;">Conta ativada!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0; text-align: center;">
                Seu email foi confirmado e sua conta esta pronta para uso.
            </p>
            <div style="background: #f0fdf4; border-radius: 15px; padding: 15px; margin-bottom: 15px;">
                <p style="color: #166534; margin: 0; text-align: center;">
                    <strong>Voce tem 36 creditos de bonus para comecar!</strong>
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://nutrivision-drab.vercel.app/home" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #14b8a6); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Comecar a usar
            </a>
        </div>
        
        {get_email_footer()}
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="email_verified")

def send_subscription_renewed_email(user_email: str):
    subject = "Assinatura PRO renovada - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nutri-Vision PRO</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Assinatura renovada!</p>
        </div>
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="font-size: 48px;">👑</span>
            </div>
            <h2 style="color: #8b5cf6; margin: 0 0 20px 0; text-align: center;">Renovacao confirmada!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0; text-align: center;">
                Sua assinatura PRO foi renovada automaticamente.
            </p>
            <p style="color: #334155; line-height: 1.8; margin: 0; text-align: center;">
                Continue aproveitando analises completas ilimitadas!
            </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://nutrivision-drab.vercel.app/home" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Continuar usando
            </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            Obrigado por continuar com o Nutri-Vision PRO!<br>
            Equipe Nutri-Vision
        </p>
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="subscription_renewed")

def send_payment_failed_email(user_email: str):
    subject = "Problema com seu pagamento - Nutri-Vision"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #ef4444, #f97316); padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nutri-Vision</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Acao necessaria</p>
        </div>
        
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
            <a href="https://nutrivision-drab.vercel.app/billing" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #14b8a6); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Atualizar pagamento
            </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            Precisa de ajuda? Responda este email.<br>
            Equipe Nutri-Vision
        </p>
    </body>
    </html>
    """
    return send_email(user_email, subject, html, email_type="payment_failed")
