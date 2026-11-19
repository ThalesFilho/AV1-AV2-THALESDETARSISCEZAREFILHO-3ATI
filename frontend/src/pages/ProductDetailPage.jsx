import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/authContext.js";
import { useToast } from "../context/toastContext.js";
import { productsApi } from "../api/products.js";
import { getErrorMessage } from "../api/client.js";
import { useApi } from "../utils/useApi.js";
import { canManage, formatCurrency } from "../utils/format.js";
import Alert from "../components/ui/Alert.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import MovementForm from "../components/products/MovementForm.jsx";
import MovementHistory from "../components/products/MovementHistory.jsx";
import ProductFormModal from "../components/products/ProductFormModal.jsx";

function BackLink() {
  return (
    <Link to="/products" className="text-sm font-medium text-teal-700 underline">
      ← Voltar para os produtos
    </Link>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const productReq = useApi((signal) => productsApi.get(id, signal), `p${id}`);
  const movementsReq = useApi((signal) => productsApi.movements(id, signal), `m${id}`);

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const product = productReq.data?.product;

  if (productReq.loading && !product) {
    return (
      <div className="flex justify-center py-16 text-teal-700">
        <Spinner className="size-8" label="Carregando produto..." />
      </div>
    );
  }

  if (productReq.error) {
    const status = productReq.error.status;
    const message =
      status === 404
        ? "Produto não encontrado. Ele pode ter sido excluído."
        : status === 403
          ? "Você não tem permissão para acessar este produto."
          : getErrorMessage(productReq.error);
    return (
      <div className="space-y-4">
        <BackLink />
        <Alert>
          <p>{message}</p>
          {status !== 404 && status !== 403 && (
            <Button variant="secondary" className="mt-3" onClick={productReq.reload}>
              Tentar novamente
            </Button>
          )}
        </Alert>
      </div>
    );
  }

  if (!product) return null;
  const allowed = canManage(product, user);

  function refresh() {
    productReq.reload();
    movementsReq.reload();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await productsApi.remove(product.id);
      toast.success("Produto excluído.");
      navigate("/products");
    } catch (err) {
      if (err.status !== 403) toast.error(getErrorMessage(err));
      setConfirmDelete(false);
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <section className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-500">
            SKU {product.sku} · {product.category} · {formatCurrency(product.unitPrice)}
          </p>
          <p className="text-sm text-gray-500">Estoque mínimo: {product.minStock}</p>
          {user?.role === "ADMIN" && product.owner && <p className="text-sm text-gray-500">Responsável: {product.owner.name}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Saldo em estoque</p>
          <p className="text-5xl font-bold text-teal-700">{product.quantity}</p>
          {product.lowStock && <Badge color="red">Estoque baixo</Badge>}
        </div>
        {allowed && (
          <div className="flex w-full gap-2 border-t border-gray-100 pt-4">
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Excluir
            </Button>
          </div>
        )}
      </section>

      {allowed && <MovementForm product={product} onDone={refresh} />}

      <MovementHistory movements={movementsReq.data?.movements} loading={movementsReq.loading} error={movementsReq.error} onRetry={movementsReq.reload} />

      <ProductFormModal
        open={editing}
        product={product}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          toast.success("Produto atualizado.");
          refresh();
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Excluir produto"
        message={`Tem certeza que deseja excluir "${product.name}"? O histórico de movimentações também será apagado.`}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
