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
- Sugestoes deterministicas para despesas pessoais sem categoria, incluindo Alimentacao, e alertas de variacao mensal
- Lancamento pessoal por texto com interpretacao local, categoria sugerida e confirmacao explicita antes de salvar
- Importacao local de CSV para financas familiares ou pessoais, com revisao por linha e alerta de possiveis duplicidades

### Lancamentos por texto

Na visao pessoal, digite uma frase como `Gastei 45 no almoco no cartao` e escolha **Preparar rascunho**. O navegador extrai um valor numerico, sugere tipo/categoria e preenche a competencia mensal; revise ou edite os campos e confirme para gravar usando os endpoints pessoais existentes. A interpretacao e deterministica e local, sem enviar a frase a um servico de IA.

Nada e persistido antes de **Confirmar e salvar**. A base atual guarda competencia mensal, nao data exata, conta ou cartao; esses dados nao sao inferidos nem gravados por esta primeira versao.

### Importar extrato CSV ou PDF

O painel compartilhado **Importar extrato CSV ou PDF** fica disponivel nas visoes de familia e pessoal. Escolha **Financas da familia** ou **Financas pessoais** antes de selecionar o destino. CSVs UTF-8 ou Windows-1252 aceitam ate 2 MB e 500 lancamentos, com cabecalho de descricao e valor (ou colunas de debito/credito); data, tipo e categoria sao opcionais. PDFs sao processados localmente pelo navegador, ate 10 MB, 20 paginas e 500 linhas candidatas. Paginas sem texto selecionavel podem usar OCR local em portugues, limitado a 5 paginas digitalizadas por arquivo. O worker, o modelo OCR em portugues e o PDF permanecem no dispositivo; nao ha envio dos documentos a servicos externos. O modelo fast de portugues vem do projeto [tessdata_fast](https://github.com/tesseract-ocr/tessdata_fast) e e distribuido sob Apache-2.0. Faturas Nubank de cartao tem reconhecimento dedicado para compras com data numerica ou mes abreviado. Arquivos protegidos por senha e layouts sem linhas de transacao reconheciveis nao sao suportados. Como os formatos de extrato variam, valores ambiguos ou linhas sem data ficam sinalizados para correcao na revisao.

O OCR pode confundir caracteres e valores; linhas lidas por OCR iniciam desmarcadas, exigem selecao individual e nao podem ser selecionadas em massa. Confira cada campo antes de importar. Os dados extraidos do PDF tambem podem nao corresponder perfeitamente as colunas originais; linhas com mais de um valor (por exemplo, valor da compra e saldo) exigem correcao manual. Na fatura Nubank, compras identificadas iniciam como despesas; pagamentos, estornos e ajustes exigem revisao explicita de tipo, e totais/resumos da fatura sao ignorados. Datas sem ano usam o ano do mes selecionado. Linhas sem direcao explicita tambem exigem confirmar receita ou despesa. As linhas ficam editaveis e nada e enviado ate **Confirmar e importar selecionados**. Para nao descartar revisoes, o destino fica bloqueado enquanto um arquivo estiver carregado; limpe-o para selecionar novamente.

Linhas sem direcao identificavel e possiveis duplicidades iniciam desmarcadas. A deteccao compara tipo, competencia mensal, valor e descricao normalizada; revise os avisos porque compras iguais podem ser legitimas. Para a familia, categorias pessoais com mapeamento direto (`Alimentacao` para `Supermercado`, `Moradia` para `Casa`, entre outras) sao adaptadas para as categorias familiares existentes; despesas sem equivalente exigem escolha manual. A descricao original e preservada no campo de comentario familiar. A importacao usa os endpoints existentes e pode ter sucesso parcial se a API falhar durante o lote.

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

## Edit/Delete Route Validation (Validated after successful build and deployed API checks on 2026-07-03)

- [x] Frontend URLs alinhadas com rotas deployadas (/expenses/{id} e /incomes/{id})
- [x] Refresh do dashboard apos edit/delete
- [x] Verificacao: Edit Income
- [x] Verificacao: Edit Expense
- [x] Verificacao: Delete Income
- [x] Verificacao: Delete Expense
