export function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function currentMonthYear() {
  const date = new Date();
  return { mes: date.getMonth() + 1, ano: date.getFullYear() };
}
