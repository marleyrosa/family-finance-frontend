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

## V2 Todo Completion (Validated)

- [x] User avatar/profile
- [x] Transaction owner
- [x] Edit income
- [x] Delete income
- [x] Edit expense
- [x] Delete expense
- [x] Recent transactions timeline
- [x] Responsive sidebar navigation
- [x] Family balance card
- [x] Colorful charts
- [x] Automatic insights
- [x] Stronger Framer Motion animations (validated after successful build on 2026-07-03)

## V2.2 Todo Completion (Validated after successful build on 2026-07-03)

- [x] Edit Income
- [x] Edit Expense
- [x] Delete Income
- [x] Delete Expense
- [x] User Avatar (upload + localStorage + fallback por iniciais)

## V2.3 Todo Completion (Validated after successful build on 2026-07-03)

- [x] PWA manifest atualizado para webmanifest
- [x] Pagina offline dedicada
- [x] Service worker com fallback offline e suporte a notificacoes locais
- [x] Registro PWA com captura de beforeinstallprompt
- [x] Busca de transacoes por descricao/categoria/usuario
- [x] Exportacao de relatorio PDF mensal
- [x] Bloco de relatorios mensais (mes atual vs anterior, economia e categorias)
- [x] Acao para ativar notificacoes e lembretes financeiros locais
