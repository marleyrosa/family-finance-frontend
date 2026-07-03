# Frontend - FamilYMoney

Aplicacao Next.js com dashboard financeiro moderno, dark mode, graficos animados e suporte PWA.

## Stack

- Next.js (App Router)
- TailwindCSS
- Recharts
- Framer Motion
- PWA (manifest + service worker)

## Funcionalidades

- Login e cadastro por email
- Cards de resumo (despesas, renda, saldo)
- Graficos: linha, pizza e barras
- Convite de parceiro por email
- Upload de boleto PDF
- Exportacao de relatorios CSV/PDF
- Filtro por mes e ano

## Rodar localmente

1. Instalar dependencias:

```bash
npm install
```

1. Configurar variaveis:

```bash
copy .env.local.example .env.local
```

1. Rodar app:

```bash
npm run dev
```

Acesso: <http://localhost:3000>

## V2 Upgrade Checklist

- [x] Rename app to FamilYMoney
- [x] User avatar and profile header
- [x] Show logged user name
- [x] Show income owner and expense owner
- [x] Total family income and balance
- [x] Edit/Delete income
- [x] Edit/Delete expense
- [x] Recent transactions list
- [x] Sidebar navigation
- [x] Nubank-style UI
- [x] Stronger Framer Motion animations
- [x] Pie chart by expense category
- [x] Bar chart income vs expenses
- [x] Category percentage of income
- [x] Monthly insights and alerts
- [x] Responsive mobile design
