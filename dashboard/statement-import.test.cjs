const test = require("node:test");
const assert = require("node:assert/strict");
const { parseStatementCsv } = require("./statement-import");

test("parses a semicolon-delimited Brazilian statement with dates and signed amounts", () => {
  const rows = parseStatementCsv(
    'Data;Descricao;Valor;Tipo;Categoria\r\n15/10/2026;"Padaria, Centro";-18,50;Debito;Alimentacao\r\n20/10/2026;Salario;3500,00;Credito;Outros',
    "2026-10"
  );

  assert.equal(rows[0].description, "Padaria, Centro");
  assert.equal(rows[0].amount, "18.5");
  assert.equal(rows[0].type, "expense");
  assert.equal(rows[0].competence, "2026-10");
  assert.equal(rows[0].category, "Alimentacao");
  assert.equal(rows[1].type, "income");
  assert.equal(rows[1].selected, true);
});

test("parses debit and credit columns and quoted multiline descriptions", () => {
  const rows = parseStatementCsv(
    'Data da transacao,Descricao do lancamento,Debito,Credito\n2026-10-15,"Loja,\nCentro",12.35,\n2026-10-16,Pagamento,,500.00',
    "2026-10"
  );

  assert.equal(rows[0].description, "Loja,\nCentro");
  assert.equal(rows[0].amount, "12.35");
  assert.equal(rows[0].type, "expense");
  assert.equal(rows[1].amount, "500");
  assert.equal(rows[1].type, "income");
});

test("marks matches already registered and repeated rows as possible duplicates", () => {
  const rows = parseStatementCsv(
    "date,description,amount,type\n2026-10-15,Cafe,-12.5,debit\n2026-10-15,Cafe,-12.50,debit",
    "2026-10",
    [{ type: "expense", description: "Café", amount: 12.5, competencia: "2026-10-01" }]
  );

  assert.equal(rows[0].possibleDuplicate, true);
  assert.equal(rows[0].selected, false);
  assert.equal(rows[1].possibleDuplicate, true);
  assert.equal(rows[1].selected, false);
});

test("detects existing personal records using the stored competence field", () => {
  const [row] = parseStatementCsv(
    "date,description,amount,type\n2026-10-15,Cafe,-12.5,debit",
    "2026-10",
    [{ type: "expense", description: "Cafe", amount: 12.5, competencia: "2026-10-01" }]
  );

  assert.equal(row.possibleDuplicate, true);
});

test("maps compatible categories and requires review for family-only categories", () => {
  const rows = parseStatementCsv(
    "date,description,amount,type,category\n2026-10-15,Feira,-80,debit,Alimentacao\n2026-10-16,Cinema,-40,debit,Lazer",
    "2026-10",
    [],
    "family"
  );

  assert.equal(rows[0].familyCategory, "Supermercado");
  assert.equal(rows[0].familyCategoryNeedsReview, false);
  assert.equal(rows[0].selected, true);
  assert.equal(rows[1].familyCategoryNeedsReview, true);
  assert.equal(rows[1].selected, false);
});

test("detects existing family records by their stored comment", () => {
  const [row] = parseStatementCsv(
    "date,description,amount,type,category\n2026-10-15,Feira,-80,debit,Alimentacao",
    "2026-10",
    [{ type: "expense", description: "Feira", amount: 80, competencia: "2026-10-01" }],
    "family"
  );

  assert.equal(row.possibleDuplicate, true);
  assert.equal(row.selected, false);
});

test("requires explicit review when positive values have no transaction direction", () => {
  const [row] = parseStatementCsv("description,amount\nTransferencia,150.00", "2026-10");

  assert.equal(row.typeNeedsReview, true);
  assert.equal(row.selected, false);
});

test("reports invalid dates and missing values as row issues", () => {
  const rows = parseStatementCsv(
    "data,descricao,valor\n31/99/2026,Compra,20\n01/10/2026,,",
    "2026-10"
  );

  assert.match(rows[0].issue, /Data invalida/);
  assert.match(rows[1].issue, /Descricao ausente/);
  assert.equal(rows.every((row) => !row.selected), true);
});

test("rejects CSV without the required headers", () => {
  assert.throws(() => parseStatementCsv("x,y\n1,2", "2026-10"), /descricao e valor/);
});
