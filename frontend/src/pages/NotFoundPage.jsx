import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center">
      <p className="text-5xl font-bold text-teal-700">404</p>
      <h1 className="text-xl font-semibold text-gray-900">Página não encontrada</h1>
      <p className="text-sm text-gray-500">O endereço que você acessou não existe.</p>
      <Link to="/products" className="rounded-md bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800">
        Ir para os produtos
      </Link>
    </div>
  );
}
