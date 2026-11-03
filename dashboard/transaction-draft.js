const CATEGORY_KEYWORDS = [
  ["Moradia", /\b(aluguel|condominio|energia|eletricidade|agua|gas|internet|casa|reforma)\b/],
  ["Saude", /\b(farmacia|remedio|consulta|medico|dentista|exame|saude)\b/],
  ["Transporte", /\b(uber|combustivel|gasolina|onibus|metro|estacionamento|transporte)\b/],
  ["Educacao", /\b(curso|escola|faculdade|livro|educacao)\b/],
  ["Assinaturas", /\b(netflix|spotify|prime|disney|assinatura|streaming)\b/],
  ["Alimentacao", /\b(supermercado|mercadinho|hortifruti|acougue|feira|mercearia|padaria|quitanda)\b/],
  ["Lazer", /\b(almoco|jantar|lanche|restaurante|cinema|bar|show|viagem|passeio|delivery|ifood)\b/],
];

const MONTH_NAMES = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const parseAmount = (value) => {
  const normalized = value.replace(/\s/g, "").replace(/\.(?=\d{3}(?:,|$))/g, "").replace(",", ".");
  return Number(normalized);
};

const detectCompetence = (normalized, defaultMonth, now) => {
  const currentYear = now.getFullYear();
  const explicitYear = normalized.match(/\b(20\d{2})\b/);
  const year = explicitYear ? Number(explicitYear[1]) : currentYear;
  const namedMonth = Object.entries(MONTH_NAMES).find(([name]) =>
    new RegExp(`\\b(?:em|no mes de|mes de)\\s+${name}\\b`).test(normalized)
  );
  const numericMonth = normalized.match(/\b(?:em|no mes de|mes de)\s+(0?[1-9]|1[0-2])(?:\/20\d{2})?\b/);
  const month = namedMonth
    ? namedMonth[1]
    : numericMonth
      ? Number(numericMonth[1])
      : /\bmes passado\b/.test(normalized)
        ? (Number(defaultMonth.slice(5, 7)) === 1 ? 12 : Number(defaultMonth.slice(5, 7)) - 1)
        : Number(defaultMonth.slice(5, 7));
  const resolvedYear =
    !explicitYear && /\bmes passado\b/.test(normalized) && month === 12 && Number(defaultMonth.slice(5, 7)) === 1
      ? Number(defaultMonth.slice(0, 4)) - 1
      : year;

  return `${resolvedYear}-${String(month).padStart(2, "0")}`;
};

const buildDescription = (input, amountMatch) => {
  let description = input.replace(amountMatch[0], " ");
  description = description.replace(
    /^\s*(?:(?:eu\s+)?(?:gastei|gasto|paguei|pago|comprei|recebi|ganhei|vendi|lancei|registrei)\s+)/i,
    ""
  );
  description = description
    .replace(/\b(?:no|na|pelo|pela)\s+(?:cart[aã]o|cr[eé]dito|d[eé]bito|pix|dinheiro)\b/gi, " ")
    .replace(/\b(?:cart[aã]o|cr[eé]dito|d[eé]bito|pix|dinheiro)\b/gi, " ")
    .replace(/\b(?:em|no mes de|mes de)\s+(?:janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|0?[1-9]|1[0-2])\b/gi, " ")
    .replace(/\b20\d{2}\b/g, " ")
    .replace(/^\s*(?:no|na|de|do|da|com|para)\s+/i, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, "")
    .trim();

  if (!description) {
    return "Lancamento pessoal";
  }
  return description.charAt(0).toLocaleUpperCase("pt-BR") + description.slice(1);
};

function parseTransactionDraft(input, { defaultMonth, now = new Date() } = {}) {
  const source = String(input || "").trim();
  const normalized = normalizeText(source);
  const amountMatch = source.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[,.]\d{1,2})?)/i);

  if (!amountMatch) {
    throw new Error("Nao encontrei um valor. Digite o valor em numeros, por exemplo: 45,90.");
  }

  const amount = parseAmount(amountMatch[1]);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("O valor precisa ser maior que zero.");
  }

  const categoryMatch = CATEGORY_KEYWORDS.find(([, pattern]) => pattern.test(normalized));
  const type = /\b(recebi|receita|salario|ganhei|renda|vendi)\b/.test(normalized) ? "income" : "expense";

  return {
    type,
    description: buildDescription(source, amountMatch),
    amount: String(amount),
    category: categoryMatch?.[0] || "Outros",
    competence: detectCompetence(normalized, defaultMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, now),
    categoryWasSuggested: Boolean(categoryMatch),
  };
}

module.exports = { parseTransactionDraft };
