# Fontes dos componentes (HyperUI)

Componentes de interface baseados no **HyperUI** (<https://www.hyperui.dev>), biblioteca de componentes Tailwind CSS v4. O rodapé do site informa "Released under the MIT License" (licença completa em <https://github.com/markmead/hyperui/blob/main/LICENSE>). As páginas abaixo foram acessadas em 19/11/2026 e o HTML foi lido de verdade antes da adaptação.

| Componente | Arquivo | URL acessada | Licença | O que foi adaptado |
|---|---|---|---|---|
| Navbar responsiva (Headers — "Icon and links on the left, call to actions on the right") | `frontend/src/components/layout/Navbar.jsx` | <https://www.hyperui.dev/components/marketing/headers> | MIT | Texto em português; cor teal do projeto; ícone próprio (não foi usado o logotipo do HyperUI); links reais com `react-router`; nome do usuário, selo "Administrador" e botão Sair; o menu móvel usa estado do React (`aria-expanded`/`aria-controls`) em vez do atributo HTML `popover` e do `<script>` do exemplo. |
| Tabela (Tables — "Base") | `frontend/src/components/products/ProductTable.jsx` | <https://www.hyperui.dev/components/application/tables> | MIT | Colunas do estoque, preço em R$ pt-BR, badge "Estoque baixo", ações Ver/Editar/Excluir, coluna "Responsável" para ADMIN; no celular a tabela é trocada por cartões. |
| Cartões de resumo (Stats) | `frontend/src/components/ui/StatCard.jsx` | <https://www.hyperui.dev/components/application/stats> | MIT | Textos em português e dados reais (total de produtos, unidades, estoque baixo); selo colorido com ícone SVG no lugar da variação percentual. |
| Modal (Modals — "Base") | `frontend/src/components/ui/Modal.jsx` | <https://www.hyperui.dev/components/application/modals> | MIT | Virou componente React em torno do `<dialog>` nativo (`showModal()`); fecha com Esc e clique fora; devolve o foco ao elemento que abriu; botão "×"; título, descrição e rodapé de botões por propriedades. Usado também em `ConfirmDialog.jsx`. |
| Formulário de login/cadastro | `frontend/src/pages/LoginPage.jsx`, `frontend/src/pages/RegisterPage.jsx`, `frontend/src/components/layout/AuthShell.jsx` | **Não existe fonte** — veja abaixo | — | Escrito por mim no mesmo estilo visual dos componentes HyperUI (cartão branco, borda fina, cor teal). |

## Nota de honestidade sobre o login/cadastro

O HyperUI **não possui** uma categoria de formulário de login/cadastro: a URL `https://www.hyperui.dev/components/marketing/sign-ins` retornou **404** e os índices `/components/application` e `/components/marketing` não listam nenhuma categoria de login (também conferido no `llms.txt` do site). Por isso esses formulários **não são adaptação** de um componente do HyperUI; foram escritos do zero no mesmo estilo, e nenhum componente desta tabela está atribuído a eles.

## Observações

- O HTML do HyperUI foi lido pela versão em texto/Markdown das páginas, não pelo botão "Copy HTML"; por isso pode haver pequenas diferenças de espaçamento em relação ao original.
- Os demais componentes (Button, Input, Select, Spinner, Alert, EmptyState, Badge, Toast, ConfirmDialog) são próprios, escritos em JSX com Tailwind.
