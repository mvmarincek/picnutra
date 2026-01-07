# NUTRI-VISION WEB - Documentação Técnica Completa

## Visão Geral

**Nutri-Vision Web** é um SaaS de análise nutricional de refeições por IA. O usuário fotografa sua refeição e recebe análise completa de calorias, macronutrientes, benefícios, pontos de atenção e sugestões de melhoria.

### URLs de Produção
- **Frontend (Vercel):** https://nutrivision-drab.vercel.app
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
                                 ▼
                        ┌─────────────────┐
                        │   OpenAI API    │
                        │   GPT-4o        │
                        │   DALL-E 3      │
                        └─────────────────┘
```

---

## Stack Tecnológica

### Backend
- **Python 3.11** (obrigatório - versões superiores causam incompatibilidade)
- **FastAPI** - Framework web assíncrono
- **SQLAlchemy 2.0** - ORM com suporte async
- **asyncpg** - Driver PostgreSQL assíncrono
- **OpenAI SDK** - Chamadas para GPT-4o e DALL-E 3
- **bcrypt** - Hash de senhas (substituiu passlib por incompatibilidade)
- **python-jose** - JWT tokens
- **Pillow** - Processamento de imagens
- **Stripe** - Pagamentos (configuração pendente)

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **browser-image-compression** - Compressão de imagens no cliente

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
│   │   │   └── orchestrator.py     # Coordena todos os agentes
│   │   ├── api/routes/
│   │   │   ├── auth.py             # Registro e login
│   │   │   ├── profile.py          # CRUD perfil do usuário
│   │   │   ├── meals.py            # Upload, análise, histórico
│   │   │   ├── jobs.py             # Status de jobs assíncronos
│   │   │   ├── billing.py          # Stripe checkout e webhook
│   │   │   └── credits.py          # Saldo de créditos
│   │   ├── core/
│   │   │   ├── config.py           # Configurações e variáveis de ambiente
│   │   │   └── security.py         # JWT e bcrypt
│   │   ├── db/
│   │   │   └── database.py         # Conexão PostgreSQL async
│   │   ├── models/
│   │   │   └── models.py           # Modelos SQLAlchemy
│   │   ├── schemas/
│   │   │   └── schemas.py          # Schemas Pydantic
│   │   ├── utils/
│   │   │   ├── nutrition_database.json # Base nutricional 50+ alimentos
│   │   │   └── nutrition_lookup.py # Busca por nome/sinônimo
│   │   └── main.py                 # App FastAPI
│   ├── requirements.txt
│   ├── Procfile                    # Comando de deploy Render
│   └── runtime.txt                 # python-3.11.11
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (main)/
│   │   │   ├── home/page.tsx       # Tela de nova análise
│   │   │   ├── processing/page.tsx # Polling de job + perguntas
│   │   │   ├── result/page.tsx     # Resultado da análise
│   │   │   ├── history/page.tsx    # Histórico de análises
│   │   │   ├── billing/page.tsx    # Compra de créditos
│   │   │   ├── profile/page.tsx    # Perfil do usuário
│   │   │   └── layout.tsx          # Layout com navegação
│   │   ├── page.tsx                # Landing page
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Estilos globais + gradientes
│   ├── lib/
│   │   ├── api.ts                  # Cliente API tipado
│   │   └── auth.tsx                # Context de autenticação
│   ├── public/
│   │   └── manifest.json           # PWA manifest (parcial)
│   ├── next.config.js
│   └── package.json
│
└── DOCUMENTATION.md                # Este arquivo
```

---

## Sistema Multiagente

### Fluxo de Análise

```
1. FoodRecognizerAgent (GPT-4o com visão)
   └── Recebe imagem base64
   └── Identifica alimentos com confiança (alto/medio/baixo)
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
   └── Analisa benefícios e pontos de atenção
   └── Gera recomendações práticas motivacionais
   └── Retorna: beneficios, pontos_de_atencao, recomendacoes

5. MealOptimizerAgent (GPT-4o-mini) - APENAS modo full
   └── Recebe análise completa + perfil
   └── Sugere versão melhorada do prato
   └── Gera prompt para imagem
   └── Retorna: sugestao_texto, mudancas, novos_valores

6. ImageGenerationManager (DALL-E 3) - APENAS modo full
   └── Recebe prompt do MealOptimizer
   └── Gera imagem fotorrealista
   └── Retorna: URL da imagem
```

### Orquestrador (orchestrator.py)

O `NutriOrchestrator` coordena todo o fluxo:
- Valida créditos antes de iniciar
- Deduz créditos (Pro quota ou balance)
- Atualiza status do job em cada etapa
- Trata erros e salva resultado final

---

## Modelo de Dados

### User
```python
id: int (PK)
email: str (unique)
hashed_password: str
plan: str = "free"  # free, pro
credit_balance: int = 27  # créditos iniciais
pro_analyses_remaining: int = 0
stripe_customer_id: str (nullable)
created_at: datetime
```

### Profile
```python
id: int (PK)
user_id: int (FK -> User, unique)
objetivo: str  # emagrecer, manter, ganhar_massa, saude_geral
restricoes: List[str]  # vegetariano, vegano, sem_lactose, etc.
alergias: List[str]
created_at: datetime
```

### Meal
```python
id: int (PK)
user_id: int (FK -> User)
image_url: str  # /uploads/uuid.jpg
meal_type: str  # prato, sobremesa, bebida
status: str  # pending, analyzing, completed, failed
mode: str  # simple, full
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
tipo: str  # analyze_meal
status: str  # received, running, waiting_user, completed, failed
etapa_atual: str  # descrição da etapa atual
questions: JSON  # perguntas para o usuário
answers: JSON  # respostas do usuário
resultado_final: JSON
erro: str (nullable)
created_at: datetime
```

### CreditTransaction
```python
id: int (PK)
user_id: int (FK -> User)
credits_added: int
credits_used: int
transaction_type: str  # purchase, usage, bonus
stripe_session_id: str (nullable)
created_at: datetime
```

---

## Sistema de Créditos

### Custos
- **Análise Simples:** 5 créditos
- **Análise Completa:** 12 créditos (inclui sugestão visual com DALL-E)

### Pacotes (Stripe - pendente configuração)
| Pacote | Créditos | Preço |
|--------|----------|-------|
| Inicial | 50 | R$ 9,90 |
| Básico | 100 | R$ 17,90 |
| Avançado | 300 | R$ 44,90 |
| Pro | 1000 | R$ 129,90 |

### Créditos Gratuitos
- Novos usuários recebem **27 créditos** (3 análises simples + 1 completa)

---

## Variáveis de Ambiente

### Backend (Render)
```env
DATABASE_URL=postgresql://nutrivision_db_user:xxx@dpg-xxx-a/nutrivision_db
SECRET_KEY=nV8xK2mP9qR4tW7yB3cF6hJ0lN5oS1uX4zA7dG2iE9kM6pQ8rT3vY0wC5fH1jL4n
OPENAI_API_KEY=sk-proj-xxx
STRIPE_SECRET_KEY=sk_live_xxx  # pendente
STRIPE_WEBHOOK_SECRET=whsec_xxx  # pendente
FRONTEND_URL=https://nutrivision-drab.vercel.app
BACKEND_URL=https://nutrivision-api-dcr0.onrender.com
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://nutrivision-api-dcr0.onrender.com
```

---

## Problemas Resolvidos e Soluções

### 1. Pillow incompatível com Python 3.13
**Erro:** `Getting requirements to build wheel did not run successfully`
**Solução:** Forçar Python 3.11 em `runtime.txt`: `python-3.11.11`

### 2. passlib incompatível com Python 3.13
**Erro:** Erro 500 no registro de usuários
**Solução:** Substituir passlib por bcrypt direto:
```python
import bcrypt
def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
```

### 3. CORS bloqueando requisições
**Erro:** "Failed to fetch" no frontend
**Solução:** Configurar CORS permissivo no FastAPI:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. PostgreSQL URL incompatível com asyncpg
**Erro:** Render fornece `postgres://` mas asyncpg precisa `postgresql+asyncpg://`
**Solução:** Função de conversão em `database.py`:
```python
def get_database_url():
    url = settings.DATABASE_URL
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url
```

### 5. Agno framework causando erro
**Erro:** `'str' object has no attribute 'id'`
**Causa:** Framework Agno tinha API incompatível/instável
**Solução:** Remover Agno e usar OpenAI SDK diretamente:
```python
# Antes (Agno)
self.agent = Agent(model=OpenAIChat(...))
response = self.agent.run(prompt, images=[url])

# Depois (OpenAI direto)
self.client = openai.AsyncOpenAI(api_key=...)
response = await self.client.chat.completions.create(...)
```

### 6. Imagem não acessível pelo GPT-4o
**Erro:** GPT-4o não conseguia analisar imagens com URL relativa `/uploads/...`
**Solução:** Converter imagem para base64 antes de enviar:
```python
if image_url.startswith("/uploads/"):
    file_path = os.path.join(settings.UPLOAD_DIR, image_url.replace("/uploads/", ""))
    with open(file_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")
    image_content = {
        "type": "image_url",
        "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}
    }
```

### 7. Vercel deployando commit antigo
**Problema:** Vercel ignorava novos commits
**Solução:** Forçar novo commit com arquivo trigger:
```bash
echo "# Trigger" >> .vercel-trigger && git add -A && git commit -m "trigger" && git push
```

### 8. Tabelas não criadas no PostgreSQL
**Erro:** Tabela profiles não existia
**Solução:** Importar models antes de criar tabelas em `init_db()`:
```python
async def init_db():
    from app.models import models  # Importar para registrar no Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

---

## Design e UX

### Paleta de Cores
- **Primary (Verde):** #22c55e → #14b8a6 (gradient-fresh)
- **Warm (Laranja):** #ff6b35 → #ffc233 (gradient-warm)
- **Vitality (Roxo):** #3b82f6 → #a855f7 (gradient-vitality)
- **Accent:** Rosa #ff6b9d, Amarelo #ffc233

### Princípios de Neurociência Aplicados
1. **Cores alegres e vibrantes** - Ativam sistema de recompensa
2. **Mensagens motivacionais aleatórias** - Novidade mantém engajamento
3. **Celebração de conquistas** - Banner com troféu no resultado
4. **Emojis e ícones** - Processamento visual mais rápido
5. **Feedback positivo primeiro** - Sempre encontrar algo bom
6. **Gamificação** - Créditos como moeda, badges PRO
7. **Dicas práticas** - Sensação de aprendizado contínuo

### Tom do HealthAdvisor
- Atua como "personal trainer de alimentação"
- Nunca critica, sempre encoraja
- Baseado em nutrição moderna (Dieta Mediterrânea, anti-inflamatória)
- Explica o "porquê" de cada sugestão

---

## Deploy

### Backend (Render)
1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Runtime: Python 3.11 (via runtime.txt)

### Frontend (Vercel)
1. Conectar repositório GitHub
2. Root Directory: `frontend`
3. Framework Preset: Next.js
4. Configurar `NEXT_PUBLIC_API_URL`

---

## Pendências

### Funcionalidades
- [ ] Configurar Stripe (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
- [ ] Implementar PWA completo (next-pwa, ícones, service worker)
- [ ] Notificações push
- [ ] Histórico com filtros e busca
- [ ] Exportar relatório PDF/Excel
- [ ] Metas diárias de calorias/macros

### Melhorias Técnicas
- [ ] Cache de análises recentes
- [ ] Rate limiting por usuário
- [ ] Logs estruturados
- [ ] Monitoramento (Sentry)
- [ ] Testes automatizados
- [ ] CI/CD pipeline

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
# Commit e push (trigger deploy automático)
git add -A
git commit -m "feat: description"
git push

# Forçar redeploy Vercel se necessário
echo "# trigger" >> .vercel-trigger
git add -A && git commit -m "chore: trigger deploy" && git push
```

### Verificar status
```bash
# Backend health check
curl https://nutrivision-api-dcr0.onrender.com/health

# Swagger UI
# https://nutrivision-api-dcr0.onrender.com/docs
```

---

## Usuário de Teste

Para criar/resetar o usuário de teste com 100.000 créditos:

```bash
curl -X POST https://nutrivision-api-dcr0.onrender.com/auth/create-test-user
```

**Credenciais:**
- Email: `teste@nutrivision.com`
- Senha: `teste123`
- Créditos: 100.000

---

## Chaves e Credenciais

**IMPORTANTE:** As chaves reais estão configuradas nas variáveis de ambiente do Render e Vercel.
Nunca commitar chaves no repositório.

### OpenAI
```
Configurada no Render: OPENAI_API_KEY
```

### JWT Secret
```
Configurada no Render: SECRET_KEY
```

### PostgreSQL (Render)
```
Configurada no Render: DATABASE_URL
```

### Stripe
```
STRIPE_SECRET_KEY=<configurar no Render>
STRIPE_WEBHOOK_SECRET=<configurar no Render>
```

---

## Contato e Suporte

Este projeto foi desenvolvido com assistência de IA. Para continuidade:
1. Leia esta documentação completamente
2. Verifique os logs do Render/Vercel se houver erros
3. Consulte a seção "Problemas Resolvidos" antes de debugar
4. Use o Swagger UI para testar endpoints isoladamente

---

*Última atualização: Janeiro 2026*

---

## Atualizações - Sessão Janeiro 2026 (Parte 2)

### Domínio Personalizado

**Vercel Domains:** 
- `nutrivision-drab.vercel.app` (gerado automaticamente)
- `nutrivision.ai8hub.com` (domínio personalizado - configurar CNAME)

**Configuração DNS:**
- Tipo: CNAME
- Nome: nutrivision
- Valor: cname.vercel-dns.com

### Sistema de Email (Resend)

**Arquivo:** `backend/app/services/email_service.py`
**Variável Render:** `RESEND_API_KEY` = `re_ji5CoGsy_BH5pxkxj8eU2Pu2uhdqvUJiJ`
**Remetente:** `Nutri-Vision <nutrivision-noreply@ai8hub.com>`
**Domínio verificado:** `ai8hub.com`

**URLs nos emails atualizadas para:** `https://nutrivision-drab.vercel.app`

Funções disponíveis:
- `send_welcome_email(user_email)` - Enviado automaticamente no cadastro
- `send_password_reset_email(user_email, reset_token)` - Recuperação de senha
- `send_suggestion_email(user_email, user_id, mensagem)` - Sugestões (envia para mvmarincek@gmail.com)

### Modelo de Planos FREE vs PRO com AdSense

**Lógica implementada:**

| Plano | Análise Simples | Análise Completa | Anúncios |
|-------|-----------------|------------------|----------|
| FREE | Grátis e ilimitada | Requer créditos | Sim (AdSense) |
| PRO | Usa quota/créditos | Usa quota/créditos | Não |

**Backend - Validação de créditos:**
- Arquivo: `backend/app/agents/orchestrator.py`
- FREE + análise simples = `free_unlimited` (não deduz créditos)
- PRO = usa quota primeiro, depois créditos
- FREE + análise completa = requer créditos

**Frontend - Exibição:**
- Análise rápida mostra "Grátis" para usuários FREE
- Análise completa mostra "12 créditos" com badge PRO

### Google AdSense

**Componente:** `frontend/components/AdBanner.tsx`

**Variáveis de ambiente (Vercel):**
| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | ID do AdSense (ex: `ca-pub-3364979853180818`) |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOME` | Slot ID - Página Home |
| `NEXT_PUBLIC_ADSENSE_SLOT_RESULT` | Slot ID - Página Resultado |
| `NEXT_PUBLIC_ADSENSE_SLOT_HISTORY` | Slot ID - Página Histórico |
| `NEXT_PUBLIC_ADSENSE_SLOT_PROFILE` | Slot ID - Página Perfil |
| `NEXT_PUBLIC_ADSENSE_SLOT_PROCESSING` | Slot ID - Página Processamento |

**Implementação:**
- `frontend/app/layout.tsx` - Carrega script AdSense + metatag
- `frontend/components/AdBanner.tsx` - Componente de banner
- Banners só aparecem para usuários com `plan === 'free'`
- Anúncios não aparecem se variáveis não estiverem configuradas

**Páginas com banners:**
1. Home - antes das dicas
2. Resultado - antes do botão "Nova análise"
3. Histórico - após a lista de refeições
4. Perfil - após a caixa de sugestões
5. Processamento - após as dicas motivacionais

**PENDENTE:** Verificar domínio no Google AdSense (requer acesso ao domínio raiz `ai8hub.com` para arquivo `ads.txt`)

### Recuperação de Senha

**Endpoints:**
- `POST /auth/forgot-password` - Solicita recuperação (verifica se usuário existe)
- `POST /auth/reset-password` - Redefine senha

**Comportamento:**
- Se usuário não existe: retorna `{exists: false}` e frontend oferece criar conta
- Se usuário existe: envia email com link de recuperação

**Páginas Frontend:**
- `frontend/app/(auth)/forgot-password/page.tsx` - Solicitar email
- `frontend/app/reset-password/page.tsx` - Formulário nova senha (NA RAIZ para funcionar no Vercel)

### Caixa de Sugestões

**Frontend:** `frontend/app/(main)/profile/page.tsx` - Seção no final do perfil
**Backend:** `backend/app/api/routes/feedback.py`
**Destino:** mvmarincek@gmail.com

### Dicas Durante Processamento

**Arquivo:** `frontend/app/(main)/processing/page.tsx`
- 20 frases motivacionais e dicas de culinária
- Alternam a cada 4 segundos
- Array `dicasEMotivacao` no início do arquivo

### Paralelização de Agentes

**Arquivo:** `backend/app/agents/orchestrator.py`
- HealthAdvisor e MealOptimizer rodam em paralelo com `asyncio.gather`
- Melhora tempo de resposta da análise completa

### JSON Parsing Robusto

**Arquivo:** `backend/app/agents/json_utils.py`
- Função `parse_json_safe(content)` - Remove trailing commas antes de parse
- Corrige erro "Illegal trailing comma" do GPT-4o

### Imagem DALL-E

**Arquivo:** `backend/app/agents/image_generator.py`
- Modelo: DALL-E 2 (mais rápido)
- Tamanho: 512x512 (quadrado)
- Imagem exibida completa sem cortes

---

## Variáveis de Ambiente Atualizadas

### Backend (Render)
```env
DATABASE_URL=postgresql://...
SECRET_KEY=...
OPENAI_API_KEY=sk-proj-...
RESEND_API_KEY=re_ji5CoGsy_BH5pxkxj8eU2Pu2uhdqvUJiJ
FRONTEND_URL=https://nutrivision-drab.vercel.app
BACKEND_URL=https://nutrivision-api-dcr0.onrender.com
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://nutrivision-api-dcr0.onrender.com
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-3364979853180818
NEXT_PUBLIC_ADSENSE_SLOT_HOME=<slot_id>
NEXT_PUBLIC_ADSENSE_SLOT_RESULT=<slot_id>
NEXT_PUBLIC_ADSENSE_SLOT_HISTORY=<slot_id>
NEXT_PUBLIC_ADSENSE_SLOT_PROFILE=<slot_id>
NEXT_PUBLIC_ADSENSE_SLOT_PROCESSING=<slot_id>
```

---

*Última atualização: Janeiro 2026 - Sessão 2*
