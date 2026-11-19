import { useState } from "react";
import { useAuth } from "../context/authContext.js";
import { useToast } from "../context/toastContext.js";
import { productsApi } from "../api/products.js";
import { getErrorMessage } from "../api/client.js";
import { useApi } from "../utils/useApi.js";
import { useDebounce } from "../utils/useDebounce.js";
import Alert from "../components/ui/Alert.jsx";
import Button from "../components/ui/Button.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import ProductFormModal from "../components/products/ProductFormModal.jsx";
import ProductTable from "../components/products/ProductTable.jsx";

const iconProps = { className: "size-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, "aria-hidden": true };

export default function ProductsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchText, setSearchText] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const search = useDebounce(searchText.trim(), 400);

  // Lista filtrada (tabela) e lista completa (cartões de resumo, sempre com dados reais).
  const list = useApi((signal) => productsApi.list({ search, lowStock: onlyLow }, signal), `${search}|${onlyLow}`);
  const all = useApi((signal) => productsApi.list({}, signal), "all");

  const [formState, setFormState] = useState({ open: false, product: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const products = list.data?.products;
  const allProducts = all.data?.products ?? [];
  const filtering = Boolean(search) || onlyLow;

  function refresh() {
    list.reload();
    all.reload();
  }

  function handleSaved(product, editing) {
    setFormState({ open: false, product: null });
    toast.success(editing ? "Produto atualizado." : "Produto criado.");
    refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await productsApi.remove(toDelete.id);
      toast.success("Produto excluído.");
      setToDelete(null);
      refresh();
    } catch (err) {
      if (err.status !== 403) toast.error(getErrorMessage(err));
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500">{user?.role === "ADMIN" ? "Todos os produtos do sistema." : "Seus produtos e saldos."}</p>
        </div>
        <Button onClick={() => setFormState({ open: true, product: null })}>Novo produto</Button>
      </div>

      <section aria-label="Resumo" className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total de produtos"
          value={all.data ? allProducts.length : "—"}
          icon={
            <svg {...iconProps}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          title="Unidades em estoque"
          value={all.data ? allProducts.reduce((sum, p) => sum + p.quantity, 0) : "—"}
          icon={
            <svg {...iconProps}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          }
        />
        <StatCard
          title="Estoque baixo"
          tone="alert"
          value={all.data ? allProducts.filter((p) => p.lowStock).length : "—"}
          hint="produtos"
          icon={
            <svg {...iconProps}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
          }
        />
      </section>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-56 flex-1">
          <label htmlFor="busca" className="block text-sm font-medium text-gray-700">
            Buscar
          </label>
          <input
            id="busca"
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Nome, SKU ou categoria"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:outline-2 focus:outline-teal-600"
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="size-4 accent-teal-700" />
          Somente estoque baixo
        </label>
      </div>

      {list.loading && !products ? (
        <div className="flex justify-center py-12 text-teal-700">
          <Spinner className="size-8" label="Carregando produtos..." />
        </div>
      ) : list.error ? (
        <Alert>
          <p>{getErrorMessage(list.error)}</p>
          <Button variant="secondary" className="mt-3" onClick={refresh}>
            Tentar novamente
          </Button>
        </Alert>
      ) : products?.length === 0 ? (
        filtering ? (
          <EmptyState title="Nenhum produto encontrado">Nenhum produto corresponde à busca ou ao filtro. Tente outros termos.</EmptyState>
        ) : (
          <EmptyState title="Nenhum produto cadastrado" action={<Button onClick={() => setFormState({ open: true, product: null })}>Cadastrar primeiro produto</Button>}>
            Comece cadastrando seu primeiro produto.
          </EmptyState>
        )
      ) : products ? (
        <div className={list.loading ? "opacity-60 transition-opacity" : ""} aria-busy={list.loading}>
          <ProductTable products={products} user={user} onEdit={(product) => setFormState({ open: true, product })} onDelete={setToDelete} />
        </div>
      ) : null}

      <ProductFormModal open={formState.open} product={formState.product} onClose={() => setFormState({ open: false, product: null })} onSaved={handleSaved} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir produto"
        message={toDelete ? `Tem certeza que deseja excluir "${toDelete.name}"? O histórico de movimentações também será apagado.` : ""}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
