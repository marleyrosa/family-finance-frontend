const test = require("node:test");
const assert = require("node:assert/strict");
const { groupTextItems, pdfLinesToCsv } = require("./statement-pdf");
const { parseStatementCsv } = require("./statement-import");

test("extracts dated PDF rows and keeps ambiguous direction for manual review", () => {
  const csv = pdfLinesToCsv([
    "15/10/2026 MERCADO CENTRAL -45,90",
    "16/10/2026 PAGAMENTO CARTAO 120,00 D",
    "17/10/2026 SALARIO 3500,00 C",
  ]);
  const rows = parseStatementCsv(csv, "2026-10", [], "personal");

  assert.equal(rows[0].description, "MERCADO CENTRAL");
  assert.equal(rows[0].amount, "45.9");
  assert.equal(rows[0].type, "expense");
  assert.equal(rows[1].type, "expense");
  assert.equal(rows[1].typeNeedsReview, false);
  assert.equal(rows[2].type, "income");
  assert.equal(rows[2].typeNeedsReview, false);
});

test("keeps Brazilian and US-style thousands separators as one amount", () => {
  const rows = parseStatementCsv(
    pdfLinesToCsv([
      "15/10/2026 COMPRA NACIONAL 1.234,56",
      "16/10/2026 FOREIGN PURCHASE 1,234.56",
    ]),
    "2026-10"
  );

  assert.equal(rows[0].amount, "1234.56");
  assert.equal(rows[1].amount, "1234.56");
});

test("keeps candidate lines with ambiguous amounts or missing dates visible for review", () => {
  const rows = parseStatementCsv(
    pdfLinesToCsv([
      "15/10/2026 LOJA 45,90 300,00",
      "Transferencia sem data 20,00",
    ]),
    "2026-10"
  );

  assert.equal(rows.length, 2);
  assert.match(rows[0].issue, /Valor ausente ou invalido/);
  assert.match(rows[0].description, /45,90 300,00/);
  assert.match(rows[1].issue, /Data invalida/);
});

test("recognizes Nubank credit card invoices and excludes invoice totals", () => {
  const csv = pdfLinesToCsv([
    "Nubank",
    "Fatura do cartão de crédito",
    "Data Estabelecimento Valor",
    "15 out. MERCADO CENTRAL R$ 45,90",
    "16 out. STREAMING SERVICE 20,00",
    "Total da fatura 65,90",
    "Pagamento mínimo 6,50",
  ], "2026-10");
  const rows = parseStatementCsv(csv, "2026-10", [], "personal");

  assert.equal(rows.length, 2);
  assert.equal(rows[0].description, "MERCADO CENTRAL");
  assert.equal(rows[0].amount, "45.9");
  assert.equal(rows[0].competence, "2026-10");
  assert.equal(rows[0].selected, true);
  assert.equal(rows[1].description, "STREAMING SERVICE");
  assert.equal(rows[1].selected, true);
});

test("keeps Nubank invoice payments and refunds for explicit type review", () => {
  const rows = parseStatementCsv(
    pdfLinesToCsv([
      "Nubank",
      "Fatura do cartão de crédito",
      "15 out. ESTORNO LOJA 25,00",
      "16 out. PAGAMENTO RECEBIDO 100,00",
    ], "2026-10"),
    "2026-10",
    [],
    "personal"
  );

  assert.equal(rows[0].typeNeedsReview, true);
  assert.equal(rows[0].selected, false);
  assert.equal(rows[1].typeNeedsReview, true);
  assert.equal(rows[1].selected, false);
});

test("supports Nubank invoices with numeric dates and keeps multiple amounts unselected", () => {
  const rows = parseStatementCsv(
    pdfLinesToCsv([
      "Nubank",
      "Fatura do cartão de crédito",
      "15/10 COMPRA MERCADO 1.234,56",
      "16/10 COMPRA PARCELADA 50,00 SALDO 100,00",
    ], "2026-10"),
    "2026-10",
    [],
    "family"
  );

  assert.equal(rows[0].amount, "1234.56");
  assert.equal(rows[0].familyCategoryNeedsReview, true);
  assert.match(rows[1].issue, /Valor ausente ou invalido/);
  assert.equal(rows[1].selected, false);
});

test("groups PDF text items by visual row and orders each row by horizontal position", () => {
  const lines = groupTextItems([
    { str: "45,90", transform: [1, 0, 0, 1, 300, 700] },
    { str: "MERCADO", transform: [1, 0, 0, 1, 100, 700] },
    { str: "15/10/2026", transform: [1, 0, 0, 1, 20, 700] },
    { str: "SALARIO", transform: [1, 0, 0, 1, 100, 680] },
  ]);

  assert.deepEqual(lines, ["15/10/2026 MERCADO 45,90", "SALARIO"]);
});

test("rejects PDFs with no recognizable rows and more than 500 candidates", () => {
  assert.throws(() => pdfLinesToCsv(["Extrato sem linhas"]), /Nao encontramos linhas/);
  assert.throws(() => pdfLinesToCsv(Array.from({ length: 501 }, (_, index) => `${index + 1},00`)), /500 linhas/);
});
