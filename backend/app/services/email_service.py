import resend
import os

ADMIN_EMAIL = "mvmarincek@gmail.com"
resend.api_key = os.getenv("RESEND_API_KEY", "")

def send_email(to: str, subject: str, html_content: str):
    if not resend.api_key:
        print(f"[EMAIL] Para: {to}")
        print(f"[EMAIL] Assunto: {subject}")
        return False
    
    try:
        resend.Emails.send({
            "from": "Nutri-Vision <onboarding@resend.dev>",
            "to": to,
            "subject": subject,
            "html": html_content
        })
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        return False

def send_welcome_email(user_email: str):
    subject = "Bem-vindo ao Nutri-Vision!"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #22c55e, #14b8a6); padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Nutri-Vision</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Sua jornada para uma alimentacao saudavel comeca agora!</p>
        </div>
        
        <div style="background: white; border-radius: 20px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #22c55e; margin: 0 0 20px 0;">Ola!</h2>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 15px 0;">
                Parabens por dar o primeiro passo em direcao a uma alimentacao mais consciente!
            </p>
            <p style="color: #334155; line-height: 1.8; margin: 0 0 20px 0;">
                Com o Nutri-Vision, voce pode:
            </p>
            <ul style="color: #334155; line-height: 2; padding-left: 20px; margin: 0 0 20px 0;">
                <li>Fotografar suas refeicoes e receber analise nutricional instantanea</li>
                <li>Acompanhar calorias, proteinas, carboidratos e gorduras</li>
                <li>Receber dicas personalizadas para melhorar sua alimentacao</li>
                <li>Visualizar versoes otimizadas dos seus pratos</li>
            </ul>
            <p style="color: #334155; line-height: 1.8; margin: 0;">
                Voce ganhou <strong style="color: #22c55e;">27 creditos gratis</strong> para comecar! Isso e suficiente para fazer varias analises e conhecer o poder da nossa IA.
            </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://nutrivision-drab.vercel.app/home" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #14b8a6); color: white; text-decoration: none; padding: 15px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">
                Comecar Agora
            </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            Cuide da sua saude, uma refeicao de cada vez.<br>
            Equipe Nutri-Vision
        </p>
    </body>
    </html>
    """
    return send_email(user_email, subject, html)

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
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            Equipe Nutri-Vision
        </p>
    </body>
    </html>
    """
    return send_email(user_email, subject, html)

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
    return send_email(ADMIN_EMAIL, subject, html)
