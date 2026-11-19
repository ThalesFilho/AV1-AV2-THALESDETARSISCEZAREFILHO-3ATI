# Auditoria do projeto — EstoqueFácil

Data: 19/11/2026. Conferência feita no **código real** deste repositório.

> **Aviso importante sobre o enunciado.** O arquivo do ENUNCIADO **não está no repositório nem foi enviado a mim**. Por isso as listas de **10 requisitos da AV1** e **11 da AV2** abaixo são uma **reconstrução** feita a partir das regras que você me passou nos pedidos de construção e na ordem da apresentação. **Compare com o enunciado original**; se algum item oficial não estiver aqui, me avise para eu verificar. Os status valem para os itens reconstruídos.

Legenda: **Atendido** = verificado no código/testes · **Pendente: depende do deploy** = só pode ser conferido depois de publicar.

## AV1 — API (10 requisitos)

| # | Requisito | Evidência | Status |
|---|---|---|---|
| 1 | Node.js + Express em arquitetura **MVC** (rotas, controllers, services com regra de negócio, models com acesso a dados) | `backend/src/{routes,controllers,services,models}`; controllers sem Prisma (busca por "prisma" em `controllers/` = 0 ocorrências; Prisma só em `models/`, `lib/`, `scripts/`) | Atendido |
| 2 | **Prisma exatamente 7.10.0** (`prisma`, `@prisma/client`, adapter) | `backend/package.json`: `"prisma": "7.10.0"`, `"@prisma/client": "7.10.0"`, `"@prisma/adapter-mariadb": "7.10.0"`; `node tools/check-pins.mjs` → OK (package.json **e** lockfile) | Atendido |
| 3 | **Schema e migrations versionados** | `backend/prisma/schema.prisma`, `backend/prisma/migrations/20261119152617_init/` e `migration_lock.toml` no git; `migrate deploy` testado em banco vazio (clone limpo e simulação do build do Render) | Atendido |
| 4 | **Banco relacional (MySQL)** com persistência | `provider = "mysql"`; adapter `@prisma/adapter-mariadb`; dados conferidos no banco após o smoke test | Atendido |
| 5 | **CRUD completo** da entidade principal (produtos) + movimentações | `routes/index.js` (GET/POST/PUT/DELETE `/products`, POST/GET `/products/:id/movements`); smoke test 27/27 PASS | Atendido |
| 6 | **Regra de negócio**: saída maior que o saldo é bloqueada (422), de forma atômica | `services/movementService.js` + `models/productModel.js` (`updateMany ... quantity >= q` em `$transaction`); smoke test inclui 5 saídas simultâneas (3 ok, 2×422, saldo 1) | Atendido |
| 7 | **Cadastro e login** com senha em **hash** | `services/authService.js` (bcryptjs custo 10); no banco `passwordHash` = `$2b$10$...` (60 caracteres) | Atendido |
| 8 | **JWT** (emissão, expiração, validação por middleware) | `authService.login` (`jwt.sign`, `JWT_EXPIRES_IN`), `middlewares/authenticate.js` (`jwt.verify` HS256, `TOKEN_EXPIRED`); smoke test: token adulterado e expirado → 401 | Atendido |
| 9 | **401** sem token e **403** para operação não autorizada; **todas as rotas** (exceto health/registro/login) protegidas | `router.use("/products", authenticate)`; `utils/assertOwnerOrAdmin.js`; smoke test: B recebe 403 em GET/PUT/DELETE e movimentos de A; ordem 404 antes de 403 | Atendido |
| 10 | **Entrega**: lockfile e `.env.example` versionados, **sem segredos**, README completo, coleção Postman | `backend/package-lock.json`, `backend/.env.example` no git; `.env` ignorado; `README.md`, `backend/README.md`; `backend/postman/EstoqueFacil.postman_collection.json` (pasta "Roteiro AV1") e `backend/requests.http` | Atendido |

## AV2 — Frontend (11 requisitos)

| # | Requisito | Evidência | Status |
|---|---|---|---|
| 1 | **React + Tailwind CSS 4.3.0 exato** (`tailwindcss`, `@tailwindcss/vite`) | `frontend/package.json`: `"tailwindcss": "4.3.0"`, `"@tailwindcss/vite": "4.3.0"`; `check-pins` OK no package.json e no lockfile; `@import "tailwindcss";` em `src/index.css` | Atendido |
| 2 | Telas de **cadastro e login** integradas à API real | `pages/LoginPage.jsx`, `pages/RegisterPage.jsx`; roteiro no navegador (Chrome automatizado): cadastro, 409, 401, login | Atendido |
| 3 | **Logout, sessão e rotas protegidas** | `AuthContext.jsx`, `routes/ProtectedRoute.jsx`, `PublicOnlyRoute.jsx`; testado: deslogado → `/login`; token adulterado → "Sua sessão expirou." | Atendido |
| 4 | **CRUD de produtos** pela interface | `pages/ProductsPage.jsx`, `ProductDetailPage.jsx`, `components/products/ProductFormModal.jsx`; criar/editar/excluir/buscar/filtrar testados no navegador | Atendido |
| 5 | **Regra de negócio** na interface (entrada/saída, mensagem do bloqueio) | `components/products/MovementForm.jsx`; testado: saída 50 com saldo 7 mostra "Estoque insuficiente: disponível 7, solicitado 50." | Atendido |
| 6 | Diferença **usuário comum x admin** na UI | `Navbar.jsx` (selo "Administrador"), coluna "Responsável", `utils/format.js` (`canManage`); testado: admin vê produtos de todos | Atendido |
| 7 | **Tratamento de erros e estados** (carregando, vazio, erro, 400/401/403/404/409/422, rede) | `api/client.js` (`ApiError`, `getErrorMessage`, timeout), páginas com Spinner/EmptyState/Alert; testado: API fora do ar → erro com "Tentar novamente"; produto alheio → "Você não tem permissão..." | Atendido |
| 8 | **Componentes prontos da internet**, com fonte registrada | `docs/FONTES-COMPONENTES.md` (HyperUI, MIT: navbar, tabela, cartões, modal, com a URL no topo de cada arquivo). **O HyperUI não tem login/cadastro** (URL com 404): esses dois são escritos por mim e isso está declarado | Atendido (com ressalva declarada) |
| 9 | **Responsividade** | Tabela no desktop e cartões no celular; verificado em 360, 768 e 1280 px (sem rolagem horizontal); `hidden md:block` / `md:hidden` | Atendido |
| 10 | **Publicação** (frontend na Vercel, API no Render, MySQL na nuvem) | `docs/DEPLOY.md`, `frontend/vercel.json`, build simulado do Render ok; **URLs públicas ainda não existem** | **Pendente: depende do deploy** |
| 11 | **Documentação e apresentação** (problema, público, solução; README) | `README.md` (raiz e backend), `docs/ROTEIRO-APRESENTACAO.md`, `GUIA-DO-CODIGO.md`, `PERGUNTAS-DO-PROFESSOR.md`, `CHECKLIST-TESTE-MANUAL.md` | Atendido |

## Verificações transversais

| Verificação | Resultado |
|---|---|
| Versões exatas, sem `^`/`~`, também no lockfile | OK (`node tools/check-pins.mjs`) |
| Lockfiles commitados | `backend/package-lock.json`, `frontend/package-lock.json` |
| `.env.example` commitados e `.env` fora do git | `backend/.env.example`, `frontend/.env.example`; `git ls-files` não lista nenhum `.env` |
| Segredos no histórico | `git log -p --all` filtrado por `JWT_SECRET=`, `DATABASE_URL=`, `mysql://`, `PASSWORD=`: **somente placeholders** (`troque-por-...`, `usuario:senha@host`, `root:senha@localhost`). Nenhum segredo real encontrado |
| Controllers sem Prisma | 0 ocorrências em `backend/src/controllers` |
| Todas as rotas protegidas | Exceto `/api/health`, `/api/auth/register`, `/api/auth/login` (públicas por natureza) |
| Sem `localhost` fixo no frontend / sem segredo no frontend | `grep` em `frontend/src` sem ocorrências; só `VITE_API_URL` |
| Tecnologias fora da stack | Backend: express, cors, dotenv, jsonwebtoken, bcryptjs, @prisma/client, @prisma/adapter-mariadb, mariadb; dev: prisma. Frontend: react, react-dom, react-router-dom, tailwindcss, @tailwindcss/vite; dev: vite, @vitejs/plugin-react e o ESLint do template. Nada de TypeScript, axios, zod, helmet, Docker ou PostgreSQL no código atual |

## Lacunas encontradas e corrigidas nesta rodada

- `CORS_ORIGIN` com barra final (`https://app.vercel.app/`) não casava com a origem enviada pelo navegador → agora a barra final é removida (testado com pré-voo OPTIONS + `Authorization`: origens listadas recebem `Access-Control-Allow-Origin`, origens não listadas não).
- Faltava `engines.node` (agora `>=22.12.0`) e `.node-version`.
- Faltava `frontend/vercel.json` (rewrite de SPA) — criado.
- Provedores com CA própria (Aiven) não conectariam só com `DATABASE_SSL=true` → adicionado `DATABASE_SSL_CA` opcional.
- O CLI do Prisma é dependência de desenvolvimento; o build do Render usa `npm ci --include=dev` (simulado com `NODE_ENV=production` num banco vazio: generate + migrate deploy + seed + start funcionaram).

## Pontos de atenção (honestidade)

- Todos os testes foram no **MariaDB 10.4 do XAMPP**, não no TiDB/Aiven/MySQL 8. A conexão TLS real com o banco da nuvem só será comprovada no deploy.
- O histórico do git contém o primeiro commit, de uma versão anterior com TypeScript/PostgreSQL (`3ae99dc`). O código atual não tem nada disso; se quiser um histórico limpo, é possível recriá-lo (isso reescreve o histórico).
- O `package-lock.json` do backend inclui pacotes `@electric-sql/pglite*`: são dependências **internas do próprio `prisma`**, não escolha minha.
- A busca por texto sem diferenciar maiúsculas depende de o banco ter sido criado com `utf8mb4_unicode_ci` (instruído no README e no `DEPLOY.md`; no TiDB o padrão é outra collation).
