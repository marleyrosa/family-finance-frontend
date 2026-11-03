function csvCell(value) {
  return `"${String(value || "").replace(/"/g, '""')}"`;
}

function parsePdfTransactionLine(line) {
  const datePattern = /\b(?:\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?|\d{4}-\d{1,2}-\d{1,2})\b/;
  const amountPattern =
    /(?:R\$\s*)?[\[(]?\s*[-+]?\s*(?:\d{1,3}(?:\.\d{3})+,\d{2}|\d{1,3}(?:,\d{3})+\.\d{2}|\d+[,.]\d{2})\s*[\])]?(?:\s*[DC])?/gi;
  const dateMatch = line.match(datePattern);
  const amounts = [...line.matchAll(amountPattern)];

  if (!dateMatch && amounts.length === 0) {
    return null;
  }

  let description = line;
  if (dateMatch) {
    description = description.replace(dateMatch[0], " ");
  }
  if (amounts.length === 1) {
    description = description.replace(amounts[0][0], " ");
  }
  description = description.replace(/\s+/g, " ").trim();

  const amount = amounts.length === 1 ? amounts[0][0].trim() : "";
  const direction = /\bD\s*$/i.test(amount)
    ? "debito"
    : /\bC\s*$/i.test(amount)
      ? "credito"
      : "";

  return {
    date: dateMatch?.[0] || "00/00/0000",
    description,
    amount,
    direction,
  };
}

const NUBANK_MONTHS = {
  jan: "01",
  fev: "02",
  mar: "03",
  abr: "04",
  mai: "05",
  jun: "06",
  jul: "07",
  ago: "08",
  set: "09",
  out: "10",
  nov: "11",
  dez: "12",
};

function isNubankCardInvoice(lines) {
  const documentText = lines.join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return documentText.includes("nubank") && /fatura.{0,30}cartao|cartao.{0,30}fatura/.test(documentText);
}

function parseNubankInvoiceDate(line, defaultMonth) {
  const fullDate = line.match(/^\s*(\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?|\d{4}-\d{1,2}-\d{1,2})\b/);
  if (fullDate) {
    const raw = fullDate[1].replace(/\./g, "/");
    const dayMonth = raw.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (dayMonth) {
      return {
        date: `${defaultMonth.slice(0, 4)}-${String(dayMonth[2]).padStart(2, "0")}-${String(dayMonth[1]).padStart(2, "0")}`,
        raw: fullDate[0],
      };
    }

    const monthYear = raw.match(/^(\d{1,2})\/(\d{4})$/);
    if (monthYear) {
      return {
        date: `${monthYear[2]}-${String(monthYear[1]).padStart(2, "0")}-01`,
        raw: fullDate[0],
      };
    }

    return { date: raw, raw: fullDate[0] };
  }

  const namedMonth = line.match(/^\s*(\d{1,2})\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\.?\b/i);
  if (!namedMonth) {
    return null;
  }

  return {
    date: `${defaultMonth.slice(0, 4)}-${NUBANK_MONTHS[namedMonth[2].toLowerCase()]}-${String(namedMonth[1]).padStart(2, "0")}`,
    raw: namedMonth[0],
  };
}

function parseNubankInvoiceLine(line, defaultMonth) {
  const parsedDate = parseNubankInvoiceDate(line, defaultMonth);
  if (!parsedDate) {
    return null;
  }

  const normalizedLine = line.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const summaryLine =
    /total da fatura|valor total|pagamento minimo|valor minimo|limite disponivel|limite total|data de vencimento|vencimento da fatura/i.test(
      normalizedLine
    );
  if (summaryLine) {
    return null;
  }

  const amountPattern =
    /(?:R\$\s*)?[\[(]?\s*[-+]?\s*(?:\d{1,3}(?:\.\d{3})+,\d{2}|\d{1,3}(?:,\d{3})+\.\d{2}|\d+[,.]\d{2})\s*[\])]?(?:\s*[DC])?/gi;
  const amounts = [...line.matchAll(amountPattern)];
  let description = line.slice(parsedDate.raw.length).replace(/^[\s.:•-]+/, "").trim();
  if (amounts.length === 1) {
    description = description.replace(amounts[0][0], " ").replace(/\s+/g, " ").trim();
  }

  const normalizedDescription = description.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const requiresTypeReview =
    /\b(estorno|pagamento|credito|ajuste|devolucao|cancelamento)\b/i.test(normalizedDescription);
  const amount = amounts.length === 1
    ? amounts[0][0].replace(/R\$/gi, "").replace(/[\s()+-]/g, "").replace(/\s*[DC]$/i, "")
    : "";
  return {
    date: parsedDate.date,
    description,
    amount,
    direction: requiresTypeReview ? "" : "debito",
  };
}

function pdfLinesToCsv(lines, defaultMonth = "2000-01") {
  const nubankInvoice = isNubankCardInvoice(lines);
  const transactionLines = lines
    .map((line) => String(line || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((line) =>
      nubankInvoice
        ? parseNubankInvoiceLine(line, defaultMonth)
        : parsePdfTransactionLine(line)
    )
    .filter(Boolean);

  if (!transactionLines.length) {
    throw new Error(
      nubankInvoice
        ? "Nao encontramos compras reconheciveis na fatura Nubank. Confira se o PDF tem texto selecionavel e linhas de compras no formato esperado."
        : "Nao encontramos linhas com datas ou valores neste PDF. Use um extrato com texto selecionavel."
    );
  }
  if (transactionLines.length > 500) {
    throw new Error("O PDF excede o limite de 500 linhas candidatas. Divida o extrato em arquivos menores.");
  }

  return [
    ["date", "description", "amount", "type", "category"].map(csvCell).join(","),
    ...transactionLines.map((row) =>
      [row.date, row.description, row.amount, row.direction, ""].map(csvCell).join(",")
    ),
  ].join("\n");
}

function groupTextItems(items) {
  const lines = [];
  for (const item of items) {
    const text = typeof item.str === "string" ? item.str.trim() : "";
    if (!text) {
      continue;
    }

    const x = Number(item.transform?.[4]) || 0;
    const y = Number(item.transform?.[5]) || 0;
    let line = lines.find((candidate) => Math.abs(candidate.y - y) <= 2);
    if (!line) {
      line = { y, items: [] };
      lines.push(line);
    }
    line.items.push({ x, text });
  }

  return lines
    .sort((left, right) => right.y - left.y)
    .map((line) => line.items.sort((left, right) => left.x - right.x).map((item) => item.text).join(" "));
}

module.exports = { groupTextItems, isNubankCardInvoice, pdfLinesToCsv };
