# Perguntas prováveis do professor

Cada item tem a resposta curta e o arquivo para mostrar. Caminhos a partir da raiz do repositório.

## Autenticação e segurança

**1. O que é um JWT?**
É um texto em 3 partes separadas por ponto: cabeçalho, conteúdo (*payload*) e assinatura. O meu leva `sub` (id do usuário), `role`, `iat` e `exp`. O servidor gera no login e confere a assinatura a cada requisição.
Mostrar: `backend/src/services/authService.js` (`jwt.sign`) e o token no jwt.io.

**2. O JWT é criptografado?**
Não. Ele é **assinado**, não escondido: qualquer um decodifica o conteúdo. Por isso não coloco senha nem dado sensível nele. A assinatura (HS256 com `JWT_SECRET`) só garante que ninguém alterou.
Mostrar: jwt.io.

**3. O que impede alguém de forjar um token?**
A assinatura depende do `JWT_SECRET`, que só o servidor conhece. Se mudar qualquer letra, a verificação falha e a API devolve 401. O `verify` aceita só `HS256`.
Mostrar: `backend/src/middlewares/authenticate.js`.

**4. Como a senha é guardada? O que é bcrypt e salt?**
Guardo só o **hash** (`passwordHash`), nunca a senha. O bcrypt é lento de propósito e usa um **salt** (texto aleatório) diferente por senha, que fica dentro do próprio hash (`$2b$10$...`): senhas iguais geram hashes diferentes. O custo 10 significa 2¹⁰ rodadas.
Mostrar: `authService.js` (`bcrypt.hash(password, 10)`) e a coluna `passwordHash` no Prisma Studio.

**5. Por que não usar MD5 ou SHA simples?**
São rápidos demais: dá para testar bilhões de senhas por segundo. O bcrypt é lento e tem salt, o que dificulta ataques.

**6. Por que a mensagem de login é genérica ("E-mail ou senha inválidos")?**
Para não revelar se o e-mail existe (enumeração de usuários). Também comparo com um hash falso quando o e-mail não existe, para o tempo de resposta ser parecido.
Mostrar: `authService.js` (`DUMMY_HASH`).

**7. Qual a diferença entre autenticação e autorização?**
Autenticação = provar **quem** você é (login/token, `authenticate.js`). Autorização = o que você **pode** fazer (dono ou admin, `assertOwnerOrAdmin.js`).

**8. Qual a diferença entre 401 e 403?**
401: não sei quem você é (sem token, inválido ou vencido). 403: sei quem é, mas não pode acessar aquilo (produto de outro usuário).
Mostrar: Postman `4. Listar SEM token => 401` e `11c ... => 403`.

**9. Por que responde 404 antes de 403?**
Primeiro verifico se o recurso existe; só depois se é do usuário. Assim a regra fica previsível: inexistente = 404, existe mas é alheio = 403.
Mostrar: `backend/src/services/productService.js` (`getAuthorizedProduct`).

**10. O usuário pode se cadastrar como ADMIN?**
Não. O cadastro ignora qualquer papel enviado e cria sempre `USER`. O admin só nasce pelo script `npm run seed:admin`.
Mostrar: `authService.register` e `backend/src/scripts/seedAdmin.js`.

**11. O que é um middleware?**
Função `(req, res, next)` que roda **entre** a requisição e o controller; pode barrar (erro) ou deixar passar (`next()`). Os meus: `authenticate`, `validate`, `notFound`, `errorHandler`.
Mostrar: `backend/src/middlewares/authenticate.js` e `routes/index.js` (`router.use("/products", authenticate)`).

**12. Por que o `authenticate` busca o usuário no banco se o token já tem os dados?**
Para garantir que o usuário ainda existe e usar o papel atual dele, não o que estava no token quando foi emitido.

**13. Onde o token fica no frontend e quais os riscos?**
No `localStorage` (chave `estoque.token`). Risco: se houver uma falha de XSS (script malicioso na página), ele pode ler o token. O React escapa o texto por padrão, o que ajuda. Uma alternativa mais segura seria cookie `HttpOnly`, mas exigiria outro desenho (CSRF, cookies entre domínios).
Mostrar: `frontend/src/api/client.js`.

**14. O que acontece quando o token vence ou é adulterado?**
A API devolve 401; o `client.js` limpa o token e dispara o evento `auth:expired`; o `AuthContext` mostra "Sua sessão expirou. Entre novamente." e vai ao login.
Mostrar: `client.js` e `frontend/src/context/AuthContext.jsx`.

**15. Esconder botões no frontend basta para proteger?**
Não. É só conveniência. Quem protege é o backend (`authenticate` + `assertOwnerOrAdmin`); mesmo chamando a API direto, um usuário não acessa o que não é dele.
Mostrar: `frontend/src/utils/format.js` (`canManage`) x `backend/src/utils/assertOwnerOrAdmin.js`.

**16. Por que validar no frontend e no backend?**
O frontend melhora a experiência (resposta imediata), mas pode ser burlado. O backend é a validação que vale.
Mostrar: `LoginPage.jsx` x `backend/src/validators/index.js`.

**17. Como evito SQL injection?**
Uso o Prisma (consultas parametrizadas). Na única consulta SQL crua (estoque baixo) uso `Prisma.sql` com parâmetros, nunca concatenação de texto.
Mostrar: `backend/src/models/productModel.js`.

**18. O que é CORS e por que existe?**
É uma regra do **navegador**: um site de uma origem só pode ler respostas de outra origem se ela permitir. Meu frontend (Vercel) e minha API (Render) têm origens diferentes, então a API precisa liberar a origem do frontend (`CORS_ORIGIN`). Antes do pedido real, o navegador faz um OPTIONS ("pré-voo") por causa do cabeçalho `Authorization`.
Mostrar: `backend/src/app.js` e `backend/src/config/env.js` (`corsOrigins`).

**19. O CORS protege minha API contra ataques?**
Não por si só: ele só instrui o navegador. Postman ou `curl` ignoram o CORS. A proteção real é a autenticação/autorização.

**20. Por que `VITE_API_URL` pode ficar no frontend mas o `JWT_SECRET` não?**
Variáveis `VITE_*` são embutidas no código que vai para o navegador: são **públicas**. Segredos ficam só no backend (`.env`, fora do GitHub).
Mostrar: `frontend/.env.example`, `backend/.env.example`, `.gitignore`.

## Banco de dados e Prisma

**21. O que é o Prisma e o que mudou no Prisma 7?**
ORM: escrevo `prisma.product.findMany(...)` em vez de SQL. No Prisma 7 o cliente usa um **driver adapter**: um driver JavaScript do banco; no meu caso `@prisma/adapter-pg` + `pg` (PostgreSQL). A URL do banco foi para o `prisma.config.js`.
Mostrar: `backend/src/lib/prisma.js`, `backend/prisma.config.js`.

**22. O que é uma migration? Qual a diferença entre `migrate dev` e `migrate deploy`?**
É um arquivo SQL versionado que descreve a mudança no banco. `migrate dev` (desenvolvimento) cria a migration a partir do schema e aplica; `migrate deploy` (produção) só aplica as que já existem. Nunca uso `migrate reset` (apaga dados).
Mostrar: `backend/prisma/migrations/.../migration.sql`.

**23. Por que as versões do Prisma são exatas (`7.10.0`, sem `^`)?**
Para todos terem exatamente a mesma versão (exigência do enunciado) e o build ser reproduzível; o `package-lock.json` e `npm ci` garantem. O `tools/check-pins.mjs` confere.
Mostrar: `backend/package.json`, `backend/.npmrc`, `tools/check-pins.mjs`.

**24. Como a transação impede saldo negativo?**
A saída é um único `UPDATE ... WHERE quantity >= q` dentro de `prisma.$transaction`. O banco trava a linha, então duas saídas simultâneas são conferidas uma por vez. Se o saldo não cobre, nenhuma linha muda (`count` 0) → 422 e a movimentação não é criada.
Mostrar: `backend/src/models/productModel.js` (`decrementIfEnough`) e `services/movementService.js`.

**25. Por que não "ler o saldo, comparar e gravar"?**
Seria uma *race condition*: dois pedidos leem saldo 10, ambos veem que dá para tirar 6 e o saldo fica negativo. O teste de concorrência prova: 5 saídas de 3 ao mesmo tempo em saldo 10 → 3 sucessos, 2 erros 422, saldo 1.
Mostrar: `tools/smoke-test.mjs` (cenário "concorrência").

**26. O que é `onDelete: Cascade`?**
Ao apagar o produto, o banco apaga também as movimentações dele (sem sobrar registros órfãos). Está no `schema.prisma` no model `StockMovement`.

**27. Por que `Decimal(10,2)` para o preço e não `Float`?**
Float tem erros de arredondamento (0.1 + 0.2). Para dinheiro uso decimal exato; no JSON converto para número em `serializers.js`.

**28. Como o SKU duplicado vira erro 409?**
Há uma chave única `(ownerId, sku)`. Ao violar, o Prisma lança o erro `P2002`, que o `errorHandler` converte em 409 CONFLICT. O mesmo vale para o e-mail.
Mostrar: `schema.prisma` (`@@unique`) e `backend/src/middlewares/errorHandler.js`.

**29. Por que o saldo não pode ser editado direto?**
Para manter o histórico confiável: todo ajuste é uma movimentação registrada (quem, quando, quanto). Por isso o PUT recusa o campo `quantity` (400).
Mostrar: `backend/src/validators/index.js` (`validateUpdateProduct`).

**30. Como a busca ignora maiúsculas/minúsculas no PostgreSQL?**
No PostgreSQL o `contains` diferencia maiúsculas; por isso uso `mode: "insensitive"` do Prisma, que gera `ILIKE`.
Mostrar: `productModel.js` .

## Arquitetura do backend

**31. O que é MVC no seu projeto? Onde está a "view"?**
Model (`models/`, acesso ao banco), Controller (`controllers/`, recebe e responde) e a view é o **JSON** devolvido, montado por `utils/serializers.js`. Entre controller e model há o **service**, onde ficam as regras.

**32. Por que o controller não acessa o Prisma nem tem regra?**
Separação de responsabilidades: cada camada tem um trabalho, o que facilita testar e explicar. Regras no service; banco só no model.
Mostrar: `controllers/productController.js` x `services/productService.js` x `models/productModel.js`.

**33. Como o erro vira uma resposta padronizada?**
Lanço `AppError` (status + código + mensagem) em qualquer camada; o `errorHandler` (último middleware) devolve `{"error":{"code","message","details?"}}`. Erros inesperados viram 500 sem mostrar o *stack* em produção.
Mostrar: `utils/AppError.js`, `middlewares/errorHandler.js`.

**34. Para que servem `.env` e `.env.example`?**
`.env` guarda os valores reais (senha do banco, `JWT_SECRET`) e **não** vai para o git. O `.env.example` só lista os nomes, com valores de exemplo, para quem clonar saber o que configurar.

**35. Para que servem `package-lock.json` e `npm ci`?**
O lock registra a versão exata de cada pacote (inclusive os internos). `npm ci` instala exatamente isso, de forma reproduzível, e falha se não bater com o `package.json`.

**36. Por que 201 e 204?**
201 Created: algo foi criado (cadastro, produto, movimentação). 204 No Content: apagou com sucesso e não há corpo na resposta.

## Frontend

**37. O que é uma SPA e por que o `vercel.json` tem um *rewrite*?**
SPA: uma única página HTML; o React Router troca as telas pelo navegador. Se eu recarrego `/products/3`, o servidor procuraria esse arquivo e daria 404. O rewrite manda tudo para `index.html`, e o React decide a tela.
Mostrar: `frontend/vercel.json`.

**38. O que é o Tailwind e como o usei?**
CSS por **classes utilitárias** direto no JSX (`px-4 py-2 bg-teal-700`). Versão 4.3.0 exata, ligada pelo plugin `@tailwindcss/vite` e `@import "tailwindcss";` no `index.css`; sem `tailwind.config.js`. Responsivo com prefixos (`md:`).
Mostrar: `frontend/vite.config.js`, `src/index.css`, `components/ui/Button.jsx`.

**39. Como funciona o `ProtectedRoute`?**
É um componente de rota: se há usuário, renderiza as páginas filhas (`<Outlet />`); se não, redireciona para `/login` guardando a página de origem. Enquanto valida o token mostra "Verificando sessão...".
Mostrar: `frontend/src/routes/ProtectedRoute.jsx`.

**40. O que é o Context API e por que usei?**
Forma de compartilhar dados (usuário logado, avisos) com qualquer componente sem passar *props* de pai para filho. `AuthContext` guarda `user`, `login`, `logout`; `ToastContext` mostra avisos.
Mostrar: `frontend/src/context/AuthContext.jsx`.

**41. Para que serve o `useEffect` e o `AbortController` na busca?**
O `useEffect` dispara a busca quando a chave muda. O `AbortController` cancela a requisição anterior se o usuário digita de novo, evitando que uma resposta antiga apareça depois da nova. O debounce (400 ms) reduz o número de chamadas.
Mostrar: `frontend/src/utils/useApi.js` e `useDebounce.js`.

**42. Por que `fetch` e não axios?**
A stack combinada para o projeto não inclui axios; o `fetch` já vem no navegador. Fiz um pequeno wrapper (`request`) que coloca o token, converte JSON, trata erro e timeout.
Mostrar: `frontend/src/api/client.js`.

**43. Por que o frontend não bloqueia a saída maior que o saldo?**
Porque o saldo pode ter mudado (outro usuário/aba). O backend é a fonte da verdade: o frontend envia e mostra a mensagem 422 dele ("Estoque insuficiente: disponível X, solicitado Y."). Mostro "Saldo disponível" só como informação.
Mostrar: `frontend/src/components/products/MovementForm.jsx`.

**44. O que é `key` nas listas do React?**
Identificador estável de cada item (aqui o `id` do banco) para o React saber o que mudou e não recriar tudo. Está nos `map` de `ProductTable.jsx` e `MovementHistory.jsx`.

**45. Como o site fala com a API depois de publicado?**
O frontend na Vercel usa `VITE_API_URL` (definida **no build**) apontando para o Render; a API libera essa origem em `CORS_ORIGIN`. Se mudo a variável, preciso de um novo deploy.
Mostrar: `docs/DEPLOY.md`.

**46. Por que a API do Render demora no primeiro acesso?**
No plano gratuito o serviço "dorme" depois de ~15 minutos sem uso; acordar leva cerca de 1 minuto. Por isso acesso `/api/health` antes de apresentar.

---

## Trechos prováveis para explicar em voz alta

1. **Regra do estoque** — `backend/src/models/productModel.js`, função `decrementIfEnough` (o `updateMany` com `quantity: { gte }`) e `backend/src/services/movementService.js` (o `if (count !== 1)`).
2. **Login** — `backend/src/services/authService.js` (`bcrypt.compare`, `jwt.sign`).
3. **Middleware de autenticação** — `backend/src/middlewares/authenticate.js`.
4. **Autorização por dono** — `backend/src/utils/assertOwnerOrAdmin.js` e `productService.getAuthorizedProduct`.
5. **Adapter do Prisma** — `backend/src/lib/prisma.js` e `dbConfig.js`.
6. **Cliente HTTP** — `frontend/src/api/client.js` (token, 401 → `auth:expired`).
7. **Rotas protegidas** — `frontend/src/routes/ProtectedRoute.jsx` e `App.jsx`.
8. **Formulário de saída com erro 422** — `frontend/src/components/products/MovementForm.jsx`.
