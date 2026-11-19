# CLAUDE.md — EstoqueFácil (DSW AV1 + AV2)

Aluno: THALES DE TARSIS CEZARE FILHO, 3º A TI. Tema: controle de estoque.

## REGRA Nº 1 — Stack permitida (e somente ela)
- Backend: Node.js em **JavaScript puro**, Express, Prisma 7.10.0, **MySQL**, JWT, hash de senha.
- Frontend (próximo prompt): React + Tailwind CSS 4.3.0.
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

## Comandos
Em `backend/`: `npm ci`, `npm run dev` (node --watch), `npm start`, `npm run seed:admin`, `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:deploy`, `npm run prisma:studio`.
Na raiz: `node tools/check-pins.mjs`, `node tools/smoke-test.mjs` (BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET opcionais).
Postman: `backend/postman/EstoqueFacil.postman_collection.json`; REST Client: `backend/requests.http`.
Banco local: `CREATE DATABASE estoque CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` (o usuário precisa poder criar o shadow database no `migrate dev`).

## Ambiente desta máquina
MySQL do XAMPP (MariaDB 10.4) em `C:\xampp\mysql\bin`, usuário `root` sem senha, porta 3306 (iniciar com `mysqld.exe` se estiver parado). Bancos: `estoque` (dev) e `estoque_clone` (teste de clone limpo).
