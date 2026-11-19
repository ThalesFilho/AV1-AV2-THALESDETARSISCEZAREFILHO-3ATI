# Guia do código — arquivo por arquivo (para iniciante)

Objetivo: entender e saber explicar tudo. Caminhos são a partir da raiz do repositório.

## Visão geral

```
backend/   API (Node + Express + Prisma + PostgreSQL)
frontend/  Interface (React + Vite + Tailwind)
tools/     smoke-test.mjs (testa a API) e check-pins.mjs (confere versões)
docs/      documentação
```

Caminho de uma requisição no backend: **rota → middlewares → controller → service → model → banco**, e a resposta volta como JSON.

---

# Backend (`backend/`)

## Arquivos de configuração

| Arquivo | Para que serve |
|---|---|
| `package.json` | Lista as dependências com versão exata (`"prisma": "7.10.0"`), `"type": "module"` (usa `import`/`export`), `engines.node` e os scripts (`npm run dev`, `npm start`, `seed:admin`, `prisma:*`). O `postinstall` roda `prisma generate`. |
| `.npmrc` | `save-exact=true`: o npm grava versões exatas, sem `^`. |
| `.env` / `.env.example` | Variáveis de ambiente. O `.env` tem os valores reais e **não vai para o GitHub**; o `.env.example` mostra os nomes com valores de exemplo. |
| `prisma/schema.prisma` | Descreve as tabelas (models `User`, `Product`, `StockMovement`) e os enums. Não contém a URL do banco. |
| `prisma.config.js` | Diz ao Prisma onde estão o schema e as migrations e de onde vem a URL (`env("DATABASE_URL")`). |
| `prisma/migrations/` | SQL versionado que cria as tabelas. `npm run prisma:deploy` aplica. |

## `src/server.js` e `src/app.js`

- `server.js`: liga o servidor: `app.listen(env.PORT, "0.0.0.0", ...)`. `0.0.0.0` faz aceitar conexões de fora (necessário em hospedagem); a porta vem da variável `PORT` (o Render define).
- `app.js`: monta o Express na ordem: `cors(...)` → `express.json()` (transforma o corpo em objeto) → `app.use("/api", router)` → `notFound` → `errorHandler`. A ordem importa: o `errorHandler` fica por último para pegar qualquer erro.

## `src/config/env.js`

Lê as variáveis (`dotenv`) e **valida na partida**: falta `DATABASE_URL` ou `JWT_SECRET` → o programa mostra o erro e para. Em produção exige `JWT_SECRET` com 32+ caracteres. Também monta a lista `corsOrigins` (separa por vírgula, tira barra final e, fora de produção, libera `http://localhost:5173`).

## `src/lib/prisma.js` e `src/lib/dbConfig.js`

No Prisma 7 o cliente conversa com o banco por um **driver adapter**. Para PostgreSQL uso `@prisma/adapter-pg` (que usa o driver `pg`):

```js
const adapter = new PrismaPg(buildDbConfig(env.DATABASE_URL, env.DATABASE_SSL, env.DATABASE_SSL_CA));
export const prisma = new PrismaClient({ adapter });
```

`dbConfig.js` desmonta a `DATABASE_URL` com `new URL(...)` (host, porta, usuário, senha, banco) e, se `DATABASE_SSL=true`, liga o SSL (o Supabase exige). Existe **um único** `prisma` reaproveitado por todo o app.

## `src/routes/index.js`

Liga cada URL a seus middlewares e ao controller. Exemplo:

```js
router.post("/products/:id/movements", validate("params", validateId), validate("body", validateMovement), movementController.create);
```

`router.use("/products", authenticate)` coloca o login obrigatório em **todas** as rotas de produtos e movimentações. Só `/health`, `/auth/register` e `/auth/login` são públicas.

## Controllers (`src/controllers/`)

`authController.js`, `productController.js`, `movementController.js`. Fazem só 3 coisas: pegam os dados já validados (`res.locals.body`, `res.locals.params`, `res.locals.user`), chamam o **service** e respondem (`res.status(201).json(...)`). **Não têm regra de negócio nem acessam o Prisma.**

## Services (`src/services/`) — as regras

- `authService.js`: `register` (e-mail duplicado → 409; `bcrypt.hash(senha, 10)`; papel sempre `USER`) e `login` (`bcrypt.compare`; mensagem genérica "E-mail ou senha inválidos."; `jwt.sign({ sub, role }, JWT_SECRET, { expiresIn })`).
- `productService.js`: `getAuthorizedProduct` — 404 se não existe, 403 se é de outro usuário (a ordem importa). USER lista só os próprios; ADMIN lista todos.
- `movementService.js`: **a regra do estoque** (ver abaixo).

### A transação do estoque

```js
const count = await productModel.decrementIfEnough(productId, input.quantity, tx);
if (count !== 1) { ... throw AppError.insufficientStock(current.quantity, input.quantity); }
```

`decrementIfEnough` (em `models/productModel.js`) faz `updateMany({ where: { id, quantity: { gte: q } }, data: { quantity: { decrement: q } } })`. É **um único UPDATE** condicional: o banco trava a linha, confere e subtrai de uma vez. Se o saldo não cobre, `count` é 0 → 422 e **nada é gravado** (a transação desfaz tudo). A movimentação só é criada depois, dentro da mesma `prisma.$transaction` (`models/transaction.js`).

## Models (`src/models/`)

`userModel.js`, `productModel.js`, `movementModel.js`: **os únicos arquivos que chamam o Prisma** (`prisma.user.findUnique(...)`). Recebem um parâmetro `db` opcional para funcionar dentro de uma transação. No `list` de produtos: a busca usa `contains` com `mode: "insensitive"` (no PostgreSQL vira ILIKE) e o filtro de estoque baixo usa `$queryRaw` parametrizado (`quantity <= "minStock"`, com aspas porque o PostgreSQL diferencia maiúsculas nos nomes), porque o Prisma não compara duas colunas no `where`.

## Middlewares (`src/middlewares/`)

| Arquivo | O que faz |
|---|---|
| `authenticate.js` | Lê `Authorization: Bearer <token>`, `jwt.verify` (só HS256), 401 se faltar/ inválido (`TOKEN_EXPIRED` se venceu), carrega o usuário **do banco** e põe em `res.locals.user`. |
| `authorize.js` | `authorize("ADMIN")` bloqueia quem não tem o papel (403). Disponível para rotas só de admin. |
| `validate.js` | Roda um validador (de `validators/`) sobre `body`/`params`/`query`; se houver erros, responde 400 com `details` por campo. |
| `notFound.js` | Rota inexistente → 404 em JSON. |
| `errorHandler.js` | Transforma qualquer erro em `{"error":{code,message,details?}}`: `AppError` com seu status, JSON malformado → 400, `P2002` do Prisma → 409, o resto → 500 (sem *stack* em produção). |

## Validators (`src/validators/index.js`)

Validação **escrita à mão** (sem biblioteca). Cada função recebe os dados e devolve `{ value, errors }`. Exemplos: SKU vira maiúsculo; preço não pode ser negativo nem ter mais de 2 casas; no PUT qualquer campo fora da lista (como `quantity`) gera erro; quantidade de movimento entre 1 e 1.000.000.

## Utils (`src/utils/`)

- `AppError.js`: erro com `status`, `code` e `message` (`AppError.notFound()`, `AppError.insufficientStock(...)`).
- `serializers.js`: monta o JSON final (a "view"): `unitPrice` vira número, calcula `lowStock = quantity <= minStock`, inclui `owner` só para ADMIN.
- `assertOwnerOrAdmin.js`: lança 403 se o usuário não é dono nem admin.

## `src/scripts/seedAdmin.js`

Cria o ADMIN com `ADMIN_NAME/EMAIL/PASSWORD` do ambiente; se já existe, não duplica; nunca imprime a senha. É o **único** jeito de existir um admin (o cadastro público sempre cria USER).

## Fora do `src/`

- `tools/smoke-test.mjs`: roda ~27 cenários contra a API (inclui concorrência) e mostra PASS/FAIL.
- `tools/check-pins.mjs`: confere que Prisma está exatamente em 7.10.0 e Tailwind em 4.3.0 no `package.json` e no lockfile.
- `backend/postman/...json` e `backend/requests.http`: requisições prontas.

---

# Frontend (`frontend/`)

## Configuração

| Arquivo | Para que serve |
|---|---|
| `index.html` | Página única. Tem `lang="pt-BR"`, título "EstoqueFácil" e carrega `src/main.jsx`. |
| `vite.config.js` | Liga o plugin do React e o do Tailwind (`@tailwindcss/vite`). |
| `src/index.css` | Só `@import "tailwindcss";` — o Tailwind 4 não precisa de arquivo de configuração. |
| `.env.example` | `VITE_API_URL`: endereço da API. Variáveis `VITE_` vão **dentro do código público** do site (nunca coloque segredo). |
| `vercel.json` | Manda qualquer endereço para `index.html` (o React Router decide a tela). Sem isso, recarregar `/products/3` dá 404. |

## `src/main.jsx` e `src/App.jsx`

`main.jsx` monta a árvore: `BrowserRouter` → `ToastProvider` → `AuthProvider` → `App`. `App.jsx` define as rotas: `/login` e `/register` (dentro de `PublicOnlyRoute`), `/products` e `/products/:id` (dentro de `ProtectedRoute` + `Layout`), `/` redireciona para `/products` e `*` mostra a página 404.

## Rotas protegidas (`src/routes/`)

- `ProtectedRoute.jsx`: enquanto valida a sessão mostra "Verificando sessão..."; sem usuário manda para `/login` guardando de onde veio (`state={{ from: location }}`).
- `PublicOnlyRoute.jsx`: quem já está logado sai do login/cadastro; depois de entrar, volta à página de origem.

## Contextos (`src/context/`)

- `AuthContext.jsx`: guarda `user`, `loading`, e as funções `login`, `register`, `logout`. Ao abrir o site, se existe token chama `GET /auth/me` para validar. Escuta os eventos `auth:expired` (mostra "Sua sessão expirou." e vai ao `/login`) e `api:forbidden` (toast "Acesso negado."). Os objetos de contexto ficam em `authContext.js`/`toastContext.js` (regra do React Refresh).
- `ToastContext.jsx`: avisos rápidos que somem sozinhos (`toast.success(...)`).

## `src/api/`

- `client.js`: o coração. Função `request(path, {method, body, signal})`: usa `fetch` com `VITE_API_URL`, coloca `Authorization: Bearer <token>` (token em `localStorage`, chave `estoque.token`), converte JSON, tem **timeout de 15 s** (`AbortController`) e lança `ApiError` (`status`, `code`, `message`, `details`). Em 401 (fora login/cadastro) limpa a sessão e dispara `auth:expired`; em 403 dispara `api:forbidden`. `getErrorMessage` traduz erros (rede, timeout, 5xx) para mensagens amigáveis; `getFieldErrors` pega os erros por campo do 400.
- `auth.js` e `products.js`: funções simples (`productsApi.addMovement(id, data)` etc.) que chamam `request`.

## `src/utils/`

- `useApi.js`: hook que busca dados e informa `loading`/`error`/`data`; **cancela a requisição anterior** quando a chave muda (evita resposta antiga sobrescrever a nova na busca).
- `useDebounce.js`: espera ~400 ms parado antes de buscar.
- `format.js`: dinheiro em R$ e data em pt-BR (`Intl`), e `canManage` (dono ou admin).

## Páginas (`src/pages/`)

- `LoginPage.jsx` / `RegisterPage.jsx`: formulários com validação no cliente (campos obrigatórios, e-mail, senha ≥ 8, confirmação) **e** exibição dos erros do backend (400 por campo, 401, 409, rede).
- `ProductsPage.jsx`: cartões de resumo, busca (debounce), filtro "estoque baixo", tabela/cartões, modal de criar/editar, confirmação de excluir, estados carregando/erro/vazio.
- `ProductDetailPage.jsx`: dados e saldo em destaque, formulário de movimentação, histórico; mensagens para 404 e 403.
- `NotFoundPage.jsx`: 404 amigável.

## Componentes (`src/components/`)

- `ui/`: peças reutilizáveis — `Button` (com *loading*), `Input` e `Select` (label ligada ao campo e erro acessível), `Modal` (`<dialog>` nativo: Esc, clique fora, foco), `ConfirmDialog`, `Alert`, `Badge`, `Toast`, `Spinner`, `EmptyState`, `StatCard`.
- `layout/`: `Navbar` (nome, selo Administrador, Sair, menu hambúrguer no celular), `Footer`, `Layout`, `AuthShell`.
- `products/`: `ProductTable` (tabela no desktop, cartões no celular), `ProductFormModal`, `MovementForm`, `MovementHistory`.
- Os de navbar, tabela, cartões e modal foram adaptados do HyperUI (`docs/FONTES-COMPONENTES.md`).

## Tailwind

Em vez de escrever CSS, coloco classes no elemento: `className="rounded-md bg-teal-700 px-4 py-2 text-white hover:bg-teal-800"`. Prefixos como `md:` aplicam a regra só a partir de telas médias (por isso a tabela aparece no desktop e os cartões no celular: `hidden md:block` / `md:hidden`).

---

# Fluxo 1 — "Clico em Entrar"

1. **`LoginPage.jsx` → `handleSubmit`**: valida e-mail e senha no cliente. Se ok, chama `login(email, senha)` do `AuthContext`.
2. **`AuthContext.login`** → `authApi.login` → **`api/client.js` `request("/auth/login", POST)`**: o navegador envia `POST {VITE_API_URL}/auth/login` com o JSON. Como o site e a API são origens diferentes, antes vai um pedido **OPTIONS** (pré-voo do CORS).
3. **`app.js`**: `cors` confere se a origem do site está em `CORS_ORIGIN`; `express.json()` lê o corpo.
4. **`routes/index.js`**: `/auth/login` → `validate("body", validateLogin)` (e-mail válido? senha preenchida?) → `authController.login`.
5. **`authController.login`** → **`authService.login`**: `userModel.findByEmail(email)` → `prisma.user.findUnique(...)` → **adapter PostgreSQL** → **PostgreSQL** devolve o usuário. `bcrypt.compare(senha, passwordHash)`. Se falhar: `AppError 401 INVALID_CREDENTIALS` (mensagem genérica). Se passar: `jwt.sign({ sub: id, role }, JWT_SECRET, { expiresIn: "2h" })`.
6. **Resposta** `200 { token, user }` (o `user` passa por `serializeUser`, sem `passwordHash`).
7. **De volta ao front**: `AuthContext.login` guarda o token com `setToken` (`localStorage`) e o usuário em estado. `PublicOnlyRoute` vê que há usuário e redireciona para `/products` (ou a página de origem). A tela de produtos chama `GET /products` já com o cabeçalho `Authorization`.

Se a senha estiver errada: o `errorHandler` devolve 401 JSON → `request` lança `ApiError` → `LoginPage` mostra "E-mail ou senha inválidos." (e **não** dispara "sessão expirada", pois login é rota pública).

# Fluxo 2 — "Registro uma saída de estoque"

1. **`MovementForm.jsx` → `handleSubmit`**: valida só que a quantidade é inteira ≥ 1 (**não** compara com o saldo: quem decide é o backend). Chama `productsApi.addMovement(id, { type: "EXIT", quantity, note })`.
2. **`client.js`**: `POST /products/:id/movements` com `Authorization: Bearer <token>`.
3. **`routes/index.js`**: `router.use("/products", authenticate)` → **`authenticate.js`**: `jwt.verify`, busca o usuário no banco, coloca em `res.locals.user`. Depois `validate("params", validateId)` e `validate("body", validateMovement)`.
4. **`movementController.create`** → **`movementService.register`**:
   - `getAuthorizedProduct` → `productModel.findById`: produto não existe → **404**; é de outro e não sou admin → **403**.
   - `runInTransaction(async (tx) => ...)` abre a transação.
   - `productModel.decrementIfEnough(...)` → SQL equivalente: `UPDATE Product SET quantity = quantity - 3 WHERE id = ? AND quantity >= 3`.
   - Se `count !== 1` (saldo insuficiente): lê o saldo atual e lança `AppError.insufficientStock(saldo, pedido)` → a transação é desfeita → **422**.
   - Se `count === 1`: `movementModel.create(...)` grava a movimentação, relê o produto e a transação é confirmada (*commit*).
5. **Serialização**: `serializeMovement` e `serializeProduct` (com `lowStock`). Resposta **201 `{ movement, product }`**.
6. **De volta ao front**: `MovementForm` mostra o toast "Saída registrada.", limpa o campo e chama `onDone()` → `ProductDetailPage` faz `reload()` do produto e do histórico → o saldo e a lista atualizam sem recarregar a página. No caso 422, o `ApiError` traz a mensagem do backend (`Estoque insuficiente: disponível 7, solicitado 50.`) e o `MovementForm` a exibe em um `Alert` vermelho acima do formulário.
