// Adaptado do componente "Headers" do HyperUI (licença MIT):
// https://www.hyperui.dev/components/marketing/headers  (variante "Icon and links on the left, call to actions on the right")
// Mantido: <header> branco com altura h-16, ícone à esquerda, links e botões à direita, botão hambúrguer
// (aria-expanded/aria-controls, ícone SVG de 3 linhas) visível só no celular e menu móvel em lista.
// Adaptado: em português, cor teal do projeto, links reais (react-router), nome do usuário, selo
// "Administrador" e botão Sair; o menu móvel usa estado do React em vez do atributo popover do HTML.
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/authContext.js";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  const linkClass = ({ isActive }) => `rounded-md px-3 py-2 text-sm transition ${isActive ? "bg-teal-50 font-medium text-teal-800" : "text-gray-600 hover:bg-gray-100"}`;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/products" className="flex items-center gap-2 text-teal-700" onClick={() => setOpen(false)}>
          <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="text-lg font-bold">EstoqueFácil</span>
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <NavLink to="/products" className={linkClass}>
            Produtos
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 text-sm text-gray-700 md:flex">
            <span>{user?.name}</span>
            {isAdmin && <Badge color="teal">Administrador</Badge>}
          </div>
          <div className="hidden md:block">
            <Button variant="secondary" onClick={logout}>
              Sair
            </Button>
          </div>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="menu-movel"
            onClick={() => setOpen((v) => !v)}
            className="block rounded-sm bg-gray-100 p-2.5 text-gray-600 transition hover:text-gray-600/75 md:hidden"
          >
            <span className="sr-only">Abrir ou fechar menu</span>
            <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d={open ? "M6 6l12 12M6 18L18 6" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-movel" aria-label="Mobile" className="border-t border-gray-200 bg-white p-4 md:hidden">
          <p className="mb-3 flex items-center gap-2 px-3 text-sm text-gray-700">
            {user?.name}
            {isAdmin && <Badge color="teal">Administrador</Badge>}
          </p>
          <ul className="space-y-1">
            <li>
              <NavLink to="/products" onClick={() => setOpen(false)} className={(s) => `block ${linkClass(s)}`}>
                Produtos
              </NavLink>
            </li>
            <li>
              <button type="button" onClick={logout} className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100">
                Sair
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
