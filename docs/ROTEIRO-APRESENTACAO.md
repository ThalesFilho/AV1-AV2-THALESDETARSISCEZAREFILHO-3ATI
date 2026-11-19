# Roteiro de apresentação — EstoqueFácil

Aluno: THALES DE TARSIS CEZARE FILHO — 3º A TI. Texto em primeira pessoa, para eu falar com minhas palavras. Os tempos são aproximados.

## Antes de começar (checklist)

- [ ] **Acordar a API no Render**: abrir `https://<minha-api>.onrender.com/api/health` e esperar `{"status":"ok"}` (pode levar ~1 minuto; fazer isso 5 minutos antes).
- [ ] Ter o **admin** criado no banco de produção (`npm run seed:admin`, ver `docs/DEPLOY.md` seção D) e **dois usuários comuns** já cadastrados (A e B), cada um com 1–2 produtos; um deles com um produto de estoque baixo.
- [ ] **Postman** aberto com a coleção `EstoqueFacil.postman_collection.json` importada e a variável `baseUrl` apontando para o ambiente que vou usar (local `http://localhost:3000` ou o Render).
- [ ] **Banco acessível** (PostgreSQL local rodando, ou o Supabase) e `backend` rodando (`npm run dev`) para a parte do AV1; `npm run prisma:studio` pronto (abre em `http://localhost:5555`) ou o **Table Editor** do Supabase aberto.
- [ ] Abas abertas: site na Vercel, jwt.io, Postman, Prisma Studio, VS Code com a pasta do projeto.
- [ ] **Plano B sem internet**: rodar tudo local — PostgreSQL local (ou instalado antes), `cd backend && npm run dev`, `cd frontend && npm run dev` e abrir `http://localhost:5173`. Ter o `docs/CHECKLIST-TESTE-MANUAL.md` e prints das telas como último recurso.
- [ ] Saber o login do admin e dos usuários A/B de cor (anotados fora do repositório).

---

# Parte 1 — AV1 (API) · ~10 minutos

## 1. Objetivo (1 min)

"Meu projeto se chama **EstoqueFácil**. É uma API para controlar estoque de pequenos comércios. O problema que resolvo: em planilha ninguém impede vender mais do que existe e não fica registro de quem mexeu. Na minha API o saldo **só muda por movimentações** de entrada e saída, e uma saída maior que o saldo é **bloqueada**."

Tecnologias: Node.js + Express, Prisma 7.10.0, PostgreSQL (Supabase), JWT e bcrypt (`backend/package.json`).

## 2. Estrutura e modelagem (2 min)

Mostrar no VS Code:

- **Pastas do MVC** em `backend/src/`: `routes` (URLs), `controllers` (recebem e respondem), `services` (regras de negócio), `models` (únicos que falam com o banco), `middlewares`, `validators`, `utils`. "A *view* do meu MVC é o JSON que a API devolve" (`utils/serializers.js`).
- **Modelagem** em `backend/prisma/schema.prisma`: três tabelas.
  - `User` (e-mail único, `passwordHash`, papel USER/ADMIN),
  - `Product` (`unitPrice` Decimal(10,2), `minStock`, `quantity`; único por dono + SKU),
  - `StockMovement` (ENTRY/EXIT, quantidade, observação; apaga em cascata com o produto).
- Mostrar o diagrama Mermaid do `README.md`.
- Falar da **migration** em `backend/prisma/migrations/.../migration.sql`: é o SQL versionado que cria as tabelas (`npm run prisma:deploy`).

## 3. CRUD e persistência (2 min)

1. No Postman, rodar na pasta **Roteiro AV1**: `1. Health`, `2. Registro`, `3. Login` (guarda o token sozinho), `5. Criar produto`, `6. Listar`, `7. Atualizar`.
2. Abrir o **Prisma Studio** (ou o Table Editor do Supabase) e mostrar a tabela `Product` com a linha criada e a tabela `User` com o `passwordHash` começando com `$2b$10$` ("a senha nunca fica em texto puro").
3. Atualizar no Postman e recarregar a tabela para ver a mudança; falar que o PUT com o campo `quantity` retorna 400 (o saldo só muda por movimentação).

## 4. Regra de negócio — aceita e bloqueada (2 min)

No Postman (mesma pasta):

1. `8. Entrada de 10` → resposta traz `product.quantity: 10`.
2. `9. Saída de 3 (aceita)` → saldo 7, **201**.
3. `10. Saída de 50 (bloqueada 422)` → **422** com a mensagem `Estoque insuficiente: disponível 7, solicitado 50.`
4. Mostrar no Prisma Studio: o saldo continua 7 e a tabela `StockMovement` só tem a entrada e a saída aceita (a bloqueada não grava nada).

Explicar o código (`backend/src/services/movementService.js` e `models/productModel.js`): "Não leio o saldo para comparar e depois gravar, porque dois pedidos ao mesmo tempo leriam o mesmo saldo. Faço um único `UPDATE ... WHERE quantity >= q` dentro de uma transação. Só se uma linha foi alterada eu crio a movimentação." Posso citar o teste de concorrência do `tools/smoke-test.mjs`: 5 saídas de 3 ao mesmo tempo em saldo 10 → 3 sucessos, 2 erros 422, saldo final 1.

## 5. Cadastro, login e JWT (2 min)

1. Mostrar o `2. Registro` (201) e o `3. Login` (200 com `token` e `user`).
2. Copiar o token (aba *Body* da resposta) e colar em **jwt.io**: aparecem o *header* (`HS256`) e o *payload* (`sub` = id do usuário, `role`, `iat`, `exp`). "O token é **assinado**, não escondido: por isso não coloco dados sensíveis nele. Sem o segredo (`JWT_SECRET`) ninguém consegue forjar a assinatura; **não vou colar o segredo no site**." (o jwt.io vai dizer "invalid signature" porque não informo o segredo — é esperado).
3. Mostrar `services/authService.js` (bcrypt custo 10, `jwt.sign`) e `middlewares/authenticate.js` (lê `Authorization: Bearer`, valida e carrega o usuário do banco).

## 6. Erros 401 e 403 (1 min)

- **401 — sem token**: no Postman, a requisição **`4. Listar SEM token => 401`** (`GET {{baseUrl}}/api/products`, sem cabeçalho Authorization). Resposta: `{"error":{"code":"UNAUTHENTICATED",...}}`.
- **403 — operação não autorizada**: a requisição **`11c. Outro usuário acessa produto de A => 403`** (`GET {{baseUrl}}/api/products/{{productId}}` com o token do usuário **B**, `tokenB`; antes rodar `11a` e `11b` para cadastrar/logar o B). Resposta: `{"error":{"code":"FORBIDDEN",...}}`.
- Explicar: "**401** = não sei quem você é (sem token ou token inválido). **403** = sei quem você é, mas você não pode mexer nisso. Se o produto não existir, retorno 404 antes de verificar a permissão." Regra em `utils/assertOwnerOrAdmin.js`.

Fechar com `12. Apagar produto` (204).

---

# Parte 2 — AV2 (frontend) · ~10 minutos

## 1. Contextualização (1–2 min)

- **Problema**: controle de estoque feito em papel/planilha leva a erro, falta de aviso de estoque baixo e vendas sem saldo.
- **Público-alvo**: pequenos comerciantes e donos de lojinhas, que precisam de algo simples; e o administrador, que acompanha tudo.
- **Solução**: um sistema web com login, cadastro de produtos, entradas e saídas, alerta de estoque baixo e histórico — usando a API que fiz na AV1.

## 2. Demonstração na URL pública (5–6 min)

Abrir `https://<meu-site>.vercel.app` (API já acordada).

1. **Cadastro**: criar um usuário novo; mostrar a validação no formulário (senha curta, senhas diferentes) → vai para o login com aviso verde.
2. **Login**: entrar; mostrar a navbar com meu nome.
3. **CRUD**: criar produto (preço `2,50`), editar, ver na lista; usar a busca e o filtro "Somente estoque baixo"; excluir com a janela de confirmação.
4. **Regra de negócio**: abrir o produto → entrada 10 → saída 3 → saída 50 e mostrar o **alerta vermelho** com a mensagem do backend (`Estoque insuficiente: disponível 7, solicitado 50.`); o histórico atualiza sem recarregar.
5. **Usuário comum x admin**: com o usuário comum, copiar o endereço de um produto de outro usuário na barra do navegador → "Você não tem permissão..." + aviso "Acesso negado". Sair e entrar como **admin**: selo "Administrador", coluna **Responsável** e produtos de todos.
6. **Erros**: senha errada no login; SKU duplicado; (opcional) alterar `estoque.token` no DevTools → "Sua sessão expirou. Entre novamente."
7. **Logout**.

## 3. Explicação técnica (3 min)

Mostrar no VS Code, em `frontend/src/`:

- **Componentes React**: componentes de tela em `pages/`, peças reutilizáveis em `components/ui` (Button, Input, Modal, Toast...), listas em `components/products`. "Cada pedaço da tela é uma função que devolve JSX e recebe dados por *props*."
- **Chamadas à API**: `api/client.js` (um `fetch` com URL base de `VITE_API_URL`, token no cabeçalho `Authorization`, erro padronizado) e `api/products.js`. Mostrar também as abas *Network* do navegador com a chamada e o 422.
- **Estado de login**: `context/AuthContext.jsx` guarda o usuário; `routes/ProtectedRoute.jsx` bloqueia páginas sem login.
- **Tailwind CSS 4.3.0**: classes utilitárias direto no JSX (ex.: `rounded-md bg-teal-700 px-4 py-2`); só `@import "tailwindcss";` em `index.css` e o plugin em `vite.config.js`. Componentes inspirados no **HyperUI** (navbar, tabela, cartões, modal), listados em `docs/FONTES-COMPONENTES.md`; o login/cadastro eu escrevi no mesmo estilo porque o site não tem esse componente.
- **Decisões**: não bloquear a saída no frontend (o backend é a fonte da verdade e o usuário vê a mensagem dele); o frontend esconde botões por permissão, mas **quem realmente protege é o backend**; sem bibliotecas extras (só `fetch`, React Router e Tailwind).

## 4. Fechamento (30 s)

"Resumindo: API com MVC, JWT, regra de estoque atômica e banco PostgreSQL (Supabase) com Prisma; frontend em React e Tailwind consumindo essa API, publicado na nuvem. Fico à disposição para perguntas."

---

## Se algo der errado na hora

| Problema | O que faço |
|---|---|
| Site/API não responde | A API do Render pode estar dormindo: abro `/api/health` e espero ~1 minuto. |
| Sem internet | Plano B local (checklist acima). |
| Esqueci o token do Postman | Rodo de novo `3. Login`. |
| Erro inesperado no navegador | Abro o DevTools (F12) → aba *Network* e mostro o que a API respondeu. |
