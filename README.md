# FamilYMoney

### Finanças da família organizadas, em um app só — e no ar

> **About (EN):** FamilYMoney is a family finance web app in production: a Next.js frontend (PWA, dark mode, animated charts) and a FastAPI + PostgreSQL backend. It tracks income and expenses, supports partner invitations, reads Brazilian boleto bills from PDF uploads, and exports monthly reports — built to be used daily by a real family.

## 📌 O que é

O **FamilYMoney** é um aplicativo web de **finanças familiares** criado para uso real, diário, de uma família de verdade: registrar receitas e despesas, enxergar o saldo, acompanhar gráficos e fechar o mês sem planilha confusa.

O sistema está **em produção e acessível online**:

- 🌐 **App:** https://family-finance-frontend-7cc4.onrender.com
- ⚙️ **API:** https://family-finance-backend-0r19.onrender.com

## ✨ O que o app faz

- **Login e cadastro** por e-mail, com autenticação JWT;
- **Dashboard** com cards de resumo (receitas, despesas e saldo) e gráficos de linha, pizza e barras;
- **Uso em casal/família:** convite de parceiro por e-mail e saldo familiar consolidado;
- **Upload de boleto em PDF** — o app lê o documento e ajuda a lançar a conta;
- **Relatórios mensais** com comparativo mês atual × anterior, economia e categorias, com exportação em **CSV e PDF**;
- **Busca e filtros** por mês, ano, descrição, categoria e usuário;
- **PWA instalável**, com dark mode, página offline e lembretes financeiros locais.

## 🧱 Estrutura do projeto

| Parte | Repositório | Stack |
|---|---|---|
| Frontend | [family-finance-frontend](https://github.com/marleyrosa/family-finance-frontend) | Next.js (App Router), TailwindCSS, Recharts, Framer Motion, PWA |
| Backend | [family-finance-backend](https://github.com/marleyrosa/family-finance-backend) | FastAPI, PostgreSQL, SQLAlchemy, Pydantic, JWT, pdfplumber (leitura de boletos em PDF) |

## ▶️ Como executar localmente

**Backend:**

```bash
# 1. Suba o PostgreSQL
docker compose up -d

# 2. Ambiente virtual e dependências
python -m venv .venv
pip install -r requirements.txt

# 3. Configure as variáveis (a partir do exemplo)
copy .env.example .env

# 4. Rode a API
uvicorn app.main:app --reload --port 8000
# Swagger em http://localhost:8000/docs
```

**Frontend:**

```bash
npm install
copy .env.local.example .env.local
npm run dev
# Acesse http://localhost:3000
```

## 👤 Autor

**Marley Rosa Luciano** — Engenheiro, mestre em Engenharia Elétrica, Plant Modeling Engineer (XiL) na indústria automotiva e professor de pós-graduação na PUC Minas.

- GitHub: [github.com/marleyrosa](https://github.com/marleyrosa)
- LinkedIn: [linkedin.com/in/marley-rosa-luciano-b32101104](https://www.linkedin.com/in/marley-rosa-luciano-b32101104)
