# NUTRI-VISION - Documentação Técnica Completa

## Índice
1. [Visão Geral](#visão-geral)
2. [URLs de Produção](#urls-de-produção)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Estrutura de Diretórios](#estrutura-de-diretórios)
6. [Backend - FastAPI](#backend---fastapi)
7. [Frontend - Next.js](#frontend---nextjs)
8. [Banco de Dados](#banco-de-dados)
9. [Sistema de Agentes IA](#sistema-de-agentes-ia)
10. [Integrações Externas](#integrações-externas)
11. [Autenticação e Segurança](#autenticação-e-segurança)
12. [Sistema de Pagamentos](#sistema-de-pagamentos)
13. [Deploy e Infraestrutura](#deploy-e-infraestrutura)
14. [Variáveis de Ambiente](#variáveis-de-ambiente)
15. [Fluxos Principais](#fluxos-principais)
16. [Padrões e Boas Práticas](#padrões-e-boas-práticas)
17. [Troubleshooting](#troubleshooting)
18. [Versionamento](#versionamento)

---

## Visão Geral

**Nutri-Vision** é um aplicativo web/PWA de análise nutricional por imagem. O usuário fotografa sua refeição e o sistema utiliza IA (GPT-4 Vision) para identificar alimentos, estimar porções e calcular informações nutricionais.

### Funcionalidades Principais
- Análise de imagens de refeições (pratos, sobremesas, bebidas)
- Identificação automática de alimentos via IA
- Estimativa de porções e calorias
- Recomendações nutricionais personalizadas
- Sugestões de melhorias com imagem gerada (DALL-E 3)
- Sistema de créditos e assinatura PRO
- Painel administrativo completo
- Sistema de indicação com recompensas
- PWA instalável

---

## URLs de Produção

| Serviço | URL |
|---------|-----|
| Frontend (Vercel) | https://nutrivision.ai8hub.com |
| Frontend alternativo | https://nutrivision-drab.vercel.app |
| Backend (Render) | https://nutrivision-api-dcr0.onrender.com |
| API Docs | https://nutrivision-api-dcr0.onrender.com/docs |
| Repositório | https://github.com/mvmarincek/nutrivision.git |

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Next.js + Vercel)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    Pages    │  │  Components │  │     Lib     │             │
│  │  (auth,     │  │  (AdSense,  │  │  (api.ts,   │             │
│  │   main)     │  │   Footer)   │  │   auth.tsx) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS/REST
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                    (FastAPI + Render)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Routes    │  │   Agents    │  │  Services   │             │
│  │  (auth,     │  │  (food,     │  │  (asaas,    │             │
│  │   meals,    │  │   portion,  │  │   email)    │             │
│  │   billing)  │  │   health)   │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   PostgreSQL  │   │   OpenAI API  │   │   ASAAS API   │
│   (Render)    │   │  (GPT-4, DALL │   │  (Pagamentos) │
│               │   │    E-3)       │   │               │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## Stack Tecnológico

### Backend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Python | 3.11+ | Linguagem principal |
| FastAPI | 0.109+ | Framework web assíncrono |
| SQLAlchemy | 2.0+ | ORM assíncrono |
| PostgreSQL | 15+ | Banco de dados |
| Pydantic | 2.5+ | Validação de dados |
| OpenAI | 1.10+ | Integração GPT-4/DALL-E |
| httpx | 0.26+ | Cliente HTTP assíncrono |
| Resend | 0.7+ | Envio de emails |
| bcrypt | 4.0+ | Hash de senhas |
| python-jose | 3.3+ | JWT tokens |

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Next.js | 14.1 | Framework React |
| React | 18.2 | Biblioteca UI |
| TypeScript | 5.3 | Tipagem estática |
| Tailwind CSS | 3.4 | Estilização |
| Lucide React | 0.312 | Ícones |
| next-pwa | 5.6 | Progressive Web App |

### Infraestrutura
| Serviço | Propósito |
|---------|-----------|
| Vercel | Hosting frontend |
| Render | Hosting backend + PostgreSQL |
| GitHub | Repositório + CI/CD |
| ASAAS | Gateway de pagamento (PIX/Cartão) |
| Resend | Serviço de email transacional |
| Cloudinary | Armazenamento de imagens (upload usuários) |
| Google AdSense | Monetização (usuários free) |

---

## Estrutura de Diretórios

```
SistemaNutri/
├── backend/
│   ├── app/
│   │   ├── agents/                 # Agentes de IA
│   │   │   ├── food_recognizer.py  # Identificação de alimentos
│   │   │   ├── portion_estimator.py # Estimativa de porções
│   │   │   ├── nutrition_calculator.py # Cálculo nutricional
│   │   │   ├── health_advisor.py   # Recomendações de saúde
│   │   │   ├── meal_optimizer.py   # Otimização de refeições
│   │   │   ├── image_generator.py  # Geração de imagens (DALL-E)
│   │   │   ├── orchestrator.py     # Orquestrador principal
│   │   │   └── json_utils.py       # Parsing seguro de JSON
│   │   ├── api/
│   │   │   └── routes/
│   │   │       ├── auth.py         # Autenticação (login, registro)
│   │   │       ├── meals.py        # Upload e análise de refeições
│   │   │       ├── jobs.py         # Status de processamento
│   │   │       ├── billing.py      # Pagamentos e assinaturas
│   │   │       ├── credits.py      # Gerenciamento de créditos
│   │   │       ├── profile.py      # Perfil do usuário
│   │   │       ├── admin.py        # Painel administrativo
│   │   │       └── feedback.py     # Log de erros frontend
│   │   ├── core/
│   │   │   ├── config.py           # Configurações e env vars
│   │   │   └── security.py         # JWT e autenticação
│   │   ├── db/
│   │   │   └── database.py         # Conexão com banco
│   │   ├── models/
│   │   │   └── models.py           # Modelos SQLAlchemy
│   │   ├── schemas/
│   │   │   └── schemas.py          # Schemas Pydantic
│   │   ├── services/
│   │   │   ├── asaas_service.py    # Integração ASAAS
│   │   │   ├── cloudinary_service.py # Upload de imagens Cloudinary
│   │   │   └── email_service.py    # Envio de emails
│   │   ├── utils/
│   │   │   ├── nutrition_database.json # Base nutricional
│   │   │   └── nutrition_lookup.py # Busca nutricional
│   │   └── main.py                 # Entry point FastAPI
│   ├── requirements.txt
│   ├── Procfile                    # Comando Render
│   └── runtime.txt                 # Versão Python
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/                 # Rotas de autenticação
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── verify-email/
│   │   ├── (main)/                 # Rotas autenticadas
│   │   │   ├── home/               # Tela principal
│   │   │   ├── processing/         # Processamento de análise
│   │   │   ├── result/             # Resultado da análise
│   │   │   ├── history/            # Histórico de refeições
│   │   │   ├── profile/            # Perfil e indicações
│   │   │   ├── billing/            # Compra de créditos/PRO
│   │   │   └── admin/              # Painel admin
│   │   ├── about/                  # Página sobre
│   │   ├── privacy/                # Política de privacidade
│   │   ├── terms/                  # Termos de uso
│   │   ├── layout.tsx              # Layout raiz
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   ├── AdSenseAd.tsx           # Componente de anúncios
│   │   ├── PageAds.tsx             # Wrapper de anúncios
│   │   ├── Footer.tsx              # Rodapé
│   │   ├── BowlLogo.tsx            # Logo animado
│   │   └── InstallPWAButton.tsx    # Botão instalar PWA
│   ├── lib/
│   │   ├── api.ts                  # Cliente API centralizado
│   │   ├── auth.tsx                # Context de autenticação
│   │   ├── feedback.tsx            # Sistema de notificações
│   │   └── image-utils.ts          # Compressão de imagens
│   ├── public/
│   │   ├── manifest.json           # PWA manifest
│   │   ├── sw.js                   # Service Worker
│   │   └── icons...                # Ícones PWA
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── DOCUMENTATION.md                # Este arquivo
```

---

## Backend - FastAPI

### Estrutura de Rotas (Endpoints)

#### Auth (`/auth`)
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/auth/register` | Registrar novo usuário | Não |
| POST | `/auth/login` | Login (retorna JWT) | Não |
| GET | `/auth/me` | Dados do usuário logado | Sim |
| POST | `/auth/forgot-password` | Solicitar reset de senha | Não |
| POST | `/auth/reset-password` | Resetar senha | Não |
| GET | `/auth/verify-email/{token}` | Verificar email | Não |

#### Meals (`/meals`)
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/meals/upload` | Upload de imagem + análise | Sim |
| GET | `/meals/history` | Histórico de refeições | Sim |
| GET | `/meals/{meal_id}` | Detalhes de uma refeição | Sim |
| DELETE | `/meals/{meal_id}` | Excluir refeição | Sim |

#### Jobs (`/jobs`)
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/jobs/{job_id}` | Status do processamento | Sim |
| POST | `/jobs/{job_id}/answers` | Enviar respostas | Sim |

#### Billing (`/billing`)
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/billing/packages` | Listar pacotes de créditos | Não |
| GET | `/billing/status` | Status do plano do usuário | Sim |
| POST | `/billing/create-pix-payment` | Gerar PIX para créditos | Sim |
| POST | `/billing/create-card-payment` | Pagamento com cartão | Sim |
| POST | `/billing/create-pro-subscription` | Assinar PRO | Sim |
| POST | `/billing/cancel-subscription` | Cancelar assinatura | Sim |
| GET | `/billing/payment-status/{id}` | Status de pagamento | Sim |
| POST | `/billing/webhook` | Webhook ASAAS | Não |
| GET | `/billing/diagnose` | Diagnóstico ASAAS | Não* |

#### Profile (`/profile`)
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/profile` | Obter perfil | Sim |
| PUT | `/profile` | Atualizar perfil | Sim |
| POST | `/profile/avatar` | Upload de avatar | Sim |

#### Admin (`/admin`) - Requer is_admin=True
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/admin/stats` | Estatísticas dashboard |
| GET | `/admin/charts` | Dados para gráficos |
| GET | `/admin/users` | Listar usuários |
| GET | `/admin/users/{id}` | Detalhes do usuário |
| GET | `/admin/users/{id}/referrals-converted` | Indicações do usuário |
| POST | `/admin/users/{id}/add-credits` | Adicionar créditos |
| POST | `/admin/users/{id}/set-pro` | Ativar PRO |
| POST | `/admin/users/{id}/remove-pro` | Remover PRO |
| POST | `/admin/users/{id}/toggle-admin` | Alternar admin |
| POST | `/admin/users/{id}/reset-pro-analyses` | Resetar análises |
| POST | `/admin/users/{id}/resend-verification` | Reenviar email |
| DELETE | `/admin/users/{id}` | Excluir usuário |
| GET | `/admin/payments` | Listar pagamentos |
| DELETE | `/admin/payments/{id}` | Excluir pagamento |
| GET | `/admin/errors` | Listar logs de erro |
| GET | `/admin/errors/stats` | Estatísticas de erros |
| POST | `/admin/errors/{id}/resolve` | Resolver erro |
| POST | `/admin/errors/resolve-all` | Resolver todos |
| DELETE | `/admin/errors/{id}` | Excluir erro |
| GET | `/admin/export/users` | Exportar CSV usuários |
| GET | `/admin/export/payments` | Exportar CSV pagamentos |
| GET | `/admin/export/kpis` | Exportar CSV KPIs |

---

## Banco de Dados

### Modelos (Tabelas)

#### User
```python
class User(Base):
    __tablename__ = "users"
    
    id: int                      # PK
    email: str                   # Único, indexado
    password_hash: str           # bcrypt hash
    name: str                    # Nome opcional
    cpf: str                     # Para pagamentos ASAAS
    phone: str                   # Telefone
    plan: str                    # "free" ou "pro"
    credit_balance: int          # Saldo de créditos
    pro_analyses_remaining: int  # Análises PRO restantes (90/mês)
    pro_started_at: datetime     # Início do PRO
    pro_expires_at: datetime     # Expiração do PRO
    asaas_customer_id: str       # ID cliente ASAAS
    asaas_subscription_id: str   # ID assinatura ASAAS
    referral_code: str           # Código de indicação único
    referred_by: int             # FK quem indicou
    email_verified: bool         # Email verificado
    email_verification_token: str # Token de verificação
    is_admin: bool               # É administrador
    created_at: datetime
    updated_at: datetime
```

#### Profile
```python
class Profile(Base):
    __tablename__ = "profiles"
    
    id: int
    user_id: int                 # FK User (único)
    objetivo: str                # "emagrecer", "manter", "ganhar_massa", "saude_geral"
    restricoes: list[str]        # ["vegetariano", "vegano", "sem_gluten", "sem_lactose"]
    alergias: list[str]          # ["amendoim", "leite", "ovo", "frutos_do_mar"]
    avatar_url: str              # URL do avatar
    created_at: datetime
```

#### Meal
```python
class Meal(Base):
    __tablename__ = "meals"
    
    id: int
    user_id: int                 # FK User
    image_url: str               # Caminho da imagem (/uploads/...)
    meal_type: str               # "prato", "sobremesa", "bebida"
    status: str                  # "pending", "analyzing", "waiting_user", "completed", "failed"
    mode: str                    # "simple" ou "full"
    user_notes: str              # Observações do usuário
    weight_grams: float          # Peso informado (opcional)
    volume_ml: float             # Volume informado (opcional)
    created_at: datetime
```

#### MealAnalysis
```python
class MealAnalysis(Base):
    __tablename__ = "meal_analysis"
    
    id: int
    meal_id: int                 # FK Meal (único)
    itens_identificados: list    # [{"nome": "arroz", "confianca": "alto", ...}]
    porcoes_estimadas: list      # [{"item": "arroz", "peso_g_ml_central": 150, ...}]
    calorias_central: float      # Calorias estimadas
    calorias_min: float          # Faixa mínima
    calorias_max: float          # Faixa máxima
    proteina_g: float
    carbo_g: float
    gordura_g: float
    fibra_g: float
    confianca: str               # "baixo", "medio", "alto"
    incertezas: list[str]        # Fatores de incerteza
    beneficios: list[str]        # Pontos positivos
    pontos_de_atencao: list[str] # Pontos de atenção
    recomendacoes_praticas: list[str] # Dicas práticas
    sugestao_melhorada_texto: str # (modo full) Descrição da sugestão
    sugestao_melhorada_imagem_url: str # (modo full) URL imagem DALL-E
    mudancas_sugeridas: list[str] # (modo full) Lista de mudanças
    calorias_nova_versao: dict   # (modo full) {"central": x, "min": y, "max": z}
    macros_nova_versao: dict     # (modo full) {"proteina_g": x, ...}
    created_at: datetime
```

#### Job
```python
class Job(Base):
    __tablename__ = "jobs"
    
    id: int
    user_id: int                 # FK User
    meal_id: int                 # FK Meal
    tipo: str                    # "analyze_meal"
    status: str                  # "received", "running", "waiting_user", "completed", "failed"
    etapa_atual: str             # "Identificando alimentos...", etc
    questions: list              # Perguntas ao usuário (se houver)
    answers: dict                # Respostas do usuário
    resultado_final: dict        # Resultado completo da análise
    erro: str                    # Mensagem de erro (se falhou)
    created_at: datetime
```

#### Payment
```python
class Payment(Base):
    __tablename__ = "payments"
    
    id: int
    user_id: int                 # FK User
    asaas_payment_id: str        # ID no ASAAS
    asaas_subscription_id: str   # ID assinatura (se aplicável)
    payment_type: str            # "credits" ou "subscription" ou "pro_subscription"
    billing_type: str            # "PIX" ou "CREDIT_CARD"
    amount: float                # Valor em reais
    status: str                  # "pending", "confirmed"
    description: str             # Descrição
    credits_purchased: int       # Quantidade de créditos
    pix_code: str                # Código copia-cola PIX
    pix_qr_code_url: str         # QR Code base64
    boleto_url: str              # URL do boleto (se aplicável)
    paid_at: datetime            # Data de pagamento
    created_at: datetime
    updated_at: datetime
```

#### CreditTransaction
```python
class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    
    id: int
    user_id: int                 # FK User
    credits_added: int           # Créditos adicionados
    credits_used: int            # Créditos usados
    balance_after: int           # Saldo após transação
    transaction_type: str        # "purchase", "usage", "referral", "admin_credit", "admin_pro"
    description: str             # Descrição detalhada
    created_at: datetime
```

#### Referral
```python
class Referral(Base):
    __tablename__ = "referrals"
    
    id: int
    referrer_id: int             # FK User - quem indicou
    referred_id: int             # FK User - quem foi indicado (único)
    credits_awarded: int         # Créditos dados (12)
    created_at: datetime
```

#### EmailLog
```python
class EmailLog(Base):
    __tablename__ = "email_logs"
    
    id: int
    user_id: int                 # FK User (opcional)
    to_email: str                # Email destinatário
    subject: str                 # Assunto
    email_type: str              # Tipo do email
    status: str                  # "pending", "sent", "failed"
    error_message: str           # Erro (se falhou)
    resend_id: str               # ID no Resend
    created_at: datetime
```

#### ErrorLog
```python
class ErrorLog(Base):
    __tablename__ = "error_logs"
    
    id: int
    user_id: int                 # FK User (opcional)
    error_type: str              # Tipo: "billing_pix_payment", "frontend_error", etc
    error_message: str           # Mensagem de erro
    error_stack: str             # Stack trace
    url: str                     # URL onde ocorreu
    user_agent: str              # Browser/device
    extra_data: dict             # Dados adicionais (JSON)
    resolved: bool               # Marcado como resolvido
    created_at: datetime
```

---

## Sistema de Agentes IA

### Fluxo de Análise

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   Imagem    │────▶│ FoodRecognizer   │────▶│ PortionEstimator  │
│   Upload    │     │ (GPT-4 Vision)   │     │ (GPT-4 Vision)    │
└─────────────┘     └──────────────────┘     └───────────────────┘
                            │                         │
                    Identifica alimentos      Estima porções (g/ml)
                            │                         │
                            ▼                         ▼
                    ┌──────────────────┐     ┌───────────────────┐
                    │ NutritionCalc    │◀────│  Base Nutricional │
                    │ (Cálculo local)  │     │    (JSON 200+)    │
                    └──────────────────┘     └───────────────────┘
                            │
                    Calcula macros/calorias
                            │
                            ▼
                    ┌──────────────────┐
                    │  HealthAdvisor   │
                    │  (GPT-4o-mini)   │
                    └──────────────────┘
                            │
                    Gera recomendações
                            │
              ┌─────────────┴─────────────┐
              │                           │
        Modo Simple                  Modo Full
              │                           │
              ▼                           ▼
        ┌──────────┐            ┌──────────────────┐
        │ Resultado│            │  MealOptimizer   │
        │  Final   │            │  (GPT-4o-mini)   │
        └──────────┘            └──────────────────┘
                                          │
                                Gera sugestão melhorada
                                          │
                                          ▼
                                ┌──────────────────┐
                                │ ImageGenerator   │
                                │   (DALL-E 3)     │
                                └──────────────────┘
                                          │
                                          ▼
                                   ┌──────────┐
                                   │ Resultado│
                                   │  Final   │
                                   └──────────┘
```

### Agentes Detalhados

#### 1. FoodRecognizerAgent
- **Arquivo**: `backend/app/agents/food_recognizer.py`
- **Modelo**: GPT-4 Vision (gpt-4o)
- **Função**: Identificar alimentos na imagem
- **Input**: Imagem base64, tipo de refeição (prato/sobremesa/bebida)
- **Output**: Lista de itens com confiança e flag de industrializado

#### 2. PortionEstimatorAgent
- **Arquivo**: `backend/app/agents/portion_estimator.py`
- **Modelo**: GPT-4 Vision (gpt-4o)
- **Função**: Estimar peso/volume de cada item
- **Input**: Imagem, lista de itens identificados
- **Output**: Porções em gramas/ml com faixas min/max

#### 3. NutritionCalculatorAgent
- **Arquivo**: `backend/app/agents/nutrition_calculator.py`
- **Modelo**: Cálculo local (sem IA) - usa base JSON
- **Função**: Calcular macros e calorias
- **Input**: Lista de porções
- **Output**: Calorias, proteína, carboidrato, gordura, fibra

#### 4. HealthAdvisorAgent
- **Arquivo**: `backend/app/agents/health_advisor.py`
- **Modelo**: GPT-4o-mini
- **Função**: Gerar recomendações nutricionais
- **Input**: Dados nutricionais, perfil do usuário, tipo de refeição
- **Output**: Benefícios, pontos de atenção, dicas práticas

#### 5. MealOptimizerAgent (Modo Full apenas)
- **Arquivo**: `backend/app/agents/meal_optimizer.py`
- **Modelo**: GPT-4o-mini
- **Função**: Sugerir versão melhorada da refeição
- **Input**: Refeição atual, perfil do usuário
- **Output**: Sugestão textual + prompt para imagem

#### 6. ImageGenerationManager (Modo Full apenas)
- **Arquivo**: `backend/app/agents/image_generator.py`
- **Modelo**: DALL-E 3
- **Função**: Gerar imagem da sugestão melhorada
- **Input**: Prompt em inglês
- **Output**: URL da imagem gerada

### Orquestrador
- **Arquivo**: `backend/app/agents/orchestrator.py`
- **Função**: Coordena todo o fluxo de análise
- **Responsabilidades**:
  - Validar créditos
  - Descontar créditos
  - Chamar agentes na ordem correta
  - Salvar resultado no banco
  - Tratar erros e fazer refund se necessário

---

## Integrações Externas

### OpenAI API
```python
# Modelos utilizados e custos aproximados
GPT-4o Vision     # Reconhecimento (input: $5/1M, output: $15/1M)
GPT-4o-mini       # Recomendações (input: $0.15/1M, output: $0.60/1M)
DALL-E 3          # Imagens ($0.04/imagem 1024x1024)

# Exemplo de uso
from openai import AsyncOpenAI
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

response = await client.chat.completions.create(
    model="gpt-4o",
    messages=[...],
    max_tokens=1000
)
```

### ASAAS (Pagamentos)
```python
# URL Base
PRODUÇÃO: https://api.asaas.com/v3
SANDBOX:  https://sandbox.asaas.com/api/v3

# Headers
{
    "access_token": "ASAAS_API_KEY",
    "Content-Type": "application/json"
}

# Endpoints utilizados
POST /customers              # Criar cliente
PUT  /customers/{id}         # Atualizar CPF
POST /payments               # Criar cobrança PIX/Cartão
GET  /payments/{id}/pixQrCode # Obter QR Code
POST /subscriptions          # Criar assinatura recorrente
DELETE /subscriptions/{id}   # Cancelar assinatura

# Webhook URL
https://nutrivision-api-dcr0.onrender.com/billing/webhook

# Webhook events tratados
PAYMENT_CONFIRMED       # Pagamento confirmado → credita créditos/ativa PRO
PAYMENT_RECEIVED        # Pagamento recebido → mesma ação
PAYMENT_OVERDUE         # Pagamento atrasado → log
SUBSCRIPTION_DELETED    # Assinatura cancelada → remove PRO
SUBSCRIPTION_INACTIVE   # Assinatura inativa → remove PRO
```

### Resend (Emails)
```python
# Tipos de email enviados
email_verification       # Verificação de email (registro)
password_reset           # Reset de senha
credits_purchased        # Compra de créditos confirmada
upgraded_to_pro          # Upgrade para PRO
subscription_renewed     # Renovação mensal de assinatura
subscription_cancelled   # Cancelamento de assinatura
referral_bonus           # Bônus de indicação recebido

# Exemplo de uso
import resend
resend.api_key = settings.RESEND_API_KEY

resend.Emails.send({
    "from": "Nutri-Vision <noreply@nutrivision.ai8hub.com>",
    "to": email,
    "subject": "Assunto",
    "html": "<html>...</html>"
})
```

### Cloudinary (Armazenamento de Imagens)

**Por que Cloudinary?**
O Render usa sistema de arquivos efêmero - uploads locais são apagados a cada deploy/reinício.
Cloudinary persiste as imagens dos usuários permanentemente.

```python
# Arquivo: backend/app/services/cloudinary_service.py

# Configuração (variáveis de ambiente no Render)
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# Uso no upload de refeições
from app.services.cloudinary_service import upload_image_to_cloudinary, is_cloudinary_configured

if is_cloudinary_configured():
    cloudinary_url = await upload_image_to_cloudinary(content, filename)
    image_url = cloudinary_url  # URL externa do Cloudinary
else:
    image_url = f"/uploads/{filename}"  # Fallback local

# Plano Gratuito Cloudinary
- 25GB de armazenamento
- 25GB de bandwidth/mês
- Transformações automáticas (resize, otimização)
```

**Fluxo de Upload:**
```
1. Usuário envia imagem (celular/PC)
2. Backend recebe e redimensiona (max 2048x2048)
3. Se Cloudinary configurado:
   └─ Upload para Cloudinary → retorna URL https://res.cloudinary.com/...
4. Se não configurado:
   └─ Salva localmente em ./uploads/
5. URL é salva no campo Meal.image_url
6. Agentes de IA recebem URL direta do Cloudinary
```

---

## Autenticação e Segurança

### Fluxo de Autenticação

```
1. REGISTRO (/auth/register)
   ├─ Valida email único
   ├─ Hash da senha (bcrypt, cost=12)
   ├─ Gera referral_code único (8 chars)
   ├─ Se ?ref=CODIGO, registra indicação
   ├─ Gera token verificação email
   ├─ Envia email de verificação
   └─ Retorna JWT token (30 dias)

2. LOGIN (/auth/login)
   ├─ Busca usuário por email
   ├─ Verifica senha (bcrypt)
   └─ Retorna JWT token (30 dias)

3. REQUISIÇÕES AUTENTICADAS
   ├─ Header: Authorization: Bearer <token>
   ├─ Middleware decodifica JWT
   ├─ Extrai user_id do payload
   ├─ Busca User no banco
   └─ Injeta no endpoint via Depends()
```

### JWT Token
```python
# Payload
{
    "sub": "123",           # user_id como string
    "exp": 1234567890       # timestamp expiração (30 dias)
}

# Configuração
ALGORITHM = "HS256"
SECRET_KEY = env("SECRET_KEY")
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 dias
```

### Proteção de Rotas
```python
# Usuário autenticado
from app.core.security import get_current_user

@router.get("/rota")
async def rota(current_user: User = Depends(get_current_user)):
    ...

# Apenas admin
from app.api.routes.admin import get_admin_user

@router.get("/admin/rota")
async def rota(admin: User = Depends(get_admin_user)):
    ...
```

### Segurança Implementada
- Senhas hasheadas com bcrypt (cost 12)
- JWT com expiração de 30 dias
- CORS restritivo (apenas domínios permitidos)
- Validação de inputs via Pydantic
- Proteção SQL injection via ORM (SQLAlchemy)
- Logs de erro sem dados sensíveis
- CPF e dados de cartão não persistidos

---

## Sistema de Pagamentos

### Planos e Créditos

| Plano | Preço | Benefícios |
|-------|-------|------------|
| Free | R$ 0 | Análises simples ilimitadas, com anúncios |
| PRO | R$ 49,90/mês | 90 análises completas/mês, sem anúncios |

| Pacote | Créditos | Preço | Custo/Análise |
|--------|----------|-------|---------------|
| 12 créditos | 12 | R$ 4,90 | R$ 0,41 |
| 36 créditos | 36 | R$ 12,90 | R$ 0,36 |
| 60 créditos | 60 | R$ 19,90 | R$ 0,33 |
| 120 créditos | 120 | R$ 34,90 | R$ 0,29 |

### Custo de Análises
- **Análise Simples**: Gratuita (ilimitada)
- **Análise Completa**: 12 créditos ou 1 análise PRO

### Fluxo de Pagamento PIX
```
1. Frontend: Usuário escolhe pacote e informa CPF
2. Backend: Cria/atualiza cliente no ASAAS
3. Backend: Cria cobrança PIX
4. Backend: Obtém QR Code
5. Frontend: Exibe QR Code e código copia-cola
6. Usuário: Paga via app do banco
7. ASAAS: Envia webhook PAYMENT_CONFIRMED
8. Backend: Credita créditos ao usuário
9. Backend: Envia email de confirmação
10. Frontend: Polling detecta pagamento confirmado
```

### Fluxo de Assinatura PRO (PIX)
```
1. Usuário solicita assinatura PIX
2. Backend cria cobrança PIX avulsa (primeira mensalidade)
3. Usuário paga
4. Webhook ativa PRO + cria assinatura recorrente
5. Próximos meses: ASAAS gera PIX automaticamente
6. Webhook renova análises (90/mês)
```

### Fluxo de Assinatura PRO (Cartão)
```
1. Usuário informa dados do cartão
2. Backend cria assinatura com cartão
3. Se aprovado: PRO ativado imediatamente
4. Cobranças mensais automáticas
```

---

## Deploy e Infraestrutura

### Backend (Render)

**Web Service Settings:**
```yaml
Name: nutrivision-api
Environment: Python
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Arquivos necessários:**

`Procfile`:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

`runtime.txt`:
```
python-3.11.4
```

### Frontend (Vercel)

**Configuração automática** (detecta Next.js)

`vercel.json` (opcional):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Banco de Dados (Render PostgreSQL)

**Configuração:**
- Plano: Free tier (90 dias) ou Starter ($7/mês)
- Região: Mesma do backend (Oregon)
- Conexão via DATABASE_URL

### CI/CD

**Deploy automático:**
- Push para `main` → Render e Vercel fazem deploy automaticamente
- Build time: ~2-3 min (backend), ~1-2 min (frontend)

---

## Variáveis de Ambiente

### Backend (Render Environment)

```env
# OBRIGATÓRIAS
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SECRET_KEY=chave-secreta-longa-e-aleatoria-minimo-32-chars
OPENAI_API_KEY=sk-...

# URLs
FRONTEND_URL=https://nutrivision.ai8hub.com
BACKEND_URL=https://nutrivision-api-dcr0.onrender.com

# ASAAS (Pagamentos)
ASAAS_API_KEY=$aact_prod_...
ASAAS_BASE_URL=https://api.asaas.com/v3

# Email (Resend)
RESEND_API_KEY=re_...

# Cloudinary (Armazenamento de Imagens)
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# OPCIONAIS (têm defaults)
UPLOAD_DIR=./uploads
ACCESS_TOKEN_EXPIRE_MINUTES=43200
CREDIT_COST_SIMPLE=1
CREDIT_COST_FULL=12
PRO_MONTHLY_ANALYSES=90
```

### Frontend (Vercel Environment)

```env
NEXT_PUBLIC_API_URL=https://nutrivision-api-dcr0.onrender.com
```

### Desenvolvimento Local

**Backend (.env):**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nutrivision
SECRET_KEY=dev-secret-key-not-for-production
OPENAI_API_KEY=sk-...
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
ASAAS_API_KEY=$aact_...
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
RESEND_API_KEY=re_...
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Fluxos Principais

### 1. Registro de Usuário
```
1. Usuário acessa /register
2. Preenche email, senha, nome (opcional)
3. Se veio com ?ref=CODIGO, armazena
4. POST /auth/register
5. Backend:
   ├─ Valida email único
   ├─ Hash senha (bcrypt)
   ├─ Gera referral_code
   ├─ Se ref válido: cria Referral
   ├─ Envia email verificação
   └─ Retorna JWT
6. Frontend salva token no localStorage
7. Redireciona para /home
```

### 2. Verificação de Email
```
1. Usuário clica link no email
2. GET /auth/verify-email/{token}
3. Backend:
   ├─ Busca user pelo token
   ├─ Marca email_verified = True
   ├─ Se foi indicado:
   │   ├─ Credita 12 ao referrer
   │   └─ Envia email ao referrer
   └─ Retorna sucesso
4. Redireciona para /login com mensagem
```

### 3. Análise de Refeição
```
1. Usuário na /home escolhe tipo (prato/sobremesa/bebida)
2. Escolhe modo (simple/full)
3. Tira/seleciona foto
4. Frontend comprime imagem (max 1MB)
5. POST /meals/upload (multipart)
6. Backend:
   ├─ Valida créditos (se full)
   ├─ Upload imagem para Cloudinary (ou local)
   ├─ Cria Meal e Job
   ├─ Desconta créditos
   └─ Inicia análise async
7. Frontend redireciona para /processing/{job_id}
8. Frontend faz polling GET /jobs/{job_id}
9. Quando status=completed:
   └─ Redireciona para /result/{meal_id}
```

### 4. Compra de Créditos
```
1. Usuário em /billing escolhe pacote
2. Informa CPF
3. POST /billing/create-pix-payment
4. Backend:
   ├─ Cria/atualiza customer ASAAS
   ├─ Cria payment PIX
   ├─ Obtém QR Code
   └─ Salva Payment no banco
5. Frontend exibe QR Code
6. Usuário paga
7. ASAAS envia webhook
8. Backend:
   ├─ Atualiza Payment.status
   ├─ Credita user.credit_balance
   ├─ Cria CreditTransaction
   └─ Envia email
9. Frontend polling detecta pagamento
10. Mostra sucesso
```

### 5. Sistema de Indicação
```
1. Usuário A copia link de indicação (/register?ref=ABC123)
2. Usuário B acessa link e se registra
3. Sistema cria Referral (referrer=A, referred=B)
4. Quando B verifica email:
   ├─ A.credit_balance += 12
   ├─ Cria CreditTransaction para A
   └─ Envia email para A
```

---

## Padrões e Boas Práticas

### Código Python (Backend)
```python
# Async/await em todas as operações I/O
async def get_user(db: AsyncSession, user_id: int):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

# Type hints
def calculate_calories(portions: List[Dict[str, Any]]) -> Dict[str, float]:
    ...

# Dependency Injection
@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ...

# Tratamento de erros específicos
try:
    result = await asaas_service.create_payment(...)
except AsaasError as e:
    await log_billing_error(db, "pix_payment", e.message, user.id, e.to_dict())
    raise HTTPException(status_code=400, detail=e.message)
```

### Código TypeScript (Frontend)
```typescript
// Interfaces para tipagem
interface User {
  id: number;
  email: string;
  plan: 'free' | 'pro';
  credit_balance: number;
}

// API client centralizado
const response = await api<User>('/auth/me');

// Context para estado global
const { user, isLoading } = useAuth();

// Tratamento de erros
try {
  await mealApi.upload(formData);
} catch (error) {
  showError('Erro ao enviar imagem');
}
```

### Convenções de Código
- Nomes de variáveis em snake_case (Python) e camelCase (TypeScript)
- Componentes React em PascalCase
- Arquivos de rotas refletem URL: `/billing` → `app/(main)/billing/page.tsx`
- Commits semânticos: `feat:`, `fix:`, `docs:`, `refactor:`

---

## Troubleshooting

### Erro: "Créditos insuficientes"
```
Causa: user.credit_balance < 12 e user.pro_analyses_remaining = 0
Solução:
- Verificar saldo no painel admin
- Análise completa custa 12 créditos
- PRO usa quota separada (pro_analyses_remaining)
```

### Erro: "Erro ao criar pagamento"
```
Causas possíveis:
1. ASAAS_API_KEY não configurada ou inválida
2. ASAAS_BASE_URL incorreta (deve ser https://api.asaas.com/v3)
3. CPF inválido ou mal formatado

Diagnóstico:
- Acessar /billing/diagnose para testar conexão
- Ver logs de erro em /admin > Logs
```

### Erro: "Webhook não processa pagamento"
```
Causas possíveis:
1. URL do webhook incorreta no ASAAS
2. externalReference não está sendo enviado
3. Pagamento já foi processado (duplicado)

Verificar:
- URL deve ser: https://nutrivision-api-dcr0.onrender.com/billing/webhook
- Logs do backend no Render
```

### Erro: "Análise falha / timeout"
```
Causas possíveis:
1. OPENAI_API_KEY inválida ou sem créditos
2. Imagem muito grande ou formato inválido
3. Timeout da OpenAI

Verificar:
- Job.erro no banco de dados
- Logs do backend
- Saldo na OpenAI
```

### Erro: "Imagens não aparecem no histórico"
```
Causas possíveis:
1. Cloudinary não configurado (imagens salvas localmente são apagadas no redeploy)
2. URL da imagem inválida ou expirada

Solução:
- Configurar variáveis Cloudinary no Render:
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- Imagens antigas (pré-Cloudinary) foram perdidas

Diagnóstico:
- Verificar Meal.image_url no banco
- URLs Cloudinary começam com https://res.cloudinary.com/
- URLs locais começam com /uploads/ (não persistem)
```

### Deploy não atualiza
```
Render:
- Verificar se push foi feito para main
- Ver build logs no dashboard
- Às vezes precisa "Manual Deploy"

Vercel:
- Deploy é automático
- Verificar se build passou
- Limpar cache: Settings > Functions > Redeploy
```

### Banco de dados lento/erro conexão
```
Render Free Tier:
- Hiberna após 15min inatividade
- Primeira request leva 30-60s
- Considerar upgrade para Starter ($7/mês)
```

---

## Versionamento

### Tags Git
```bash
# Listar tags
git tag

# Criar tag
git tag -a v1.0.0 -m "Descrição da versão"
git push origin v1.0.0

# Versões existentes
v1.0.0-release          # Versão inicial de lançamento
v1.0.1-pre-cloudinary   # Antes da integração Cloudinary
```

### Rollback
```bash
# Voltar para versão anterior
git checkout v1.0.0-release
git push -f origin main

# Render e Vercel farão redeploy automático
```

### Boas Práticas
```
- Criar tag antes de mudanças grandes
- Testar em local antes de push
- Manter DOCUMENTATION.md atualizada
- Commits pequenos e frequentes
```

---

## Checklist de Novo Projeto

### 1. Setup Inicial
- [ ] Criar repositório GitHub
- [ ] Estrutura de pastas backend/frontend
- [ ] Configurar .gitignore
- [ ] Criar requirements.txt / package.json

### 2. Backend
- [ ] Configurar FastAPI + SQLAlchemy
- [ ] Criar models do banco
- [ ] Implementar autenticação JWT
- [ ] Criar rotas principais
- [ ] Configurar CORS

### 3. Frontend
- [ ] Configurar Next.js + Tailwind
- [ ] Criar lib/api.ts centralizada
- [ ] Implementar AuthContext
- [ ] Criar pages principais
- [ ] Configurar PWA

### 4. Deploy
- [ ] Criar PostgreSQL no Render
- [ ] Deploy backend no Render
- [ ] Configurar variáveis de ambiente
- [ ] Deploy frontend na Vercel
- [ ] Testar integração

### 5. Integrações
- [ ] Configurar ASAAS (produção)
- [ ] Configurar webhook ASAAS
- [ ] Configurar Resend
- [ ] Configurar Cloudinary (criar conta gratuita)
- [ ] Testar fluxo de pagamento
- [ ] Testar envio de emails
- [ ] Testar upload de imagens (celular)

### 6. Produção
- [ ] Configurar domínio customizado
- [ ] Criar tag de versão
- [ ] Documentar variáveis de ambiente
- [ ] Testar fluxos principais

---

*Documentação atualizada em: Janeiro 2025*
*Versão do sistema: 1.0.0-release*
