# EstoqueFácil — controle de estoque

Projeto da disciplina **DSW** (AV1 + AV2)

- **Aluno:** THALES DE TARSIS CEZARE FILHO
- **Turma:** 3º A TI

## Problema e solução

Pequenos comércios controlam o estoque em planilhas ou no papel. Isso gera erros: produto vendido sem ter saldo, falta de aviso quando o estoque está acabando e nenhum histórico de quem mexeu em quê.

O **EstoqueFácil** é uma API REST que resolve isso:

- cada usuário cadastra **seus** produtos (nome, SKU, categoria, preço, estoque mínimo);
- o saldo do produto **nunca é editado direto**: só muda por **movimentações** de entrada (`ENTRY`) e saída (`EXIT`), que ficam gravadas como histórico;
- uma **saída maior que o saldo é bloqueada** (erro 422), mesmo que várias saídas cheguem ao mesmo tempo;
- o produto informa `lowStock` quando `quantidade <= estoque mínimo`;
- login com **JWT** e senhas com **hash (bcrypt)**; um usuário comum só enxerga os próprios dados, e o **ADMIN** enxerga tudo.

O repositório é um monorepo: `backend/` (AV1), `frontend/` (AV2, React + Tailwind, ainda não criado), `tools/` (scripts de apoio) e `docs/`.

## Tecnologias e versões

Backend 100% em **JavaScript** (sem TypeScript).

| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | 22.12 ou superior (mínimo do Prisma 7.10; testado com 24.16) | execução (módulos ESM) |
| Express | 5.3.0 | servidor HTTP e rotas |
| Prisma (`prisma` + `@prisma/client`) | **7.10.0** (exata) | ORM e migrations |
| `@prisma/adapter-mariadb` | **7.10.0** (exata) | adapter do Prisma para MySQL |
| mariadb | 3.5.5 | driver usado pelo adapter |
| MySQL | 8 (ou MariaDB/XAMPP) | banco de dados |
| jsonwebtoken | 9.0.3 | autenticação JWT |
| bcryptjs | 3.0.3 | hash de senhas |
| cors | 2.8.6 | CORS |
| dotenv | 18.0.10 | variáveis de ambiente |

Frontend (AV2): React + Tailwind CSS **4.3.0** (exata). As versões travadas são conferidas por `node tools/check-pins.mjs`.

### Prisma 7 em JavaScript: qual gerador funcionou

O gerador novo `prisma-client` do Prisma 7 só gera TypeScript. Para manter todo o código em JavaScript usamos o gerador **`prisma-client-js`** sem `output` customizado, importando `import { PrismaClient } from "@prisma/client"`. Foi validado na versão 7.10.0 junto com o adapter `PrismaMariaDb` (cliente gerado dentro de `node_modules`, por isso o `postinstall` roda `prisma generate`). O `prisma generate` não depende do banco estar no ar.

## Pré-requisitos

- **Node.js 22.12+** e npm
- **Git**
- **MySQL** instalado na máquina (MySQL Server, XAMPP ou Workbench). O XAMPP traz o MariaDB, compatível.

## Passo a passo

```bash
# 1. Clonar
git clone <url-do-repositorio>
cd <pasta-do-repositorio>/backend

# 2. Instalar dependências (usa o package-lock.json; o postinstall já roda `prisma generate`)
npm ci
```

**3. Criar o banco** (no MySQL, pelo terminal `mysql -u root -p` ou pelo Workbench):

```sql
CREATE DATABASE estoque CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

A collation `utf8mb4_unicode_ci` faz a busca por texto ignorar maiúsculas/minúsculas.

> O usuário do `.env` precisa ter permissão para **criar bancos**, porque o `prisma migrate dev` cria um *shadow database* temporário. O `root` local já pode. Para o `migrate deploy` (usado nos passos abaixo) não é necessário.

**4. Variáveis de ambiente:**

```bash
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

Edite o `.env` (usuário e senha do MySQL em `DATABASE_URL`, no formato `mysql://usuario:senha@localhost:3306/estoque`). Para gerar um `JWT_SECRET` seguro (mínimo 32 caracteres em produção):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```bash
# 5. Criar as tabelas (aplica prisma/migrations)
npm run prisma:deploy

# 6. Criar o usuário ADMIN (usa ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD do .env)
npm run seed:admin

# 7a. Desenvolvimento (reinicia ao salvar)
npm run dev

# 7b. Produção
npm start
```

A API sobe em `http://localhost:3000` (variável `PORT`). Teste: `http://localhost:3000/api/health`.

**Banco na nuvem:** coloque a URL no `DATABASE_URL` e use `DATABASE_SSL="true"` se o provedor exigir SSL.

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | `mysql://usuario:senha@host:3306/banco` |
| `DATABASE_SSL` | `true` para conexão com SSL (banco na nuvem) |
| `JWT_SECRET` | segredo do JWT (em produção, mínimo 32 caracteres) |
| `JWT_EXPIRES_IN` | validade do token (padrão `2h`) |
| `PORT` | porta do servidor (padrão `3000`) |
| `NODE_ENV` | `development` ou `production` |
| `CORS_ORIGIN` | origens permitidas, separadas por vírgula (em desenvolvimento `http://localhost:5173` já é permitido) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | dados do admin criado por `seed:admin` |

### Scripts do backend

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor em desenvolvimento (`node --watch`) |
| `npm start` | servidor (`node src/server.js`) |
| `npm run seed:admin` | cria/promove o ADMIN (idempotente; não imprime a senha) |
| `npm run prisma:generate` | gera o Prisma Client |
| `npm run prisma:migrate` | cria nova migration em desenvolvimento (`migrate dev`) |
| `npm run prisma:deploy` | aplica as migrations existentes (`migrate deploy`) |
| `npm run prisma:studio` | interface visual do banco |

## Arquitetura MVC

```
backend/src/
├── server.js / app.js      inicialização e configuração do Express
├── config/env.js           leitura e validação das variáveis de ambiente
├── routes/                 mapeia URL -> controller
├── controllers/            recebem a requisição e devolvem a resposta (sem regra, sem Prisma)
├── services/               regras de negócio (ex.: saída não pode passar do saldo)
├── models/                 acesso a dados (Prisma)
├── middlewares/            authenticate, authorize, validate, notFound, errorHandler
├── validators/             validação de dados escrita à mão
├── utils/                  AppError, serializers, assertOwnerOrAdmin
└── lib/prisma.js           único PrismaClient, com adapter do MySQL
```

Fluxo: `rota -> middlewares (authenticate, validate) -> controller -> service -> model -> banco`.
**A "view" é o JSON** devolvido pela API (montado em `utils/serializers.js`).

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
# na raiz do repositório
node tools/smoke-test.mjs
```

Variáveis opcionais: `BASE_URL` (padrão `http://localhost:3000`), `ADMIN_EMAIL`/`ADMIN_PASSWORD` (ativam os cenários de admin) e `JWT_SECRET` (ativa o cenário de token expirado). Cada cenário mostra `PASS`/`FAIL` e o programa termina com código 1 se algum falhar. Ele apaga os produtos que criou (a API não tem exclusão de usuários, então os usuários de teste `a.<id>@teste.com` permanecem; use um banco de desenvolvimento).

Exemplo com tudo habilitado (bash):

```bash
cd backend && set -a && . ./.env && set +a && cd .. && node tools/smoke-test.mjs
```

### Postman

Importe `backend/postman/EstoqueFacil.postman_collection.json`. A variável `baseUrl` aponta para `http://localhost:3000`. Rode a pasta **Roteiro AV1** com *Run collection*: os scripts guardam `tokenA` e `productId` automaticamente. Alternativa: `backend/requests.http` (extensão REST Client do VS Code).

### Versões travadas

```bash
node tools/check-pins.mjs
```

Falha (código 1) se Prisma/adapter não estiverem exatamente em 7.10.0 no backend, ou, no frontend (quando existir), Tailwind em 4.3.0 — conferindo `package.json` e `package-lock.json`.

## Segurança

Senhas com bcrypt (custo 10); JWT com expiração; CORS configurado; nenhum segredo no repositório (`.env` é ignorado; apenas `.env.example` é versionado).
