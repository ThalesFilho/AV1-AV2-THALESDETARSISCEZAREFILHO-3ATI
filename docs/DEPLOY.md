# Como publicar o EstoqueFácil (guia para iniciantes)

Hospedagem: **Supabase** (banco PostgreSQL) + **Render** (API) + **Vercel** (frontend).

Ordem: **A** GitHub → **B** Supabase (banco) → **C** API no Render → **D** criar o ADMIN → **E** Vercel → **F** liberar o CORS → **G** problemas comuns.

Você faz os cliques; nada aqui exige entregar senhas a ninguém. Os nomes de telas e botões das plataformas mudam com o tempo: se algo estiver diferente, procure o equivalente.

> **O que já foi testado e o que não foi.** Testei no meu computador, com um PostgreSQL local: build, migrations, o smoke test (27/27), CORS e o build simulado do Render. **Não testei** uma conexão real com Supabase, Render ou Vercel (não tenho acesso a contas). Os passos seguem a documentação dessas plataformas; se algo falhar, veja a seção G.

---

## A. GitHub

1. Entre em <https://github.com> e clique em **New repository**. Dê um nome (ex.: `estoquefacil`), deixe **sem** README/.gitignore (o projeto já tem) e crie.
2. No terminal, dentro da pasta do projeto:

```bash
git remote add origin https://github.com/SEU_USUARIO/estoquefacil.git
git push -u origin main --tags
```

3. Dê acesso ao professor: **Settings → Collaborators → Add people** (repositório privado) ou **Settings → General → Change visibility → Public**.
4. Confira no GitHub que **não** aparece nenhum arquivo `.env` (só `.env.example`).

---

## B. Banco PostgreSQL no Supabase

1. Entre em <https://supabase.com> (pode usar o login do GitHub) e clique em **New project**.
2. Preencha: nome (ex.: `estoquefacil`), **Database Password** e **Region** (a mais próxima, ex.: South America/São Paulo).
   - **Anote a senha do banco** (depois só dá para trocar, não para ver).
   - Prefira uma senha **só com letras e números**: evita ter de codificar caracteres especiais na URL. Se tiver `@ # / : ? %`, troque por `%40 %23 %2F %3A %3F %25` dentro da `DATABASE_URL`.
3. Espere o projeto ficar pronto (1–2 min) e clique em **Connect** (botão no topo do painel do projeto).
4. Copie a string de conexão do **Session pooler** (porta **5432**). Ela é parecida com:

```
postgresql://postgres.SEUPROJETO:[YOUR-PASSWORD]@aws-0-REGIAO.pooler.supabase.com:5432/postgres
```

Troque `[YOUR-PASSWORD]` pela senha do passo 2 (sem os colchetes). Essa é a sua `DATABASE_URL`.

> **Por que "Session pooler"?** A "Direct connection" do Supabase usa só IPv6 e pode não funcionar a partir do Render; o Session pooler funciona em IPv4 e aceita as migrations do Prisma. Não use o "Transaction pooler" (porta 6543) para as migrations.

5. Variáveis desta etapa:

```
DATABASE_URL=postgresql://postgres.SEUPROJETO:SUASENHA@aws-0-REGIAO.pooler.supabase.com:5432/postgres
DATABASE_SSL=true
```

`DATABASE_SSL=true` é obrigatório: o Supabase exige conexão com SSL. A API conecta com SSL; se o comando de migration do Prisma reclamar de SSL, acrescente `?sslmode=require` ao fim da `DATABASE_URL`.

6. **Proteger as tabelas (recomendado, depois que as migrations rodarem na etapa C):** o Supabase expõe as tabelas do schema `public` por uma API própria. Nosso app **não usa** essa API, então ligue o RLS (segurança por linha) para que ela não leia nada. No painel: **SQL Editor → New query**, cole e execute:

```sql
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockMovement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
```

Isso não atrapalha a nossa API (ela conecta como dona das tabelas). Testei localmente: com o RLS ligado, o smoke test continua 27/27 e um papel que não é dono enxerga 0 linhas.

7. **Plano gratuito:** o Supabase **pausa projetos sem uso por cerca de uma semana**. Se isso acontecer, abra o painel e clique em **Restore/Resume project**. Faça isso antes de apresentar.

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

Por que `--include=dev`: o `prisma` (CLI de `generate` e `migrate deploy`) é dependência de desenvolvimento; assim ele existe no build mesmo que o Render defina `NODE_ENV=production`. As migrations rodam no build porque o plano gratuito não tem terminal (shell).

3. Em **Environment Variables** crie (**não** crie `PORT`: o Render define sozinho, e o servidor já escuta em `0.0.0.0`):

| Variável | Valor / como obter |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `DATABASE_URL` | da seção B |
| `DATABASE_SSL` | `true` |
| `JWT_SECRET` | segredo forte, gerado no seu computador: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` (em produção precisa de **pelo menos 32 caracteres**, senão a API nem inicia) |
| `JWT_EXPIRES_IN` | `2h` |
| `CORS_ORIGIN` | provisório: `http://localhost:5173` (será trocado na etapa F) |

`ADMIN_NAME/EMAIL/PASSWORD` **não** vão para o Render: o admin é criado na etapa D.

4. Clique em **Create Web Service** e acompanhe os logs. Deve aparecer `Applying migration ... init` e, no fim, `EstoqueFácil API rodando na porta ...`. Teste no navegador: `https://SEU-SERVICO.onrender.com/api/health` → `{"status":"ok",...}`.
5. Agora volte à etapa **B.6** e execute o SQL do RLS (as tabelas já existem).

> **Aviso (plano gratuito do Render):** a API "dorme" após ~15 minutos sem uso e leva **cerca de 1 minuto** para acordar. **Antes de apresentar, abra `/api/health` e espere responder.**

---

## D. Criar o ADMIN no banco de produção

Rode na **sua máquina**, dentro de `backend/`, passando as variáveis **só naquele comando** (nada é salvo em arquivo). Use os mesmos `DATABASE_URL`/`DATABASE_SSL` do Render. O `JWT_SECRET` aqui é só para o programa carregar (qualquer texto com 32 ou mais caracteres serve; não precisa ser o de produção).

**PowerShell (Windows):**

```powershell
cd backend
$env:DATABASE_URL="postgresql://postgres.SEUPROJETO:SUASENHA@aws-0-REGIAO.pooler.supabase.com:5432/postgres"
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
DATABASE_URL="postgresql://postgres.SEUPROJETO:SUASENHA@aws-0-REGIAO.pooler.supabase.com:5432/postgres" \
DATABASE_SSL=true JWT_SECRET=texto-qualquer-so-para-carregar-o-programa-0123456789 \
ADMIN_NAME="Administrador" ADMIN_EMAIL="seu-admin@exemplo.com" ADMIN_PASSWORD="uma-senha-forte-com-8+" \
npm run seed:admin
```

Variáveis do terminal têm prioridade sobre o `backend/.env` local, então o banco de produção é usado. Deve aparecer `ADMIN ... criado com sucesso.` (a senha nunca é impressa). Pode repetir sem problema. Para conferir, abra **Table Editor → User** no Supabase.

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
4. **Deploy**. O `frontend/vercel.json` faz todas as rotas (ex.: `/products/3`) abrirem o `index.html`, então recarregar a página não dá 404.

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
| Build do Render falha em `migrate deploy` ("Can't reach database server") | Você usou a *Direct connection* (IPv6): troque pela string do **Session pooler**. Confira também a senha (e caracteres especiais codificados). |
| Erro de **SSL** (`SSL required`, `no pg_hba.conf entry`, `self-signed certificate`) | Defina `DATABASE_SSL=true`. Se for o comando do Prisma (migrate), acrescente `?sslmode=require` à `DATABASE_URL`. |
| `password authentication failed` | Senha errada na `DATABASE_URL`. No Supabase: **Project Settings → Database → Reset database password**, e atualize no Render. |
| API não inicia: "JWT_SECRET deve ter pelo menos 32 caracteres" | Gere outro segredo com o comando da seção C. |
| Mudei `VITE_API_URL` e nada mudou | Variáveis `VITE_` são embutidas **no build**. Faça um novo deploy na Vercel (**Deployments → Redeploy**). |
| API retorna erros 500 depois de dias parada | O projeto Supabase pode ter sido **pausado** (plano gratuito): restaure no painel. |
| Login do admin falha | O `seed:admin` foi rodado contra outro banco. Rode de novo com o `DATABASE_URL` de produção. |
| "too many connections" / "remaining connection slots" | O Supabase gratuito tem poucas conexões; a API já usa no máximo 5. Evite deixar outras ferramentas (Prisma Studio, scripts) abertas ao mesmo tempo. |
