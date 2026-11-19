const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const formatCurrency = (value) => currency.format(value);
export const formatDateTime = (iso) => dateTime.format(new Date(iso));

// Aceita "12,50" ou "12.50" e devolve número (ou NaN).
export function parsePrice(text) {
  const normalized = String(text).trim().replace(",", ".");
  return normalized === "" ? NaN : Number(normalized);
}

// Dono do produto ou ADMIN (complementa, nunca substitui, as regras do backend).
export const canManage = (product, user) => user?.role === "ADMIN" || product.ownerId === user?.id;
