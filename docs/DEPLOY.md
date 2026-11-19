# Como publicar o EstoqueFácil (guia para iniciantes)

Ordem: **A** GitHub → **B** banco MySQL na nuvem → **C** API no Render → **D** criar o ADMIN → **E** frontend na Vercel → **F** liberar o CORS → **G** problemas comuns.

Você faz os cliques; nada aqui exige entregar senhas a ninguém. Os nomes de telas e botões das plataformas mudam com o tempo: se algo estiver diferente, procure o equivalente.

> **O que já foi testado e o que não foi.** Testei no meu computador, com o MariaDB do XAMPP: build, migrations, o smoke test (27/27), CORS e a conexão com `DATABASE_SSL`. **Não testei** uma conexão real com TiDB, Aiven, Render ou Vercel (não tenho acesso). Os passos abaixo seguem a documentação dessas plataformas; se algo falhar, veja a seção G.

---

## A. GitHub

1. Entre em <https://github.com> e clique em **New repository**. Dê um nome (ex.: `estoquefacil`), deixe **sem** README/.gitignore (o projeto já tem) e crie.
2. No terminal, dentro da pasta do projeto:

```bash
git remote add origin https://github.com/SEU_USUARIO/estoquefacil.git
git push -u origin main --tags
```

3. Dê acesso ao professor: no repositório, **Settings → Collaborators → Add people** (se o repositório for privado) ou **Settings → General → Change visibility → Public**.
4. Confira no GitHub que **não** aparece nenhum arquivo `.env` (só `.env.example`).

---

## B. Banco MySQL na nuvem

O Render não oferece MySQL. Escolha **uma** das opções, anote os dados e monte a `DATABASE_URL`.

| Opção | Custo | Observações |
|---|---|---|
| 1. **TiDB Cloud Starter** | plano gratuito | Compatível com MySQL; exige TLS (SSL). Mais simples para começar. |
| 2. **Aiven for MySQL** (ou outro MySQL gerenciado pago) | ~US$ 5/mês | O plano gratuito de MySQL da Aiven foi encerrado. Usa certificado de CA própria. |
| 3. **MySQL da hospedagem que você já tem** | já pago | Só serve se aceitar conexões **remotas**; o Render gratuito não tem IP fixo, então bloqueios por IP costumam impedir. |

Formato da URL: `mysql://USUARIO:SENHA@HOST:PORTA/BANCO`. Se a senha tiver caracteres especiais (`@ # / : ? %`), troque-os por código: `@`=`%40`, `#`=`%23`, `/`=`%2F`, `:`=`%3A`, `?`=`%3F`, `%`=`%25`.

### Opção 1 — TiDB Cloud Starter

1. Crie conta em <https://tidbcloud.com> e crie um cluster **Starter** (gratuito).
2. Clique em **Connect** e escolha conectar com **Prisma** (ou "General"). A tela mostra **host** (algo como `gateway01.<região>.prod.aws.tidbcloud.com`), **porta** (`4000`), **usuário** (algo como `xxxxxxxx.root`) e permite **gerar a senha** — copie e guarde.
3. Crie o banco da aplicação no **SQL Editor** do TiDB (importante: com a collation certa, senão a busca por texto diferencia maiúsculas de minúsculas):

```sql
CREATE DATABASE estoque CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. Monte a URL e as variáveis:

```
DATABASE_URL=mysql://USUARIO:SENHA@HOST:4000/estoque?sslaccept=strict
DATABASE_SSL=true
```

O `?sslaccept=strict` é para o Prisma (migrations) usar TLS; o `DATABASE_SSL=true` é para a API.

### Opção 2 — Aiven (MySQL pago)

1. Crie conta em <https://aiven.io> e um serviço **MySQL** no plano mais barato.
2. Na página do serviço (**Overview**) estão **host**, **porta**, **usuário** (`avnadmin`), **senha** e o banco padrão (`defaultdb`). Há também o botão para baixar o **CA certificate**.
3. Pode usar o banco `defaultdb` ou criar `estoque` (com `CREATE DATABASE estoque CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;` por um cliente como o MySQL Workbench).
4. Variáveis:

```
DATABASE_URL=mysql://avnadmin:SENHA@HOST:PORTA/estoque?sslaccept=accept_invalid_certs
DATABASE_SSL=true
DATABASE_SSL_CA=<conteúdo do arquivo ca.pem; se precisar numa linha só, troque as quebras de linha por \n>
```

O `DATABASE_SSL_CA` é necessário porque a Aiven usa uma autoridade de certificado própria que o Node não conhece. O `?sslaccept=accept_invalid_certs` vale só para o comando de migration do Prisma.

### Opção 3 — MySQL da sua hospedagem

Anote host, porta (normalmente `3306`), usuário, senha e nome do banco no painel (procure "MySQL remoto"/"Remote MySQL" e libere o acesso). Se o servidor exigir SSL, use `DATABASE_SSL=true`; se não, deixe `false`.

---

## C. API no Render

1. Entre em <https://render.com> com sua conta do GitHub. **New → Web Service** → escolha o repositório.
2. Preencha:

| Campo | Valor |
|---|---|
| Name | `estoquefacil-api` (a URL será `https://estoquefacil-api.onrender.com`) |
| Language/Runtime | Node |
| Branch | `main` |
| **Root Directory** | `backend` |
| **Build Command** | `npm ci --include=dev && npx prisma generate && npx prisma migrate deploy` |
| **Start Command** | `npm start` |
| Instance Type | Free |
| **Health Check Path** | `/api/health` |

Por que `--include=dev`: o `prisma` (CLI usado por `generate` e `migrate deploy`) é dependência de desenvolvimento; assim ele existe durante o build mesmo que o Render defina `NODE_ENV=production`. As migrations rodam no build porque o plano gratuito não tem terminal (shell).

3. Em **Environment Variables** crie (**não** crie `PORT`: o Render define sozinho, e o servidor já escuta em `0.0.0.0`):

| Variável | Valor / como obter |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `DATABASE_URL` | da seção B |
| `DATABASE_SSL` | `true` (conforme a opção do banco) |
| `DATABASE_SSL_CA` | só na Aiven (seção B) |
| `JWT_SECRET` | segredo forte, gerado no seu computador: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` (em produção precisa de **pelo menos 32 caracteres**, senão a API nem inicia) |
| `JWT_EXPIRES_IN` | `2h` |
| `CORS_ORIGIN` | provisório: `http://localhost:5173` (será trocado na etapa F) |

`ADMIN_NAME/EMAIL/PASSWORD` **não** vão para o Render: o admin é criado na etapa D.

4. Clique em **Create Web Service** e acompanhe os logs. No fim deve aparecer `EstoqueFácil API rodando na porta ...`. Teste no navegador: `https://SEU-SERVICO.onrender.com/api/health` → `{"status":"ok",...}`.

> **Aviso (plano gratuito):** a API "dorme" após ~15 minutos sem uso e leva **cerca de 1 minuto** para acordar na próxima visita. **Antes de apresentar, abra `/api/health` e espere responder.**

---

## D. Criar o ADMIN no banco de produção

Rode na **sua máquina**, dentro de `backend/`, passando as variáveis **só naquele comando** (nada é salvo em arquivo). Use os mesmos `DATABASE_URL`/`DATABASE_SSL` do Render. O `JWT_SECRET` aqui é só para o programa carregar (qualquer texto com 32 ou mais caracteres serve; não precisa ser o de produção).

**PowerShell (Windows):**

```powershell
cd backend
$env:DATABASE_URL="mysql://USUARIO:SENHA@HOST:PORTA/estoque?sslaccept=strict"
$env:DATABASE_SSL="true"
$env:JWT_SECRET="texto-qualquer-so-para-carregar-o-programa-0123456789"
$env:ADMIN_NAME="Administrador"
$env:ADMIN_EMAIL="seu-admin@exemplo.com"
$env:ADMIN_PASSWORD="uma-senha-forte-com-8+"
npm run seed:admin
Remove-Item Env:DATABASE_URL, Env:DATABASE_SSL, Env:JWT_SECRET, Env:ADMIN_NAME, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
```

**Linux/macOS (bash):**

```bash
cd backend
DATABASE_URL="mysql://USUARIO:SENHA@HOST:PORTA/estoque?sslaccept=strict" \
DATABASE_SSL=true JWT_SECRET=texto-qualquer-so-para-carregar-o-programa-0123456789 \
ADMIN_NAME="Administrador" ADMIN_EMAIL="seu-admin@exemplo.com" ADMIN_PASSWORD="uma-senha-forte-com-8+" \
npm run seed:admin
```

Variáveis do terminal têm prioridade sobre o `backend/.env` local, então o banco de produção é usado. Deve aparecer `ADMIN ... criado com sucesso.` (a senha nunca é impressa). O comando é seguro para repetir.

---

## E. Frontend na Vercel

1. Entre em <https://vercel.com> com o GitHub. **Add New → Project** → escolha o repositório.
2. Configure:

| Campo | Valor |
|---|---|
| **Root Directory** | `frontend` |
| Framework Preset | Vite (detectado sozinho) |
| Build Command | `npm run build` |
| Output Directory | `dist` |

3. Em **Environment Variables**: `VITE_API_URL` = `https://SEU-SERVICO.onrender.com/api` (com `/api` no fim e **sem** barra final).
4. **Deploy**. O arquivo `frontend/vercel.json` já faz todas as rotas (ex.: `/products/3`) abrirem o `index.html`, então recarregar a página não dá 404.

---

## F. Voltar ao Render e liberar o CORS

1. Copie a URL da Vercel (ex.: `https://estoquefacil.vercel.app`, **sem barra no fim**).
2. No Render: **Environment** → `CORS_ORIGIN` = essa URL (várias origens: separe por vírgula). Salve; o Render faz o redeploy.
3. Abra a URL da Vercel e teste cadastro/login.

---

## G. Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| Console do navegador: erro de **CORS** | `CORS_ORIGIN` no Render está diferente da URL da Vercel (confira `https`, sem barra no fim) ou o redeploy não terminou. |
| **404 ao recarregar** uma rota | `frontend/vercel.json` não foi publicado, ou o Root Directory da Vercel não é `frontend`. |
| Login demora ~1 minuto / "Não foi possível conectar" | A API dormiu (plano gratuito). Abra `/api/health`, espere e tente de novo. |
| Build do Render falha em `migrate deploy` | `DATABASE_URL` errada (senha com caractere especial sem codificar, porta, nome do banco inexistente) ou o banco ainda não permite conexões externas. Releia o log. |
| Erro de **SSL/TLS** (`pool timeout`, `self-signed certificate`, `SSL required`) | Banco exige TLS: use `DATABASE_SSL=true`. Aiven: adicione `DATABASE_SSL_CA`. Banco local sem TLS: `DATABASE_SSL=false`. |
| API não inicia: "JWT_SECRET deve ter pelo menos 32 caracteres" | Gere outro segredo com o comando da seção C. |
| Mudei `VITE_API_URL` e nada mudou | Variáveis `VITE_` são embutidas **no build**. Faça um novo deploy na Vercel (**Deployments → Redeploy**). |
| Busca por texto diferencia maiúsculas | O banco foi criado sem `COLLATE utf8mb4_unicode_ci` (comum no TiDB). Recrie o banco com a collation da seção B e rode as migrations. |
| Login do admin falha | O `seed:admin` foi rodado contra outro banco. Rode de novo com o `DATABASE_URL` de produção. |
