# EstoqueFácil — API (backend)

Projeto da disciplina **DSW** (AV1 + AV2)

- **Aluno:** THALES DE TARSIS CEZARE FILHO
- **Turma:** 3º A TI

## Problema e solução

Pequenos comércios controlam o estoque em planilhas ou no papel. Isso gera erros: produto vendido sem ter saldo, falta de aviso quando o estoque está acabando e nenhuma história de quem mexeu em quê.

O **EstoqueFácil** é uma API REST que resolve isso:

- cada usuário cadastra **seus** produtos (nome, SKU, categoria, preço, estoque mínimo);
- o saldo do produto **nunca é editado direto**: só muda por **movimentações** de entrada (`ENTRY`) e saída (`EXIT`), que ficam gravadas como histórico;
- uma **saída maior que o saldo é bloqueada** (erro 422), mesmo que várias saídas cheguem ao mesmo tempo;
- o produto informa `lowStock` quando `quantidade <= estoque mínimo`;
- login com **JWT**, senhas com **hash (bcrypt)**; um usuário comum só enxerga os próprios dados, e o **ADMIN** enxerga tudo.

Este é o README do backend. O README da raiz do repositório traz a visão geral do monorepo (`backend/`, `frontend/`, `tools/`, `docs/`).

## Tecnologias e versões

| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | 24.x (testado com 24.16; mínimo exigido pelo Prisma 7: 20.19+) | execução |
| TypeScript | 7.0.2 | linguagem |
| Express | 5.3.0 | servidor HTTP e rotas |
| Prisma (`prisma` + `@prisma/client`) | **7.10.0** (exata) | ORM e migrations |
| `@prisma/adapter-pg` + `pg` | **7.10.0** (exata) / 8.23.1 | conexão com o PostgreSQL |
| PostgreSQL | 16 | banco de dados |
| zod | 4.6.7 | validação de entrada |
| jsonwebtoken | 9.0.3 | autenticação JWT |
| bcryptjs | 3.0.3 | hash de senhas |
| helmet / cors | 8.3.0 / 2.8.6 | segurança HTTP |
| dotenv | 18.0.10 | variáveis de ambiente |
| tsx | 4.23.15 | executar TypeScript em desenvolvimento |

> As versões do Prisma são **exatas** (sem `^` ou `~`) e conferidas por `node ../tools/check-pins.mjs`.

## Pré-requisitos

- Node.js 20.19 ou superior e npm
- Git
- PostgreSQL 16 — pode ser pelo **Docker** (`docker-compose.yml` na raiz do repositório) ou um banco gratuito no **Neon** (veja abaixo)

## Passo a passo

```bash
# 1. Clonar
git clone <url-do-repositorio>
cd <pasta-do-repositorio>

# 2. Banco de dados local (Docker)
docker compose up -d

# 3. Instalar dependências (usa o package-lock.json; o postinstall já roda `prisma generate`)
cd backend
npm ci

# 4. Variáveis de ambiente
cp .env.example .env        # no Windows (PowerShell): Copy-Item .env.example .env
```

Edite o `.env`. Para gerar um `JWT_SECRET` seguro (mínimo 32 caracteres):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
# 5. Criar as tabelas no banco (aplica prisma/migrations)
npm run prisma:deploy

# 6. Criar o usuário ADMIN (usa ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD do .env)
npm run seed:admin

# 7a. Desenvolvimento (reinicia ao salvar)
npm run dev

# 7b. Produção
npm run build
npm start
```

A API sobe em `http://localhost:3000` (variável `PORT`). Teste: `http://localhost:3000/api/health`.

**Sem Docker?** Crie um projeto gratuito em <https://neon.tech>, copie a *connection string* e coloque no `DATABASE_URL` do `.env` (ex.: `postgresql://usuario:senha@host/db?sslmode=require`). Use um banco de desenvolvimento, não o de produção.

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão do PostgreSQL |
| `JWT_SECRET` | segredo do JWT (em produção, mínimo 32 caracteres) |
| `JWT_EXPIRES_IN` | validade do token (padrão `2h`) |
| `PORT` | porta do servidor (padrão `3000`) |
| `NODE_ENV` | `development` ou `production` |
| `CORS_ORIGIN` | origens permitidas, separadas por vírgula (em desenvolvimento `http://localhost:5173` já é permitido) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | dados do admin criado por `seed:admin` |

### Scripts do backend

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor em modo desenvolvimento (`tsx watch`) |
| `npm run build` | `prisma generate` + compila o TypeScript para `dist/` |
| `npm start` | roda `dist/server.js` |
| `npm run seed:admin` | cria/promove o ADMIN (idempotente; não imprime a senha) |
| `npm run prisma:migrate` | cria nova migration em desenvolvimento (`migrate dev`) |
| `npm run prisma:deploy` | aplica migrations existentes (`migrate deploy`) |
| `npm run prisma:studio` | interface visual do banco |

## Arquitetura MVC

```
backend/src/
├── server.ts / app.ts      inicialização e configuração do Express
├── config/env.ts           variáveis de ambiente validadas com zod
├── routes/                 M-V-C: rotas -> controllers
├── controllers/            recebem a requisição e devolvem a resposta (sem regra, sem Prisma)
├── services/               regras de negócio (ex.: saída não pode passar do saldo)
├── models/                 acesso a dados (Prisma)
├── middlewares/            authenticate, authorize, validate, notFound, errorHandler
├── validators/             esquemas zod
├── utils/                  AppError, serializers, assertOwnerOrAdmin
└── lib/prisma.ts           PrismaClient com adapter do PostgreSQL
```

Fluxo: `rota -> middlewares (authenticate, validate) -> controller -> service -> model -> banco`.
**A "view" é o JSON** devolvido pela API (montado em `utils/serializers.ts`).

## Modelo de dados

```mermaid
erDiagram
    User ||--o{ Product : "é dono de"
    User ||--o{ StockMovement : "registra"
    Product ||--o{ StockMovement : "tem"

    User {
        int id PK
        string name
        string email UK
        string passwordHash
        Role role "USER | ADMIN"
        datetime createdAt
    }
    Product {
        int id PK
        string name
        string sku
        string category
        decimal unitPrice "10,2"
        int minStock
        int quantity
        int ownerId FK
        datetime createdAt
        datetime updatedAt
    }
    StockMovement {
        int id PK
        MovementType type "ENTRY | EXIT"
        int quantity
        string note
        int productId FK "cascade"
        int userId FK
        datetime createdAt
    }
```

`Product` tem chave única `(ownerId, sku)`: o mesmo SKU pode existir para donos diferentes.

## Rotas da API (prefixo `/api`)

| Método | Rota | Auth | Descrição | Sucesso |
|---|---|---|---|---|
| GET | `/health` | não | verifica se a API está no ar | 200 |
| POST | `/auth/register` | não | cadastro `{name,email,password>=8}` (sempre USER) | 201 `{user}` |
| POST | `/auth/login` | não | login `{email,password}` | 200 `{token,user}` |
| GET | `/auth/me` | sim | usuário logado | 200 `{user}` |
| GET | `/products?search=&lowStock=true` | sim | lista produtos | 200 `{products}` |
| POST | `/products` | sim | cria `{name,sku,category,unitPrice,minStock}` | 201 `{product}` |
| GET | `/products/:id` | sim | detalhe | 200 `{product}` |
| PUT | `/products/:id` | sim | atualiza (enviar `quantity` => 400) | 200 `{product}` |
| DELETE | `/products/:id` | sim | apaga produto e movimentações | 204 |
| POST | `/products/:id/movements` | sim | `{type,quantity,note?}` | 201 `{movement,product}` |
| GET | `/products/:id/movements` | sim | histórico (mais recentes primeiro) | 200 `{movements}` |

Autenticação: header `Authorization: Bearer <token>`.

## Regras de autorização

- Todas as rotas de produtos e movimentações exigem login.
- **USER** só lista, vê, altera e apaga **os próprios** produtos e movimentações.
- Recurso que existe mas é de outro usuário => **403**. Recurso que não existe => **404** (a checagem de existência vem antes).
- **ADMIN** pode tudo e recebe o campo `owner {id,name}` nos produtos.
- O cadastro público **sempre** cria USER. O ADMIN só nasce pelo script `seed:admin`.

## Regra de negócio: saída de estoque

Uma saída (`EXIT`) maior que o saldo responde **422** `Estoque insuficiente: disponível X, solicitado Y.`

A verificação é **atômica**: dentro de uma `prisma.$transaction`, o service executa um `UPDATE ... WHERE id = ? AND quantity >= ?` (`updateMany` com `decrement`). Só se exatamente uma linha for alterada a movimentação é criada. Assim, 5 saídas simultâneas de 3 unidades sobre um saldo de 10 resultam em 3 sucessos, 2 erros 422 e saldo final 1 — o estoque nunca fica negativo.

## Formato e códigos de erro

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": { "campo": ["mensagem"] } } }
```

| HTTP | `code` | Quando |
|---|---|---|
| 400 | `VALIDATION_ERROR` | dados inválidos, id não numérico, JSON malformado, `quantity` no PUT |
| 401 | `UNAUTHENTICATED` | sem token ou token inválido |
| 401 | `TOKEN_EXPIRED` | token vencido |
| 401 | `INVALID_CREDENTIALS` | e-mail/senha errados (mensagem genérica) |
| 403 | `FORBIDDEN` | recurso de outro usuário |
| 404 | `NOT_FOUND` | recurso ou rota inexistente |
| 409 | `CONFLICT` | e-mail ou SKU duplicado |
| 422 | `INSUFFICIENT_STOCK` | saída maior que o saldo |
| 500 | `INTERNAL_ERROR` | erro inesperado (sem stack em produção) |

## Testes

### Smoke test (automático)

Com a API rodando:

```bash
# na raiz do repositório (../tools a partir desta pasta)
node ../tools/smoke-test.mjs
```

Variáveis opcionais: `BASE_URL` (padrão `http://localhost:3000`), `ADMIN_EMAIL`/`ADMIN_PASSWORD` (ativam os cenários de admin) e `JWT_SECRET` (ativa o cenário de token expirado). Cada cenário mostra `PASS`/`FAIL` e o programa termina com código 1 se algum falhar. Ele apaga os produtos que criou (a API não tem exclusão de usuários, então os usuários de teste `a.<id>@teste.com` permanecem; use um banco de desenvolvimento).

Exemplo com tudo habilitado (bash):

```bash
set -a && . ./.env && set +a && node ../tools/smoke-test.mjs
```

### Postman

Importe `postman/EstoqueFacil.postman_collection.json`. A variável `baseUrl` aponta para `http://localhost:3000`. Rode a pasta **Roteiro AV1** com *Run collection*: os scripts guardam `tokenA` e `productId` automaticamente. Alternativa: `requests.http` (extensão REST Client do VS Code).

### Versões travadas

```bash
node ../tools/check-pins.mjs
```

Falha (código 1) se Prisma não estiver exatamente em 7.10.0 no backend, ou, no frontend (quando existir), Tailwind em 4.3.0 — conferindo `package.json` e `package-lock.json`.

## Segurança

Senhas com bcrypt (custo 10); JWT com expiração; `helmet` e CORS configurados; nenhum segredo no repositório (`.env` é ignorado; apenas `.env.example` é versionado).
