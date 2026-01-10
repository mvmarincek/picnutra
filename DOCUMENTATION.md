# NUTRI-VISION WEB - Documentação Técnica Completa

## Visão Geral

**Nutri-Vision Web** é um SaaS de análise nutricional de refeições por IA. O usuário fotografa sua refeição e recebe análise completa de calorias, macronutrientes, benefícios, pontos de atenção e sugestões de melhoria.

### URLs de Produção
- **Frontend (Vercel):** https://nutrivision.ai8hub.com (domínio customizado) ou https://nutrivision-drab.vercel.app
- **Backend (Render):** https://nutrivision-api-dcr0.onrender.com
- **Repositório:** https://github.com/mvmarincek/nutrivision.git

---

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend       │────▶│   PostgreSQL    │
│   Next.js 14    │     │   FastAPI       │     │   (Render)      │
│   (Vercel)      │     │   (Render)      │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
           ┌─────────────┐ ┌─────────┐ ┌─────────┐
           │  OpenAI API │ │  ASAAS  │ │  Resend │
           │  GPT-4o     │ │ Pagam.  │ │  Emails │
           │  DALL-E 3   │ │         │ │         │
           └─────────────┘ └─────────┘ └─────────┘
```

---

## Stack Tecnológica

### Backend
- **Python 3.11** (obrigatório - versões superiores causam incompatibilidade)
- **FastAPI** - Framework web assíncrono
- **SQLAlchemy 2.0** - ORM com suporte async
- **asyncpg** - Driver PostgreSQL assíncrono
- **OpenAI SDK** - Chamadas para GPT-4o e DALL-E 3
- **bcrypt** - Hash de senhas
- **python-jose** - JWT tokens
- **Pillow** - Processamento de imagens
- **ASAAS** - Gateway de pagamentos (PIX, Cartão, Boleto)
- **Resend** - Envio de emails transacionais

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **browser-image-compression** - Compressão de imagens no cliente
- **Google AdSense** - Monetização com anúncios (apenas usuários FREE)

---

## Estrutura de Diretórios

```
nutrivision/
├── backend/
│   ├── app/
│   │   ├── agents/                 # Sistema multiagente IA
│   │   │   ├── food_recognizer.py  # GPT-4o - identifica alimentos
│   │   │   ├── portion_estimator.py # GPT-4o - estima porções
│   │   │   ├── nutrition_calculator.py # Calcula calorias/macros
│   │   │   ├── health_advisor.py   # GPT-4o-mini - orientações
│   │   │   ├── meal_optimizer.py   # GPT-4o-mini - versão melhorada
│   │   │   ├── image_generator.py  # DALL-E 3 - imagem sugerida
│   │   │   ├── orchestrator.py     # Coordena todos os agentes
│   │   │   └── json_utils.py       # Utilitário para parse seguro
│   │   ├── api/routes/
│   │   │   ├── auth.py             # Registro, login, verificação email
│   │   │   ├── profile.py          # CRUD perfil do usuário + avatar
│   │   │   ├── meals.py            # Upload, análise, histórico
│   │   │   ├── jobs.py             # Status de jobs assíncronos
│   │   │   ├── billing.py          # ASAAS pagamentos
│   │   │   ├── credits.py          # Saldo de créditos
│   │   │   ├── feedback.py         # Sugestões dos usuários
│   │   │   └── admin.py            # Painel administrativo
│   │   ├── core/
│   │   │   ├── config.py           # Configurações
│   │   │   └── security.py         # JWT e bcrypt
│   │   ├── db/
│   │   │   └── database.py         # Conexão PostgreSQL async
│   │   ├── models/
│   │   │   └── models.py           # Modelos SQLAlchemy
│   │   ├── schemas/
│   │   │   └── schemas.py          # Schemas Pydantic
│   │   ├── services/
│   │   │   ├── asaas_service.py    # Integração ASAAS
│   │   │   └── email_service.py    # Integração Resend
│   │   ├── utils/
│   │   │   ├── nutrition_database.json # Base nutricional
│   │   │   └── nutrition_lookup.py # Busca por nome/sinônimo
│   │   └── main.py                 # App FastAPI + migrations
│   ├── requirements.txt
│   ├── migrate_db.py               # Script de migração standalone
│   ├── Procfile                    # Comando de deploy Render
│   └── runtime.txt                 # python-3.11.11
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/                 # Páginas de autenticação
│   │   ├── (main)/                 # Páginas do app (logado)
│   │   ├── billing/                # Success/Cancel de pagamento
│   │   ├── about/page.tsx          # Sobre o app
│   │   ├── privacy/page.tsx        # Política de privacidade
│   │   └── terms/page.tsx          # Termos de uso
│   ├── components/
│   │   ├── AdSenseAd.tsx           # Componente de anúncio
│   │   ├── PageAds.tsx             # Wrapper de ads (só FREE)
│   │   ├── FeedbackModal.tsx       # Modal de feedback global
│   │   └── Footer.tsx              # Rodapé
│   ├── lib/
│   │   ├── api.ts                  # Cliente API tipado
│   │   ├── auth.tsx                # Context de autenticação
│   │   ├── feedback.tsx            # Context de feedback
│   │   └── image-utils.ts          # Normalização de orientação
│   └── public/
│       └── manifest.json           # PWA manifest
│
├── DOCUMENTATION.md                # Este arquivo
└── README.md                       # Quick start
```

---

## Sistema de Emails (Resend)

### Configuração

O sistema usa **Resend** para envio de emails transacionais. A configuração fica em variáveis de ambiente e também pode ser ajustada pelo painel admin.

**Variável de ambiente:**
```env
RESEND_API_KEY=re_xxx
```

**Domínio verificado:** ai8hub.com (configurado no Resend Dashboard)

### Tipos de Emails Enviados

| Tipo | Trigger | Destinatário |
|------|---------|--------------|
| `email_verification` | Cadastro de novo usuário | Usuário |
| `email_verified` | Email verificado com sucesso | Usuário |
| `welcome` | Email verificado (junto com verified) | Usuário |
| `password_reset` | Solicitação de recuperação de senha | Usuário |
| `referral` | Indicado se cadastrou | Quem indicou |
| `pro_upgrade` | Assinatura PRO ativada | Usuário |
| `credits_purchase` | Compra de créditos confirmada | Usuário |
| `subscription_cancelled` | Assinatura cancelada | Usuário |
| `subscription_renewed` | Assinatura renovada | Usuário |
| `payment_failed` | Falha no pagamento | Usuário |
| `suggestion` | Usuário enviou sugestão | Admin |

### Configurações Editáveis (Admin)

Tabela `email_settings` no banco de dados:

| Key | Descrição | Valor Padrão |
|-----|-----------|--------------|
| `admin_email` | Email do administrador | mvmarincek@gmail.com |
| `support_email` | Email de suporte | suporte@ai8hub.com |
| `app_url` | URL base da aplicação | https://nutrivision.ai8hub.com |
| `frontend_url` | URL do frontend | https://nutrivision-drab.vercel.app |
| `from_name` | Nome do remetente | Nutri-Vision |
| `from_email` | Email do remetente | nutrivision-noreply@ai8hub.com |
| `welcome_credits` | Créditos de boas-vindas | 36 |
| `referral_credits` | Créditos por indicação | 12 |

### Endpoints Admin para Emails

```
GET  /admin/email-settings          # Listar configurações
PUT  /admin/email-settings/{key}    # Atualizar configuração
POST /admin/email-settings/reload   # Recarregar cache
GET  /admin/email-logs              # Logs de todos os emails
GET  /admin/email-stats             # Estatísticas de envio
GET  /admin/users/{id}/email-logs   # Logs de email de um usuário
```

### Rastreamento de Emails

Todos os emails são registrados na tabela `email_logs`:

```python
id: int
user_id: int (nullable)      # Vincula ao usuário
to_email: str                # Destinatário
subject: str                 # Assunto
email_type: str              # Tipo do email
status: str                  # pending, sent, failed
error_message: str           # Erro se falhou
resend_id: str               # ID retornado pelo Resend
created_at: datetime
```

### Testando Emails

Endpoint para testar se o Resend está funcionando:

```
GET /test-email/{email}
```

Exemplo: `https://nutrivision-api-dcr0.onrender.com/test-email/seu@email.com`

---

## Sistema de Pagamentos (ASAAS)

### Configuração

```env
ASAAS_API_KEY=xxx
ASAAS_ENVIRONMENT=production  # ou sandbox
```

**Ambientes:**
- Sandbox: https://sandbox.asaas.com/api/v3
- Produção: https://api.asaas.com/v3

### Fluxo de Pagamento PIX

1. Frontend chama `POST /billing/create-pix-payment` com pacote e CPF
2. Backend cria customer no ASAAS (se não existir)
3. Backend cria cobrança PIX no ASAAS
4. Backend salva pagamento na tabela `payments`
5. Retorna código PIX copia-cola + QR Code base64
6. Frontend exibe QR Code e faz polling a cada 5s em `GET /billing/payment-status/{id}`
7. Quando status = CONFIRMED ou RECEIVED:
   - Créditos são adicionados à conta
   - Email de confirmação é enviado

### Fluxo de Pagamento Cartão

1. Frontend chama `POST /billing/create-card-payment` com dados do cartão
2. Backend processa pagamento no ASAAS
3. Se aprovado imediatamente:
   - Créditos são adicionados
   - Email de confirmação é enviado
4. Se pendente:
   - Frontend faz polling até confirmação

### Webhook ASAAS

Endpoint: `POST /billing/webhook`

Eventos processados:
- `PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED` - Adiciona créditos ou ativa PRO
- `PAYMENT_OVERDUE` - Log de aviso
- `SUBSCRIPTION_DELETED` / `SUBSCRIPTION_INACTIVE` - Cancela assinatura

### Pacotes de Créditos

Definidos em `backend/app/core/config.py`:

```python
CREDIT_PACKAGES = {
    "starter": {"credits": 12, "price": 490},    # R$ 4,90
    "basic": {"credits": 36, "price": 1290},     # R$ 12,90
    "advanced": {"credits": 60, "price": 1990},  # R$ 19,90
    "pro": {"credits": 120, "price": 3490}       # R$ 34,90
}
```

### Assinatura PRO

- **Preço:** R$ 49,90/mês
- **Benefícios:**
  - Análises simples ilimitadas
  - 60 análises completas por mês (PRO_MONTHLY_ANALYSES)
  - Sem propagandas

---

## Sistema de Anúncios (Google AdSense)

### Configuração

No `frontend/app/layout.tsx`, o script do AdSense é carregado:

```html
<Script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3364979853180818"
  crossOrigin="anonymous"
/>
```

### Componentes

**AdSenseAd.tsx** - Componente base do anúncio:
- Slot: 5278243728
- Formato: horizontal, responsivo
- Altura: 90px

**PageAds.tsx** - Wrapper que só exibe para usuários FREE:
```tsx
if (user?.plan !== 'free') {
  return null;
}
```

### Políticas do AdSense

Para conformidade com políticas do Google AdSense:

1. **Não exibir ads em telas de loading/processamento**
   - Removido de `/processing`

2. **Não exibir ads em telas sem conteúdo**
   - Histórico vazio mostra conteúdo informativo sem ads
   - Ads só aparecem quando há análises

3. **Não exibir ads em telas de alerta/navegação**
   - Páginas `/billing/success` e `/billing/cancel` têm conteúdo substancial

### Onde os Ads Aparecem

| Página | Posição |
|--------|---------|
| /home | Inline (entre seções) + Bottom |
| /result | Inline + Bottom |
| /profile | Inline + Bottom |
| /billing | Inline |
| /history | Top + Inline (a cada 3 itens) + Bottom |

---

## Painel Administrativo

### Acesso

Usuários com `is_admin = True` têm acesso às rotas `/admin/*`.

Para tornar um usuário admin:
```sql
UPDATE users SET is_admin = TRUE WHERE email = 'seu@email.com';
```

Ou via migration em `migrate_db.py` que já define:
```python
"UPDATE users SET is_admin = TRUE WHERE email = 'mvmarincek@gmail.com'"
```

### Endpoints Admin

```
GET  /admin/stats                   # Dashboard com estatísticas
GET  /admin/users                   # Listar usuários (com busca/filtro)
GET  /admin/users/{id}              # Detalhes de um usuário
POST /admin/users/{id}/add-credits  # Adicionar créditos manualmente
POST /admin/users/{id}/toggle-admin # Alternar status admin
POST /admin/users/{id}/set-pro      # Ativar PRO manualmente
GET  /admin/payments                # Listar pagamentos
GET  /admin/email-logs              # Logs de emails
GET  /admin/email-stats             # Estatísticas de emails
GET  /admin/email-settings          # Configurações de email
PUT  /admin/email-settings/{key}    # Atualizar configuração
```

---

## Sistema Multiagente (IA)

### Fluxo de Análise

```
1. FoodRecognizerAgent (GPT-4o com visão)
   └── Recebe imagem base64 + tipo (prato/sobremesa/bebida)
   └── Considera observações do usuário (user_notes)
   └── Considera peso/volume informado
   └── Retorna: itens_identificados, alternativas

2. PortionEstimatorAgent (GPT-4o com visão)
   └── Recebe imagem + alimentos identificados
   └── Estima peso/volume de cada item
   └── Pode gerar perguntas se incerteza alta
   └── Retorna: porcoes, questions (opcional)

3. NutritionCalculatorAgent (local, sem IA)
   └── Recebe porções estimadas
   └── Consulta nutrition_database.json
   └── Calcula calorias e macros totais
   └── Retorna: calorias{central,min,max}, macros

4. HealthAdvisorAgent (GPT-4o-mini)
   └── Recebe valores nutricionais + perfil usuário
   └── Gera benefícios, pontos de atenção, recomendações
   └── Retorna: beneficios, pontos_de_atencao, recomendacoes

5. MealOptimizerAgent (GPT-4o-mini) - APENAS modo full
   └── Recebe análise completa + perfil + meal_type
   └── Gera sugestão de melhoria
   └── Retorna: sugestao_texto, mudancas, novos_valores

6. ImageGenerationManager (DALL-E 3) - APENAS modo full
   └── Recebe prompt do MealOptimizer
   └── Gera imagem fotorrealista
   └── Retorna: URL da imagem
```

### Modos de Análise

| Modo | Custo | Agentes | Resultado |
|------|-------|---------|-----------|
| simple | Grátis (FREE) / 5 créditos | 1-4 | Sem sugestão visual |
| full | 12 créditos | 1-6 | Com sugestão + imagem DALL-E |

---

## Modelo de Dados Completo

### User
```python
id: int (PK)
email: str (unique)
password_hash: str
name: str (nullable)
cpf: str (nullable)
phone: str (nullable)
plan: str = "free"  # free, pro
credit_balance: int = 0
pro_analyses_remaining: int = 0
pro_started_at: datetime (nullable)
pro_expires_at: datetime (nullable)
referral_code: str (unique, auto-generated)
referred_by: int (FK -> User, nullable)
email_verified: bool = False
email_verification_token: str (nullable)
asaas_customer_id: str (nullable)
asaas_subscription_id: str (nullable)
is_admin: bool = False
created_at: datetime
updated_at: datetime
```

### Profile
```python
id: int (PK)
user_id: int (FK -> User, unique)
objetivo: str  # emagrecer, manter, ganhar_massa, saude_geral
restricoes: JSON  # ["vegetariano", "sem_lactose", ...]
alergias: JSON  # ["amendoim", "frutos_do_mar", ...]
avatar_url: str (nullable)
created_at: datetime
```

### Meal
```python
id: int (PK)
user_id: int (FK -> User)
image_url: str  # /uploads/uuid.jpg
meal_type: str  # prato, sobremesa, bebida
status: str  # pending, analyzing, waiting_user, completed, failed
mode: str  # simple, full
user_notes: str (nullable)
weight_grams: float (nullable)
volume_ml: float (nullable)
created_at: datetime
```

### MealAnalysis
```python
id: int (PK)
meal_id: int (FK -> Meal, unique)
itens_identificados: JSON
porcoes_estimadas: JSON
calorias_central, calorias_min, calorias_max: float
proteina_g, carbo_g, gordura_g, fibra_g: float
confianca: str
incertezas: JSON
beneficios: JSON
pontos_de_atencao: JSON
recomendacoes_praticas: JSON
sugestao_melhorada_texto: str (nullable)
sugestao_melhorada_imagem_url: str (nullable)
mudancas_sugeridas: JSON (nullable)
calorias_nova_versao: JSON (nullable)
macros_nova_versao: JSON (nullable)
created_at: datetime
```

### Job
```python
id: int (PK)
user_id: int (FK -> User)
meal_id: int (FK -> Meal)
tipo: str  # analyze_meal, generate_suggestion_image
status: str  # received, running, waiting_user, completed, failed
etapa_atual: str
questions: JSON
answers: JSON
resultado_final: JSON
erro: str (nullable)
created_at: datetime
```

### Payment
```python
id: int (PK)
user_id: int (FK -> User)
asaas_payment_id: str
asaas_subscription_id: str (nullable)
payment_type: str  # credits, pro_subscription
billing_type: str  # PIX, CREDIT_CARD, BOLETO
amount: float
status: str  # pending, confirmed, failed, refunded
description: str
credits_purchased: int (nullable)
pix_code: str (nullable)
pix_qr_code_url: str (nullable)
boleto_url: str (nullable)
paid_at: datetime (nullable)
created_at: datetime
updated_at: datetime
```

### CreditTransaction
```python
id: int (PK)
user_id: int (FK -> User)
credits_added: int
credits_used: int = 0
balance_after: int
transaction_type: str  # welcome_bonus, purchase, analysis, admin_credit, referral
description: str
created_at: datetime
```

### Referral
```python
id: int (PK)
referrer_id: int (FK -> User)
referred_id: int (FK -> User, unique)
credits_awarded: int = 12
created_at: datetime
```

### EmailLog
```python
id: int (PK)
user_id: int (FK -> User, nullable)
to_email: str
subject: str
email_type: str
status: str  # pending, sent, failed
error_message: str (nullable)
resend_id: str (nullable)
created_at: datetime
```

### EmailSettings
```python
id: int (PK)
key: str (unique)
value: str
description: str
updated_at: datetime
```

---

## Variáveis de Ambiente

### Backend (Render)
```env
DATABASE_URL=postgresql://user:pass@host/db
SECRET_KEY=chave-secreta-jwt-256-bits
OPENAI_API_KEY=sk-proj-xxx
ASAAS_API_KEY=xxx
ASAAS_ENVIRONMENT=production
RESEND_API_KEY=re_xxx
FRONTEND_URL=https://nutrivision.ai8hub.com
BACKEND_URL=https://nutrivision-api-dcr0.onrender.com
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://nutrivision-api-dcr0.onrender.com
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-3364979853180818
```

---

## Deploy

### Backend (Render)

1. Criar Web Service no Render
2. Conectar repositório GitHub
3. Configurações:
   - **Root Directory:** backend
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Adicionar variáveis de ambiente
5. Deploy automático em push para main
6. **Após deploy:** Acessar `/run-migration` para criar/atualizar tabelas

### Frontend (Vercel)

1. Importar projeto do GitHub
2. Configurações:
   - **Root Directory:** frontend
   - **Framework Preset:** Next.js
3. Adicionar variáveis de ambiente
4. Deploy automático em push para main

### Banco de Dados (Render)

1. Criar PostgreSQL no Render
2. Copiar Internal Database URL
3. Usar como DATABASE_URL no backend

---

## Endpoints de Migração

Executar via navegador após cada deploy:

```
GET /run-migration
```

Cria/atualiza todas as tabelas e insere dados iniciais.

```
GET /fix-referral-codes
```

Gera códigos de indicação para usuários antigos.

```
GET /test-email/{email}
```

Testa se o Resend está funcionando.

---

## Endpoints de Teste/Debug

```
GET /health              # Health check
GET /test-asaas          # Verifica configuração ASAAS
GET /test-pix            # Testa criação de PIX
POST /auth/create-test-user  # Cria usuário de teste com 100k créditos
```

**Usuário de teste:**
- Email: teste@nutrivision.com
- Senha: teste123
- Créditos: 100.000

---

## Problemas Conhecidos e Soluções

### 1. Pillow incompatível com Python 3.13
**Solução:** Forçar Python 3.11 em `runtime.txt`

### 2. CORS bloqueando requisições
**Solução:** CORS permissivo com `allow_origins=["*"]`

### 3. PostgreSQL URL incompatível
**Solução:** Converter `postgres://` para `postgresql+asyncpg://`

### 4. Imagem não acessível pelo GPT-4o
**Solução:** Converter para base64 antes de enviar

### 5. Orientação de imagem incorreta (EXIF)
**Solução:** Normalizar no frontend (`image-utils.ts`)

### 6. Domínio de email não verificado no Resend
**Solução:** Verificar domínio em https://resend.com/domains

---

## Replicando para Outros Apps

### Checklist de Serviços Externos

1. **Render** - Backend + PostgreSQL
2. **Vercel** - Frontend
3. **OpenAI** - Chaves de API (GPT-4o, DALL-E 3)
4. **ASAAS** - Conta + Chave de API (produção)
5. **Resend** - Conta + Domínio verificado + Chave de API
6. **Google AdSense** - Conta aprovada + Slots de anúncio
7. **Domínio** - DNS configurado para Vercel

### Passos para Novo App

1. Fork/clone do repositório
2. Atualizar nomes/branding nos arquivos
3. Criar recursos no Render (Web Service + PostgreSQL)
4. Criar projeto no Vercel
5. Criar contas/chaves nos serviços externos
6. Configurar variáveis de ambiente
7. Fazer deploy
8. Executar `/run-migration`
9. Verificar domínio no Resend
10. Testar fluxos de email e pagamento

### Arquivos que Precisam de Atualização

- `backend/app/core/config.py` - Configurações do app
- `backend/app/services/email_service.py` - Templates de email
- `frontend/app/layout.tsx` - Metadata, AdSense ID
- `frontend/components/AdSenseAd.tsx` - Slot de anúncio
- `frontend/public/manifest.json` - PWA info
- Migrations no `main.py` - Email admin padrão

---

## Comandos Úteis

### Desenvolvimento Local
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Deploy
```bash
git add .
git commit -m "feat: description"
git push origin main
```

### Verificar Status
```bash
# Health check
curl https://nutrivision-api-dcr0.onrender.com/health

# Swagger UI
# https://nutrivision-api-dcr0.onrender.com/docs
```
