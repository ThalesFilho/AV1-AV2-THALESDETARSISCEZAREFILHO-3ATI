# Checklist de teste manual — EstoqueFácil

Antes de começar: MySQL ligado, `backend` rodando (`npm run dev` em `backend/`, porta 3000) e `frontend` rodando (`npm run dev` em `frontend/`, abra <http://localhost:5173>). Tenha o admin criado com `npm run seed:admin`.

## Cadastro e login
- [ ] Abrir `/register`, enviar vazio e ver as mensagens de campo obrigatório.
- [ ] Senha com menos de 8 caracteres => erro; confirmação diferente => erro "As senhas não conferem."
- [ ] Cadastrar um usuário válido => vai para `/login` com aviso "Cadastro realizado!".
- [ ] Cadastrar o mesmo e-mail de novo => erro "Este e-mail já está cadastrado."
- [ ] Login com senha errada => "E-mail ou senha inválidos."
- [ ] Login correto => abre `/products`; navbar mostra seu nome; rodapé mostra o texto do projeto.
- [ ] **Logout**: clicar em "Sair" => volta para `/login`.
- [ ] **Rota protegida deslogado**: sem login, abrir `/products` => redireciona para `/login`; após entrar, volta para a página pedida.

## Produtos (CRUD)
- [ ] Lista vazia: mensagem "Nenhum produto cadastrado" com botão para cadastrar.
- [ ] "Novo produto": enviar vazio => erros; preencher (preço `2,50`) e criar => aviso "Produto criado." e a linha aparece com "Estoque baixo" (saldo 0 <= mínimo).
- [ ] Cartões de resumo atualizam (total, unidades, estoque baixo).
- [ ] Criar outro produto com o mesmo SKU => erro no campo SKU.
- [ ] Buscar por nome/SKU/categoria (a lista atualiza ~0,4 s depois de parar de digitar); termo sem resultado => "Nenhum produto encontrado".
- [ ] Marcar "Somente estoque baixo" => só aparecem produtos com saldo <= mínimo.
- [ ] Editar (não há campo de saldo; vê o texto "O saldo é alterado por entradas e saídas.") => aviso "Produto atualizado.".
- [ ] Esc e clique fora fecham o modal.
- [ ] Excluir => pede confirmação; confirmar => "Produto excluído."

## Movimentações
- [ ] Abrir "Ver" em um produto: saldo em destaque e "Saldo disponível: N".
- [ ] **Entrada** de 10 => saldo 10 e linha "+10" no histórico (sem recarregar a página).
- [ ] **Saída aceita** de 3 => saldo 7 e linha "−3".
- [ ] **Saída bloqueada** de 50 => alerta vermelho "Estoque insuficiente: disponível 7, solicitado 50." e saldo continua 7.
- [ ] Quantidade vazia/0 => erro no campo.

## Permissões
- [ ] **Produto alheio via URL**: com o usuário A, abrir `/products/<id de um produto do usuário B>` => "Você não tem permissão para acessar este produto." e aviso "Acesso negado.".
- [ ] Abrir `/products/99999999` => "Produto não encontrado."
- [ ] **Admin**: entrar com o admin => selo "Administrador", coluna "Responsável" e produtos de todos os usuários; consegue editar e movimentar produtos de outros.

## Falhas e estados especiais
- [ ] **Token adulterado**: com a sessão aberta, no DevTools (Application > Local Storage) alterar `estoque.token` para qualquer texto e recarregar => aviso "Sua sessão expirou. Entre novamente." e vai para `/login`.
- [ ] **API fora do ar**: com a lista aberta, parar o backend e clicar em "Somente estoque baixo" => alerta "Não foi possível conectar ao servidor..." com botão "Tentar novamente"; religar o backend e clicar nele => a lista volta.
- [ ] Endereço inexistente (ex.: `/xyz`) => página 404 amigável.

## Celular
- [ ] No DevTools (Ctrl+Shift+M) usar 360 px: sem rolagem horizontal, produtos em cartões, menu hambúrguer abre/fecha e tem "Sair".
- [ ] Repetir em 768 px e 1280 px (tabela no desktop).
