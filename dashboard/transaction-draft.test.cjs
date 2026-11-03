const test = require("node:test");
const assert = require("node:assert/strict");
const { parseTransactionDraft } = require("./transaction-draft");

const now = new Date("2026-10-31T12:00:00");

test("parses a Brazilian-real expense without saving it", () => {
  const draft = parseTransactionDraft("Gastei R$ 1.234,56 no almoço no cartão", {
    defaultMonth: "2026-10",
    now,
  });

  assert.deepEqual(draft, {
    type: "expense",
    description: "Almoço",
    amount: "1234.56",
    category: "Lazer",
    competence: "2026-10",
    categoryWasSuggested: true,
  });
});

test("recognizes income, an explicit month, and keeps unknown categories reviewable", () => {
  const draft = parseTransactionDraft("Recebi 3500 de trabalho em setembro", {
    defaultMonth: "2026-10",
    now,
  });

  assert.equal(draft.type, "income");
  assert.equal(draft.amount, "3500");
  assert.equal(draft.category, "Outros");
  assert.equal(draft.competence, "2026-09");
  assert.equal(draft.categoryWasSuggested, false);
});

test("suggests the personal food category for a supermarket expense", () => {
  const draft = parseTransactionDraft("Gastei 230 no supermercado", {
    defaultMonth: "2026-10",
    now,
  });

  assert.equal(draft.category, "Alimentacao");
  assert.equal(draft.description, "Supermercado");
});

test("rejects phrases without a numeric amount", () => {
  assert.throws(
    () => parseTransactionDraft("Gastei no almoço", { defaultMonth: "2026-10", now }),
    /Nao encontrei um valor/
  );
});
