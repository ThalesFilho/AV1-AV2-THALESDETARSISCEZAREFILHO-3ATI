# CLAUDE.md — EstoqueFácil (DSW AV1 + AV2)

Aluno: THALES DE TARSIS CEZARE FILHO, 3º A TI. Tema: controle de estoque.

## Convenções
- Monorepo: `backend/`, `frontend/` (AV2, ainda vazio), `tools/`, `docs/`. Branch `main`.
- Identificadores em **inglês**; comentários, mensagens da API e textos da UI em **português**.
- Código simples: o aluno precisa explicá-lo.
- Nunca usar `--force`, `--legacy-peer-deps` nem `prisma migrate reset`. Lockfiles são commitados. Nada de segredos no repo (`.env` ignorado; `.env.example` versionado).
- Versões EXATAS (sem ^ ou ~): backend `prisma`, `@prisma/client`, `@prisma/adapter-pg` = 7.10.0; frontend `tailwindcss` e `@tailwindcss/*` = 4.3.0. `.npmrc` com `save-exact=true`. Conferir: `node tools/check-pins.mjs`.

## Backend (TypeScript + ESM, Express 5, MVC)
- `src/{server,app}.ts`, `config/env.ts` (zod; produção exige JWT_SECRET >= 32), `routes`, `controllers` (sem Prisma/regra), `services` (regras), `models` (Prisma), `middlewares` (authenticate, authorize, validate, notFound, errorHandler), `validators` (zod), `utils` (AppError, serializers, assertOwnerOrAdmin), `lib/prisma.ts`.
- Prisma 7: `prisma.config.ts` (datasource via `env("DATABASE_URL")`, com valor de preenchimento se ausente para o `generate` funcionar), `schema.prisma` sem url, generator `prisma-client` com output `src/generated/prisma` (gitignored; `moduleFormat=esm`, `importFileExtension=js`), PrismaClient com `PrismaPg`. Imports locais usam extensão `.js` (NodeNext).
- Modelos: User (role USER|ADMIN), Product (único ownerId+sku; `quantity` só muda por movimentações), StockMovement (ENTRY|EXIT; sem update/delete; cascade ao apagar produto).
- API sob `/api`: health, auth (register/login/me), products CRUD, products/:id/movements (POST/GET).
- Erros: `{"error":{"code","message","details?"}}` — 400 VALIDATION_ERROR, 401 UNAUTHENTICATED/TOKEN_EXPIRED/INVALID_CREDENTIALS, 403 FORBIDDEN, 404 NOT_FOUND, 409 CONFLICT (P2002), 422 INSUFFICIENT_STOCK, 500 INTERNAL_ERROR. 404 antes de 403.
- Autorização: USER só acessa o que é seu; ADMIN acessa tudo e vê `owner`. ADMIN só nasce via `npm run seed:admin`.
- Regra de negócio: EXIT > saldo => 422 "Estoque insuficiente: disponível X, solicitado Y."; atômica com `updateMany where quantity >= q` dentro de `$transaction`.
- Variáveis: DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT, NODE_ENV, CORS_ORIGIN, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD.

## Comandos
Em `backend/`: `npm ci`, `npm run dev`, `npm run build` (prisma generate + tsc), `npm start`, `npm run seed:admin`, `npm run prisma:migrate`, `npm run prisma:deploy`, `npm run prisma:studio`.
Na raiz: `docker compose up -d` (PostgreSQL 16), `node tools/check-pins.mjs`, `node tools/smoke-test.mjs` (BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET opcionais).
Postman: `backend/postman/EstoqueFacil.postman_collection.json`; REST Client: `backend/requests.http`.

## Ambiente de desenvolvimento desta máquina
Sem Docker/PostgreSQL instalados: o banco local usado nos testes é um PostgreSQL embarcado (pacote npm `embedded-postgres`, fora do repo) em `localhost:5432` (usuário/senha `postgres`, bancos `estoquefacil` e `estoquefacil_clone`). Alternativa documentada: Neon de desenvolvimento.
