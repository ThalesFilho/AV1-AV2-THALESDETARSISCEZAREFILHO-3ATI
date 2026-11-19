# CLAUDE.md — EstoqueFácil (DSW AV1 + AV2)

Aluno: THALES DE TARSIS CEZARE FILHO, 3º A TI. Tema: controle de estoque.

## REGRA Nº 1 — Stack permitida (e somente ela)
- Backend: Node.js em **JavaScript puro**, Express, Prisma 7.10.0, **MySQL**, JWT, hash de senha.
- Frontend: React + Vite em JavaScript/JSX + Tailwind CSS 4.3.0. Dependências permitidas: react, react-dom, react-router-dom, vite, @vitejs/plugin-react, tailwindcss e @tailwindcss/vite (4.3.0 exatos), ESLint do template. Proibido: TypeScript, axios, bibliotecas de UI/ícones/formulários/toasts/datas. Requisições com `fetch` nativo.
- Dependências do backend: express, cors, dotenv, jsonwebtoken, bcryptjs, @prisma/client (7.10.0), @prisma/adapter-mariadb (7.10.0), mariadb; dev: apenas prisma (7.10.0). Nada além disso (pacotes extras exigidos oficialmente pelo Prisma devem ser instalados na versão exata e avisados ao aluno).
- PROIBIDO (não reintroduzir): TypeScript/tsx/ts-node, PostgreSQL e seus drivers, Docker, zod, helmet, nodemon, express-validator, joi, axios e qualquer outra biblioteca. Validação é escrita à mão.

## Convenções
- Monorepo: `backend/`, `frontend/` (AV2, vazio), `tools/`, `docs/`. Branch `main`.
- Identificadores em inglês; comentários, mensagens da API e textos da UI em português; código simples (o aluno precisa explicá-lo).
- Nunca usar `--force`, `--legacy-peer-deps` nem `prisma migrate reset`. Lockfiles commitados. Sem segredos no repo (`.env` ignorado; `.env.example` versionado).
- Versões EXATAS (sem ^ ou ~): backend `prisma`, `@prisma/client`, `@prisma/adapter-mariadb` = 7.10.0; frontend `tailwindcss` e `@tailwindcss/*` = 4.3.0. `.npmrc` com `save-exact=true`. Conferir: `node tools/check-pins.mjs`.

## Backend (JavaScript ESM, Express 5, MVC)
- `src/{server,app}.js`, `config/env.js` (valida variáveis; produção exige JWT_SECRET >= 32), `routes`, `controllers` (sem Prisma/regra), `services` (regras), `models` (Prisma), `middlewares` (authenticate, authorize, validate, notFound, errorHandler), `validators/index.js` (validação manual: devolve `{value, errors}`), `utils` (AppError, serializers, assertOwnerOrAdmin), `lib/prisma.js`, `scripts/seedAdmin.js`.
- Prisma 7 + MySQL: `schema.prisma` com datasource `mysql` sem url; `prisma.config.js` (datasource via `env("DATABASE_URL")`, com valor de preenchimento se ausente para o `generate` funcionar sem banco); gerador **`prisma-client-js`** sem output (valida com 7.10.0 + adapter; o gerador `prisma-client` só gera TS); `import { PrismaClient } from "@prisma/client"`; PrismaClient sempre com `new PrismaMariaDb({host,port,user,password,database,...})` montado via `new URL(DATABASE_URL)`; `DATABASE_SSL=true` ativa SSL; `postinstall` = `prisma generate`.
- MySQL: sem `mode: "insensitive"` (collation utf8mb4_unicode_ci já ignora caixa); lowStock via `$queryRaw` parametrizado (`quantity <= minStock`) para obter ids.
- Modelos: User (role USER|ADMIN), Product (único ownerId+sku; `quantity` só muda por movimentações), StockMovement (ENTRY|EXIT; sem update/delete; cascade ao apagar produto).
- API sob `/api`: health, auth (register/login/me), products CRUD, products/:id/movements (POST/GET).
- Erros: `{"error":{"code","message","details?"}}` — 400 VALIDATION_ERROR, 401 UNAUTHENTICATED/TOKEN_EXPIRED/INVALID_CREDENTIALS, 403 FORBIDDEN, 404 NOT_FOUND, 409 CONFLICT (P2002), 422 INSUFFICIENT_STOCK, 500 INTERNAL_ERROR. 404 antes de 403.
- Autorização: USER só acessa o que é seu; ADMIN acessa tudo e vê `owner`. ADMIN só nasce via `npm run seed:admin`.
- Regra de negócio: EXIT > saldo => 422 "Estoque insuficiente: disponível X, solicitado Y."; atômica com `updateMany where quantity >= q` dentro de `$transaction`.
- Variáveis: DATABASE_URL (mysql://usuario:senha@host:3306/banco), DATABASE_SSL, JWT_SECRET, JWT_EXPIRES_IN, PORT, NODE_ENV, CORS_ORIGIN, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD.

## Frontend (frontend/, AV2 — pronto)
- Vite 8 + plugin-react 6 (compatível com os peers de @tailwindcss/vite 4.3.0); `@import "tailwindcss";` em `src/index.css`, sem tailwind.config/postcss. Só `VITE_API_URL` (.env.example versionado).
- `src/`: `api/` (client.js: fetch, Bearer do localStorage `estoque.token`, ApiError, evento `auth:expired` em 401 e `api:forbidden` em 403, timeout 15s), `components/{ui,layout,products}`, `context/` (AuthContext, ToastContext; objetos de contexto em `authContext.js`/`toastContext.js` por causa do react-refresh), `pages/`, `routes/` (ProtectedRoute guarda `state.from`; PublicOnlyRoute redireciona de volta), `utils/` (`useApi` com cancelamento, `useDebounce`, format).
- Cor primária teal. Saída excedente NÃO é bloqueada no cliente (mostra a mensagem 422 do backend). Editar/excluir/movimentar só para ADMIN ou dono, complementando o backend.
- Componentes adaptados do HyperUI (MIT) documentados em `docs/FONTES-COMPONENTES.md`; login/cadastro são próprios (o HyperUI não tem a categoria). Checklist manual em `docs/CHECKLIST-TESTE-MANUAL.md`.
- Regras do react-hooks v7 do ESLint: sem setState síncrono em effect (por isso o `useApi` deriva o "carregando" pela chave).

## Publicação (docs/DEPLOY.md)
- Render (Root `backend`): Build `npm ci --include=dev && npx prisma generate && npx prisma migrate deploy`, Start `npm start`, Health `/api/health`; Vercel (Root `frontend`, `VITE_API_URL=https://<render>/api`, `vercel.json` com rewrite de SPA). Banco: TiDB Cloud Starter, Aiven ou MySQL da hospedagem; `DATABASE_SSL=true` (+ `DATABASE_SSL_CA` se CA própria). ADMIN criado localmente com `seed:admin` passando variáveis só no comando.
- `CORS_ORIGIN` aceita lista e ignora barra final. Material de apresentação e auditoria em `docs/` (ROTEIRO-APRESENTACAO, GUIA-DO-CODIGO, PERGUNTAS-DO-PROFESSOR, AUDITORIA). O arquivo do ENUNCIADO não está no repo: AUDITORIA usa requisitos reconstruídos.

## Comandos
Em `backend/`: `npm ci`, `npm run dev` (node --watch), `npm start`, `npm run seed:admin`, `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:deploy`, `npm run prisma:studio`.
Em `frontend/`: `npm ci`, `npm run dev` (porta 5173), `npm run build`, `npm run lint`, `npm run preview`.
Na raiz: `node tools/check-pins.mjs`, `node tools/smoke-test.mjs` (BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET opcionais).
Postman: `backend/postman/EstoqueFacil.postman_collection.json`; REST Client: `backend/requests.http`.
Banco local: `CREATE DATABASE estoque CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` (o usuário precisa poder criar o shadow database no `migrate dev`).

## Ambiente desta máquina
MySQL do XAMPP (MariaDB 10.4) em `C:\xampp\mysql\bin`, usuário `root` sem senha, porta 3306 (iniciar com `mysqld.exe` se estiver parado). Bancos: `estoque` (dev) e `estoque_clone` (teste de clone limpo).
