// Tabela adaptada do componente "Tables - Base" do HyperUI (licença MIT):
// https://www.hyperui.dev/components/application/tables
// Mantido: <div class="overflow-x-auto"> com <table> divide-y, cabeçalho em negrito e células px-3 py-2.
// Adaptado: colunas do estoque (nome, SKU, categoria, preço, saldo, mínimo, responsável, ações), badge de
// estoque baixo, ações Ver/Editar/Excluir e, no celular, cartões no lugar da tabela.
import { Link } from "react-router-dom";
import Badge from "../ui/Badge.jsx";
import { canManage, formatCurrency } from "../../utils/format.js";

const actionClass = "rounded-md px-2 py-1 text-sm font-medium transition focus-visible:outline-2";

function Actions({ product, user, onEdit, onDelete }) {
  const allowed = canManage(product, user);
  return (
    <div className="flex flex-wrap gap-1">
      <Link to={`/products/${product.id}`} className={`${actionClass} text-teal-700 hover:bg-teal-50`}>
        Ver
      </Link>
      {allowed && (
        <>
          <button type="button" onClick={() => onEdit(product)} className={`${actionClass} text-gray-700 hover:bg-gray-100`}>
            Editar
          </button>
          <button type="button" onClick={() => onDelete(product)} className={`${actionClass} text-red-600 hover:bg-red-50`}>
            Excluir
          </button>
        </>
      )}
    </div>
  );
}

export default function ProductTable({ products, user, onEdit, onDelete }) {
  const isAdmin = user?.role === "ADMIN";
  return (
    <>
      {/* Desktop: tabela */}
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
        <table className="min-w-full divide-y-2 divide-gray-200 text-sm">
          <thead className="ltr:text-left rtl:text-right">
            <tr className="*:font-medium *:text-gray-900">
              <th className="px-3 py-2 whitespace-nowrap">Nome</th>
              <th className="px-3 py-2 whitespace-nowrap">SKU</th>
              <th className="px-3 py-2 whitespace-nowrap">Categoria</th>
              <th className="px-3 py-2 whitespace-nowrap">Preço</th>
              <th className="px-3 py-2 whitespace-nowrap">Saldo</th>
              <th className="px-3 py-2 whitespace-nowrap">Mínimo</th>
              {isAdmin && <th className="px-3 py-2 whitespace-nowrap">Responsável</th>}
              <th className="px-3 py-2 whitespace-nowrap">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((p) => (
              <tr key={p.id} className="*:text-gray-900 *:first:font-medium">
                <td className="px-3 py-2 whitespace-nowrap">{p.name}</td>
                <td className="px-3 py-2 whitespace-nowrap">{p.sku}</td>
                <td className="px-3 py-2 whitespace-nowrap">{p.category}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatCurrency(p.unitPrice)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="mr-2">{p.quantity}</span>
                  {p.lowStock && <Badge color="red">Estoque baixo</Badge>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{p.minStock}</td>
                {isAdmin && <td className="px-3 py-2 whitespace-nowrap">{p.owner?.name}</td>}
                <td className="px-3 py-2 whitespace-nowrap">
                  <Actions product={p} user={user} onEdit={onEdit} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Celular: cartões */}
      <ul className="space-y-3 md:hidden">
        {products.map((p) => (
          <li key={p.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500">
                  {p.sku} · {p.category}
                </p>
              </div>
              {p.lowStock && <Badge color="red">Estoque baixo</Badge>}
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-gray-500">Preço</dt>
                <dd>{formatCurrency(p.unitPrice)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Saldo</dt>
                <dd className="font-medium">{p.quantity}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Mínimo</dt>
                <dd>{p.minStock}</dd>
              </div>
            </dl>
            {isAdmin && <p className="mt-2 text-xs text-gray-500">Responsável: {p.owner?.name}</p>}
            <div className="mt-3 border-t border-gray-100 pt-2">
              <Actions product={p} user={user} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
