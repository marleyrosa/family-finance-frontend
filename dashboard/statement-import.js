const PERSONAL_CATEGORIES = [
  "Moradia",
  "Alimentacao",
  "Lazer",
  "Saude",
  "Transporte",
  "Educacao",
  "Assinaturas",
  "Outros",
];
const FAMILY_CATEGORIES = [
  "Supermercado",
  "Saude",
  "Transporte",
  "Serviços",
  "Casa",
  "Tecnologia",
  "Pessoal",
  "Gastos fixo",
];
const PERSONAL_TO_FAMILY_CATEGORY = {
  moradia: "Casa",
  alimentacao: "Supermercado",
  saude: "Saude",
  transporte: "Transporte",
};

const HEADER_ALIASES = {
  description: ["descricao", "descricao do lancamento", "historico", "historico do lancamento", "lancamento", "estabelecimento", "description", "memo", "details"],
  amount: ["valor", "valor r", "amount", "value", "quantia"],
  date: ["data", "data transacao", "data da transacao", "data do lancamento", "date", "transaction date", "competencia", "mes"],
  type: ["tipo", "natureza", "operacao", "tipo lancamento", "tipo transacao", "type", "transaction type"],
  category: ["categoria", "category"],
  debit: ["debito", "debit", "saida", "saidas"],
  credit: ["credito", "credit", "entrada", "entradas"],
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const normalizeHeader = (value) =>
  normalizeText(value)
    .replace(/^\uFEFF/, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function detectDelimiter(text) {
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0] || "";
  let quoted = false;
  const counts = { ";": 0, ",": 0, "\t": 0 };
  for (let index = 0; index < firstLine.length; index += 1) {
    if (firstLine[index] === '"' && firstLine[index + 1] === '"') {
      index += 1;
    } else if (firstLine[index] === '"') {
      quoted = !quoted;
    } else if (!quoted && Object.hasOwn(counts, firstLine[index])) {
      counts[firstLine[index]] += 1;
    }
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function parseCsvRows(text, delimiter) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === delimiter) {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      row.push(cell);
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
      cell = "";
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
    } else {
      cell += character;
    }
  }

  if (quoted) {
    throw new Error("O CSV tem aspas sem fechamento.");
  }
  row.push(cell);
  if (row.some((value) => value.trim())) {
    rows.push(row);
  }
  return rows;
}

function resolveHeaders(headerRow) {
  const normalized = headerRow.map(normalizeHeader);
  const indexes = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    indexes[field] = normalized.findIndex((header) => aliases.includes(header));
  }
  if (indexes.description < 0 || (indexes.amount < 0 && indexes.debit < 0 && indexes.credit < 0)) {
    throw new Error("O CSV precisa ter colunas de descricao e valor (ou debito/credito).");
  }
  return indexes;
}

function parseMoney(value) {
  let normalized = String(value || "")
    .replace(/R\$/gi, "")
    .replace(/\s/g, "")
    .replace(/[^\d,().+-]/g, "");
  if (!normalized) {
    return null;
  }

  let negative = normalized.startsWith("-") || (normalized.startsWith("(") && normalized.endsWith(")"));
  normalized = normalized.replace(/[()]/g, "").replace(/^[+-]/, "");
  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    const decimals = normalized.length - lastComma - 1;
    normalized = decimals > 0 && decimals <= 2
      ? normalized.replace(/\./g, "").replace(",", ".")
      : normalized.replace(/,/g, "");
  } else if (lastDot >= 0 && normalized.length - lastDot - 1 > 2) {
    normalized = normalized.replace(/\./g, "");
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount)) {
    return null;
  }
  return negative ? -Math.abs(amount) : amount;
}

function parseCompetence(value, defaultMonth) {
  const raw = String(value || "").trim();
  if (!raw) {
    return { competence: defaultMonth, inferred: true };
  }

  let match = raw.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) {
      return { competence: `${year}-${String(month).padStart(2, "0")}`, inferred: false };
    }
  }

  match = raw.match(/^(\d{1,2})[/. -](\d{1,2})(?:[/. -](\d{2,4}))?$/);
  if (match) {
    const month = Number(match[2]);
    let year = Number(match[3] || defaultMonth.slice(0, 4));
    if (year < 100) {
      year += year >= 70 ? 1900 : 2000;
    }
    if (month >= 1 && month <= 12) {
      return { competence: `${year}-${String(month).padStart(2, "0")}`, inferred: false };
    }
  }

  match = raw.match(/^(\d{1,2})[/. -](\d{4})$/);
  if (match) {
    const month = Number(match[1]);
    if (month >= 1 && month <= 12) {
      return { competence: `${Number(match[2])}-${String(month).padStart(2, "0")}`, inferred: false };
    }
  }
  return { competence: defaultMonth, inferred: true, invalid: true };
}

function inferType(rawType, amount, hasTypeColumn) {
  const type = normalizeText(rawType);
  if (/\b(receita|credito|credit|entrada|deposito|salario|recebido)\b/.test(type)) {
    return { type: "income", needsReview: false };
  }
  if (/\b(despesa|debito|debit|saida|compra|pagamento|enviado)\b/.test(type)) {
    return { type: "expense", needsReview: false };
  }
  if (amount < 0) {
    return { type: "expense", needsReview: false };
  }
  return { type: "expense", needsReview: hasTypeColumn || !rawType };
}

function categoryValue(rawCategory) {
  const normalized = normalizeText(rawCategory);
  return PERSONAL_CATEGORIES.find((category) => normalizeText(category) === normalized) || "Outros";
}

function familyCategoryValue(rawCategory, personalCategory) {
  const normalized = normalizeText(rawCategory);
  const directMatch = FAMILY_CATEGORIES.find((category) => normalizeText(category) === normalized);
  if (directMatch) {
    return { category: directMatch, needsReview: false };
  }

  const mappedCategory = PERSONAL_TO_FAMILY_CATEGORY[normalizeText(personalCategory)];
  if (mappedCategory) {
    return { category: mappedCategory, needsReview: false };
  }

  return { category: "Pessoal", needsReview: true };
}

function transactionSignature(transaction) {
  const description = normalizeText(transaction.description).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return [
    transaction.type,
    transaction.competence || String(transaction.competencia || "").slice(0, 7),
    Number(transaction.amount).toFixed(2),
    description,
  ].join("|");
}

function parseStatementCsv(text, defaultMonth, existingTransactions = [], target = "personal") {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("O arquivo CSV esta vazio.");
  }

  const rows = parseCsvRows(text.replace(/^\uFEFF/, ""), detectDelimiter(text));
  if (rows.length < 2) {
    throw new Error("O CSV precisa ter um cabecalho e ao menos uma linha de lancamento.");
  }
  if (rows.length - 1 > 500) {
    throw new Error("O CSV excede o limite de 500 lancamentos por importacao.");
  }

  const headers = resolveHeaders(rows[0]);
  const existingSignatures = new Set(
    existingTransactions.map((transaction) => transactionSignature(transaction))
  );
  const importedSignatures = new Set();

  return rows.slice(1).map((cells, index) => {
    const valueAt = (field) => (headers[field] >= 0 ? String(cells[headers[field]] || "").trim() : "");
    const description = valueAt("description").slice(0, 255);
    const parsedDate = parseCompetence(valueAt("date"), defaultMonth);
    const separateAmounts = headers.debit >= 0 || headers.credit >= 0;
    const debitAmount = headers.debit >= 0 ? Math.abs(parseMoney(valueAt("debit")) || 0) : 0;
    const creditAmount = headers.credit >= 0 ? Math.abs(parseMoney(valueAt("credit")) || 0) : 0;
    const rawAmount = separateAmounts ? creditAmount || debitAmount : parseMoney(valueAt("amount"));
    const amount = rawAmount === null ? null : Math.abs(rawAmount);
    const rawType = valueAt("type");
    const rawCategory = valueAt("category");
    const category = categoryValue(rawCategory);
    const familyCategory = familyCategoryValue(rawCategory, category);
    const detectedType = separateAmounts
      ? { type: creditAmount > 0 ? "income" : "expense", needsReview: false }
      : inferType(rawType, rawAmount || 0, headers.type >= 0);
    const issue = !description
      ? "Descricao ausente."
      : amount === null || amount <= 0
        ? "Valor ausente ou invalido."
        : parsedDate.invalid
          ? "Data invalida; confira a competencia."
          : "";

    const transaction = {
      rowNumber: index + 2,
      description,
      amount: amount === null ? "" : String(amount),
      type: detectedType.type,
      category,
      familyCategory: familyCategory.category,
      familyCategoryNeedsReview: detectedType.type === "expense" && familyCategory.needsReview,
      categoryWasInferred:
        !rawCategory ||
        (categoryValue(rawCategory) === "Outros" && normalizeText(rawCategory) !== "outros"),
      competence: parsedDate.competence,
      competenceWasInferred: parsedDate.inferred,
      typeNeedsReview: detectedType.needsReview,
      issue,
      selected: !issue && !detectedType.needsReview && !(target === "family" && detectedType.type === "expense" && familyCategory.needsReview),
      imported: false,
      importError: "",
      possibleDuplicate: false,
      duplicateReason: "",
    };

    if (!issue) {
      const signature = transactionSignature(transaction);
      if (existingSignatures.has(signature)) {
        transaction.possibleDuplicate = true;
        transaction.duplicateReason = "Ja existe um lancamento semelhante.";
      } else if (importedSignatures.has(signature)) {
        transaction.possibleDuplicate = true;
        transaction.duplicateReason = "Esta linha repete outro lancamento do proprio arquivo.";
      }
      if (transaction.possibleDuplicate) {
        transaction.selected = false;
      }
      importedSignatures.add(signature);
    }

    return transaction;
  });
}

module.exports = { FAMILY_CATEGORIES, PERSONAL_CATEGORIES, parseStatementCsv, transactionSignature };
