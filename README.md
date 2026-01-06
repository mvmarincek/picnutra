# Nutri-Vision Web

## Configuração do Projeto

### Backend (FastAPI + Agno)

1. Entre na pasta backend:
```bash
cd backend
```

2. Crie um ambiente virtual:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite .env com suas chaves
```

5. Execute o servidor:
```bash
uvicorn app.main:app --reload
```

### Frontend (Next.js)

1. Entre na pasta frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.local.example .env.local
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

### Variáveis de Ambiente Necessárias

**Backend (.env):**
- `DATABASE_URL`: URL do banco de dados (SQLite ou PostgreSQL)
- `SECRET_KEY`: Chave secreta para JWT
- `OPENAI_API_KEY`: Chave da API OpenAI
- `STRIPE_SECRET_KEY`: Chave secreta do Stripe
- `STRIPE_WEBHOOK_SECRET`: Secret do webhook Stripe
- `FRONTEND_URL`: URL do frontend

**Frontend (.env.local):**
- `NEXT_PUBLIC_API_URL`: URL do backend

### Deploy

**Backend (Render):**
1. Conecte seu repositório
2. Configure as variáveis de ambiente
3. Deploy automático via Procfile

**Frontend (Vercel):**
1. Conecte seu repositório
2. Configure NEXT_PUBLIC_API_URL
3. Deploy automático

### Custos de Créditos

- Análise simples: 5 créditos
- Análise completa (com imagem): 12 créditos

### Pacotes de Créditos

- 50 créditos: R$ 9,90
- 100 créditos: R$ 17,90
- 300 créditos: R$ 44,90
- 1000 créditos: R$ 129,90

### Assinatura Pro

- R$ 49,90/mês
- 30 análises completas incluídas
"# Deploy trigger"  
