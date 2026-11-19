// Smoke test da API EstoqueFácil. Só usa Node puro (fetch nativo), sem dependências.
//
// Uso:  node tools/smoke-test.mjs
// Variáveis opcionais:
//   BASE_URL        (padrão http://localhost:3000)
//   ADMIN_EMAIL / ADMIN_PASSWORD   habilita os cenários de ADMIN
//   JWT_SECRET      habilita o cenário de token expirado (assina um token vencido)
import crypto from "node:crypto";

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "") + "/api";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

const run = Date.now().toString(36);
const results = [];
const createdProducts = []; // { id, token } para limpeza no final

async function api(method, path, { token, body, raw } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* resposta sem JSON */ }
  return { status: res.status, body: json };
}

async function scenario(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false });
    console.log(`FAIL  ${name}\n      -> ${err.message}`);
  }
}
function check(cond, msg) { if (!cond) throw new Error(msg); }
function expectStatus(res, status, code) {
  check(res.status === status, `esperado HTTP ${status}, veio ${res.status} (${JSON.stringify(res.body)})`);
  if (code) check(res.body?.error?.code === code, `esperado código ${code}, veio ${res.body?.error?.code}`);
}

async function newProduct(token, overrides = {}) {
  const res = await api("POST", "/products", {
    token,
    body: { name: "Produto " + run, sku: "sku-" + run + "-" + Math.random().toString(36).slice(2, 7), category: "Teste", unitPrice: 10.5, minStock: 2, ...overrides },
  });
  check(res.status === 201, `criar produto falhou: ${res.status} ${JSON.stringify(res.body)}`);
  createdProducts.push({ id: res.body.product.id, token });
  return res.body.product;
}

const pwd = "SenhaForte123";
const userA = { name: "Usuário A", email: `a.${run}@teste.com`, password: pwd };
const userB = { name: "Usuário B", email: `b.${run}@teste.com`, password: pwd };
let tokenA, tokenB, tokenAdmin, idA, idB;

console.log(`Smoke test em ${BASE}\n`);

await scenario("health responde 200", async () => {
  const r = await api("GET", "/health");
  expectStatus(r, 200);
  check(r.body.status === "ok", "status deveria ser ok");
});

await scenario("registro cria usuário USER (201) sem expor senha", async () => {
  const r = await api("POST", "/auth/register", { body: { ...userA, role: "ADMIN" } });
  expectStatus(r, 201);
  check(r.body.user.role === "USER", "o papel deve ser sempre USER");
  check(!("passwordHash" in r.body.user) && !("password" in r.body.user), "não pode vazar senha");
  idA = r.body.user.id;
  const r2 = await api("POST", "/auth/register", { body: userB });
  expectStatus(r2, 201);
  idB = r2.body.user.id;
});

await scenario("registro com e-mail duplicado => 409 CONFLICT", async () => {
  expectStatus(await api("POST", "/auth/register", { body: { ...userA, email: userA.email.toUpperCase() } }), 409, "CONFLICT");
});

await scenario("registro com senha curta => 400 VALIDATION_ERROR", async () => {
  const r = await api("POST", "/auth/register", { body: { name: "X", email: `c.${run}@teste.com`, password: "123" } });
  expectStatus(r, 400, "VALIDATION_ERROR");
  check(r.body.error.details?.password, "details deve apontar o campo password");
});

await scenario("registro com e-mail inválido => 400 VALIDATION_ERROR", async () => {
  const r = await api("POST", "/auth/register", { body: { name: "X", email: "nao-e-email", password: pwd } });
  expectStatus(r, 400, "VALIDATION_ERROR");
  check(r.body.error.details?.email, "details deve apontar o campo email");
});

await scenario("JSON malformado => 400", async () => {
  expectStatus(await api("POST", "/auth/login", { raw: "{oops", body: {} }), 400, "VALIDATION_ERROR");
});

await scenario("login correto => 200 com token", async () => {
  const r = await api("POST", "/auth/login", { body: { email: userA.email, password: pwd } });
  expectStatus(r, 200);
  check(typeof r.body.token === "string" && r.body.token.split(".").length === 3, "token JWT esperado");
  tokenA = r.body.token;
  const rb = await api("POST", "/auth/login", { body: { email: userB.email, password: pwd } });
  tokenB = rb.body.token;
  const me = await api("GET", "/auth/me", { token: tokenA });
  expectStatus(me, 200);
  check(me.body.user.email === userA.email, "/auth/me deve devolver o usuário logado");
});

await scenario("login errado => 401 INVALID_CREDENTIALS (mensagem genérica)", async () => {
  const r1 = await api("POST", "/auth/login", { body: { email: userA.email, password: "senhaerrada1" } });
  const r2 = await api("POST", "/auth/login", { body: { email: `naoexiste.${run}@teste.com`, password: "senhaerrada1" } });
  expectStatus(r1, 401, "INVALID_CREDENTIALS");
  expectStatus(r2, 401, "INVALID_CREDENTIALS");
  check(r1.body.error.message === r2.body.error.message, "mensagens devem ser idênticas");
});

await scenario("rota protegida sem token => 401 UNAUTHENTICATED", async () => {
  expectStatus(await api("GET", "/products"), 401, "UNAUTHENTICATED");
  expectStatus(await api("GET", "/auth/me"), 401, "UNAUTHENTICATED");
});

await scenario("token adulterado => 401", async () => {
  const parts = tokenA.split(".");
  const tampered = `${parts[0]}.${parts[1]}.${parts[2].slice(0, -3)}abc`;
  expectStatus(await api("GET", "/products", { token: tampered }), 401, "UNAUTHENTICATED");
  expectStatus(await api("GET", "/products", { token: "lixo" }), 401, "UNAUTHENTICATED");
});

await scenario("token expirado => 401 TOKEN_EXPIRED", async () => {
  if (!JWT_SECRET) { console.log("      (ignorado: defina JWT_SECRET para assinar um token vencido)"); return; }
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const data = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: String(idA), role: "USER", iat: now - 7200, exp: now - 3600 })}`;
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("base64url");
  expectStatus(await api("GET", "/products", { token: `${data}.${sig}` }), 401, "TOKEN_EXPIRED");
});

let prodA;
await scenario("CRUD: criar produto (SKU em maiúsculo, quantity 0, lowStock)", async () => {
  prodA = await newProduct(tokenA);
  check(prodA.sku === prodA.sku.toUpperCase(), "SKU deve ser maiúsculo");
  check(prodA.quantity === 0, "quantidade inicial deve ser 0");
  check(typeof prodA.unitPrice === "number" && prodA.unitPrice === 10.5, "unitPrice deve ser number");
  check(prodA.lowStock === true, "0 <= minStock 2 => lowStock true");
  check(!("owner" in prodA), "USER não recebe owner");
});

await scenario("CRUD: listar, buscar e filtrar lowStock", async () => {
  const list = await api("GET", "/products", { token: tokenA });
  expectStatus(list, 200);
  check(list.body.products.some((p) => p.id === prodA.id), "produto criado deve aparecer");
  const s = await api("GET", `/products?search=${encodeURIComponent(prodA.sku.slice(0, 8).toLowerCase())}`, { token: tokenA });
  check(s.body.products.some((p) => p.id === prodA.id), "busca por SKU (sem diferenciar maiúsculas) deve achar");
  const low = await api("GET", "/products?lowStock=true", { token: tokenA });
  check(low.body.products.some((p) => p.id === prodA.id), "lowStock=true deve incluir o produto");
  const get = await api("GET", `/products/${prodA.id}`, { token: tokenA });
  expectStatus(get, 200);
  check(get.body.product.id === prodA.id, "GET por id");
});

await scenario("CRUD: atualizar produto (PUT)", async () => {
  const r = await api("PUT", `/products/${prodA.id}`, { token: tokenA, body: { name: "Renomeado", unitPrice: 12.9, minStock: 0 } });
  expectStatus(r, 200);
  check(r.body.product.name === "Renomeado" && r.body.product.unitPrice === 12.9, "campos atualizados");
});

await scenario("validações: preço negativo, id 'abc', quantity no PUT", async () => {
  const body = { name: "X", sku: "NEG-" + run, category: "C", unitPrice: -5, minStock: 0 };
  expectStatus(await api("POST", "/products", { token: tokenA, body }), 400, "VALIDATION_ERROR");
  expectStatus(await api("GET", "/products/abc", { token: tokenA }), 400, "VALIDATION_ERROR");
  expectStatus(await api("PUT", `/products/${prodA.id}`, { token: tokenA, body: { quantity: 999 } }), 400, "VALIDATION_ERROR");
  const still = await api("GET", `/products/${prodA.id}`, { token: tokenA });
  check(still.body.product.quantity === 0, "quantity não pode ter mudado");
});

await scenario("404: produto inexistente", async () => {
  expectStatus(await api("GET", "/products/900000000", { token: tokenA }), 404, "NOT_FOUND");
  expectStatus(await api("POST", "/products/900000000/movements", { token: tokenA, body: { type: "ENTRY", quantity: 1 } }), 404, "NOT_FOUND");
});

await scenario("SKU duplicado (mesmo dono) => 409; outro usuário pode repetir", async () => {
  const body = { name: "Dup", sku: prodA.sku.toLowerCase(), category: "C", unitPrice: 1, minStock: 0 };
  expectStatus(await api("POST", "/products", { token: tokenA, body }), 409, "CONFLICT");
  const other = await api("POST", "/products", { token: tokenB, body });
  expectStatus(other, 201);
  createdProducts.push({ id: other.body.product.id, token: tokenB });
});

await scenario("isolamento: B não vê produtos de A na listagem", async () => {
  const r = await api("GET", "/products", { token: tokenB });
  expectStatus(r, 200);
  check(!r.body.products.some((p) => p.id === prodA.id), "B não deve ver o produto de A");
});

await scenario("B => 403 em GET/PUT/DELETE e movimentos de A", async () => {
  expectStatus(await api("GET", `/products/${prodA.id}`, { token: tokenB }), 403, "FORBIDDEN");
  expectStatus(await api("PUT", `/products/${prodA.id}`, { token: tokenB, body: { name: "Hack" } }), 403, "FORBIDDEN");
  expectStatus(await api("DELETE", `/products/${prodA.id}`, { token: tokenB }), 403, "FORBIDDEN");
  expectStatus(await api("POST", `/products/${prodA.id}/movements`, { token: tokenB, body: { type: "ENTRY", quantity: 5 } }), 403, "FORBIDDEN");
  expectStatus(await api("GET", `/products/${prodA.id}/movements`, { token: tokenB }), 403, "FORBIDDEN");
  const check1 = await api("GET", `/products/${prodA.id}`, { token: tokenA });
  check(check1.body.product.name === "Renomeado", "produto de A não pode ter sido alterado");
});

await scenario("movimentos: ENTRY 10, EXIT 3 aceita", async () => {
  const e = await api("POST", `/products/${prodA.id}/movements`, { token: tokenA, body: { type: "ENTRY", quantity: 10, note: "compra" } });
  expectStatus(e, 201);
  check(e.body.movement.type === "ENTRY" && e.body.product.quantity === 10, "saldo 10 após entrada");
  const x = await api("POST", `/products/${prodA.id}/movements`, { token: tokenA, body: { type: "EXIT", quantity: 3 } });
  expectStatus(x, 201);
  check(x.body.product.quantity === 7, "saldo 7 após saída de 3");
});

await scenario("EXIT 50 => 422 INSUFFICIENT_STOCK e saldo intacto", async () => {
  const r = await api("POST", `/products/${prodA.id}/movements`, { token: tokenA, body: { type: "EXIT", quantity: 50 } });
  expectStatus(r, 422, "INSUFFICIENT_STOCK");
  check(r.body.error.message === "Estoque insuficiente: disponível 7, solicitado 50.", `mensagem inesperada: ${r.body.error.message}`);
  const p = await api("GET", `/products/${prodA.id}`, { token: tokenA });
  check(p.body.product.quantity === 7, "saldo deve continuar 7");
  const m = await api("GET", `/products/${prodA.id}/movements`, { token: tokenA });
  check(m.body.movements.length === 2, "movimentação bloqueada não pode ser gravada");
});

await scenario("movimento inválido => 400 (quantidade 0, tipo errado, > 1.000.000)", async () => {
  for (const body of [{ type: "EXIT", quantity: 0 }, { type: "XYZ", quantity: 1 }, { type: "ENTRY", quantity: 1000001 }, { type: "ENTRY", quantity: 1.5 }]) {
    expectStatus(await api("POST", `/products/${prodA.id}/movements`, { token: tokenA, body }), 400, "VALIDATION_ERROR");
  }
});

await scenario("histórico: mais recentes primeiro, com user {id,name}", async () => {
  const r = await api("GET", `/products/${prodA.id}/movements`, { token: tokenA });
  expectStatus(r, 200);
  const [first, second] = r.body.movements;
  check(first.type === "EXIT" && second.type === "ENTRY", "ordem deve ser a mais recente primeiro");
  check(first.user.id === idA && first.user.name === userA.name && Object.keys(first.user).length === 2, "user {id,name}");
});

await scenario("concorrência: saldo 10, 5 saídas de 3 em paralelo => 3 ok, 2 x 422, saldo 1", async () => {
  const p = await newProduct(tokenA, { minStock: 0 });
  expectStatus(await api("POST", `/products/${p.id}/movements`, { token: tokenA, body: { type: "ENTRY", quantity: 10 } }), 201);
  const rs = await Promise.all(Array.from({ length: 5 }, () => api("POST", `/products/${p.id}/movements`, { token: tokenA, body: { type: "EXIT", quantity: 3 } })));
  const ok = rs.filter((r) => r.status === 201).length;
  const blocked = rs.filter((r) => r.status === 422 && r.body.error.code === "INSUFFICIENT_STOCK").length;
  check(ok === 3 && blocked === 2, `esperado 3 sucessos e 2 x 422; veio ${ok} e ${blocked} (${rs.map((r) => r.status).join(",")})`);
  const final = await api("GET", `/products/${p.id}`, { token: tokenA });
  check(final.body.product.quantity === 1, `saldo final deveria ser 1, veio ${final.body.product.quantity}`);
  const hist = await api("GET", `/products/${p.id}/movements`, { token: tokenA });
  check(hist.body.movements.length === 4, "1 entrada + 3 saídas gravadas");
});

await scenario("DELETE => 204 e cascade das movimentações", async () => {
  const p = await newProduct(tokenA);
  await api("POST", `/products/${p.id}/movements`, { token: tokenA, body: { type: "ENTRY", quantity: 4 } });
  expectStatus(await api("DELETE", `/products/${p.id}`, { token: tokenA }), 204);
  expectStatus(await api("GET", `/products/${p.id}`, { token: tokenA }), 404, "NOT_FOUND");
  expectStatus(await api("GET", `/products/${p.id}/movements`, { token: tokenA }), 404, "NOT_FOUND");
});

if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  await scenario("admin: login e vê produtos de todos (com owner)", async () => {
    const l = await api("POST", "/auth/login", { body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
    expectStatus(l, 200);
    check(l.body.user.role === "ADMIN", "usuário deveria ser ADMIN");
    tokenAdmin = l.body.token;
    const r = await api("GET", "/products", { token: tokenAdmin });
    const mine = r.body.products.find((p) => p.id === prodA.id);
    check(mine && mine.owner?.id === idA, "admin vê produto de A com owner {id,name}");
  });
  await scenario("admin: edita, movimenta e apaga produto de outro usuário", async () => {
    const p = await newProduct(tokenB);
    expectStatus(await api("PUT", `/products/${p.id}`, { token: tokenAdmin, body: { name: "Editado pelo admin" } }), 200);
    const m = await api("POST", `/products/${p.id}/movements`, { token: tokenAdmin, body: { type: "ENTRY", quantity: 2 } });
    expectStatus(m, 201);
    expectStatus(await api("GET", `/products/${p.id}/movements`, { token: tokenAdmin }), 200);
    expectStatus(await api("DELETE", `/products/${p.id}`, { token: tokenAdmin }), 204);
  });
} else {
  console.log("INFO  cenários de admin ignorados (defina ADMIN_EMAIL e ADMIN_PASSWORD)");
}

// Limpeza: apaga os produtos criados (a API não possui exclusão de usuários).
for (const { id, token } of createdProducts) await api("DELETE", `/products/${id}`, { token: tokenAdmin ?? token });

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} cenários PASS` + (failed.length ? ` — ${failed.length} FAIL` : ""));
process.exit(failed.length ? 1 : 0);
