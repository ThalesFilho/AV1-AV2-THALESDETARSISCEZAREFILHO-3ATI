// Validação escrita à mão. Cada validador recebe os dados brutos e devolve
// { value, errors }: "value" são os dados já limpos; "errors" mapeia campo -> mensagens.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isObject(data) {
  return data !== null && typeof data === "object" && !Array.isArray(data);
}

// Pequeno construtor de erros por campo.
function newErrors() {
  const errors = {};
  return { errors, add: (field, message) => (errors[field] ??= []).push(message) };
}

function validateText(data, field, label, max, e, required = true) {
  const raw = data[field];
  if (raw === undefined && !required) return undefined;
  if (typeof raw !== "string" || raw.trim() === "") {
    e.add(field, `${label} é obrigatório.`);
    return undefined;
  }
  if (raw.trim().length > max) e.add(field, `${label} deve ter no máximo ${max} caracteres.`);
  return raw.trim();
}

function validatePrice(data, e, required = true) {
  const n = data.unitPrice;
  if (n === undefined && !required) return undefined;
  if (typeof n !== "number" || !Number.isFinite(n)) {
    e.add("unitPrice", "Preço deve ser um número.");
    return undefined;
  }
  if (n < 0) e.add("unitPrice", "Preço não pode ser negativo.");
  else if (n > 99999999.99) e.add("unitPrice", "Preço muito alto.");
  else if (Math.abs(Math.round(n * 100) - n * 100) > 1e-6) e.add("unitPrice", "Preço deve ter no máximo 2 casas decimais.");
  return n;
}

function validateMinStock(data, e, required = true) {
  const n = data.minStock;
  if (n === undefined) return required ? 0 : undefined; // padrão 0 na criação
  if (typeof n !== "number" || !Number.isInteger(n)) e.add("minStock", "Estoque mínimo deve ser um número inteiro.");
  else if (n < 0) e.add("minStock", "Estoque mínimo não pode ser negativo.");
  else if (n > 1000000000) e.add("minStock", "Estoque mínimo muito alto.");
  return n;
}

function finish(e, value) {
  return { value, errors: e.errors };
}

export function validateId(params) {
  const e = newErrors();
  // No máximo 9 dígitos para caber em um INT do banco.
  if (!/^\d{1,9}$/.test(params.id ?? "")) e.add("id", "O id deve ser um número inteiro positivo.");
  return finish(e, { id: Number(params.id) });
}

export function validateRegister(data) {
  const e = newErrors();
  if (!isObject(data)) data = {};
  const name = validateText(data, "name", "Nome", 120, e);
  let email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (!EMAIL_REGEX.test(email) || email.length > 190) {
    e.add("email", "E-mail inválido.");
    email = undefined;
  }
  const password = data.password;
  if (typeof password !== "string" || password.length < 8) e.add("password", "A senha deve ter pelo menos 8 caracteres.");
  else if (password.length > 100) e.add("password", "A senha deve ter no máximo 100 caracteres.");
  return finish(e, { name, email, password });
}

export function validateLogin(data) {
  const e = newErrors();
  if (!isObject(data)) data = {};
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (!EMAIL_REGEX.test(email)) e.add("email", "E-mail inválido.");
  if (typeof data.password !== "string" || data.password === "") e.add("password", "Senha é obrigatória.");
  return finish(e, { email, password: data.password });
}

export function validateCreateProduct(data) {
  const e = newErrors();
  if (!isObject(data)) data = {};
  const name = validateText(data, "name", "Nome", 150, e);
  const sku = validateText(data, "sku", "SKU", 60, e)?.toUpperCase();
  const category = validateText(data, "category", "Categoria", 80, e);
  const unitPrice = validatePrice(data, e);
  const minStock = validateMinStock(data, e);
  return finish(e, { name, sku, category, unitPrice, minStock });
}

// "quantity" nunca é editado direto: qualquer campo fora da lista é recusado.
export function validateUpdateProduct(data) {
  const e = newErrors();
  if (!isObject(data)) data = {};
  const allowed = ["name", "sku", "category", "unitPrice", "minStock"];
  for (const key of Object.keys(data)) {
    if (!allowed.includes(key)) {
      e.add(key, "Campo não permitido. O estoque (quantity) só pode ser alterado por movimentações.");
    }
  }
  const value = {};
  const name = validateText(data, "name", "Nome", 150, e, false);
  if (name !== undefined) value.name = name;
  const sku = validateText(data, "sku", "SKU", 60, e, false);
  if (sku !== undefined) value.sku = sku.toUpperCase();
  const category = validateText(data, "category", "Categoria", 80, e, false);
  if (category !== undefined) value.category = category;
  const unitPrice = validatePrice(data, e, false);
  if (unitPrice !== undefined) value.unitPrice = unitPrice;
  const minStock = validateMinStock(data, e, false);
  if (minStock !== undefined) value.minStock = minStock;
  if (Object.keys(e.errors).length === 0 && Object.keys(value).length === 0) {
    e.add("_", "Envie pelo menos um campo para atualizar.");
  }
  return finish(e, value);
}

export function validateListQuery(query) {
  const e = newErrors();
  const search = typeof query.search === "string" ? query.search.trim() : undefined;
  let lowStock = false;
  if (query.lowStock !== undefined) {
    if (query.lowStock === "true") lowStock = true;
    else if (query.lowStock !== "false") e.add("lowStock", "lowStock deve ser true ou false.");
  }
  return finish(e, { search, lowStock });
}

export function validateMovement(data) {
  const e = newErrors();
  if (!isObject(data)) data = {};
  if (data.type !== "ENTRY" && data.type !== "EXIT") e.add("type", "Tipo deve ser ENTRY ou EXIT.");
  const q = data.quantity;
  if (typeof q !== "number" || !Number.isInteger(q)) e.add("quantity", "Quantidade deve ser um número inteiro.");
  else if (q < 1) e.add("quantity", "Quantidade mínima é 1.");
  else if (q > 1000000) e.add("quantity", "Quantidade máxima é 1000000.");
  let note;
  if (data.note !== undefined && data.note !== null) {
    if (typeof data.note !== "string") e.add("note", "Observação deve ser um texto.");
    else if (data.note.trim().length > 300) e.add("note", "Observação deve ter no máximo 300 caracteres.");
    else note = data.note.trim() || undefined;
  }
  return finish(e, { type: data.type, quantity: q, note });
}
