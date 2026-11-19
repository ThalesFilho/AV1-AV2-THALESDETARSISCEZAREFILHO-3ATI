import { useState } from "react";
import Modal from "../ui/Modal.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Alert from "../ui/Alert.jsx";
import { productsApi } from "../../api/products.js";
import { getErrorMessage, getFieldErrors } from "../../api/client.js";
import { parsePrice } from "../../utils/format.js";

// Formulário interno: é remontado a cada abertura do modal (estado sempre limpo).
function ProductForm({ product, onClose, onSaved }) {
  const editing = Boolean(product);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    category: product?.category ?? "",
    unitPrice: product ? String(product.unitPrice).replace(".", ",") : "",
    minStock: product ? String(product.minStock) : "0",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    const price = parsePrice(form.unitPrice);
    const minStock = Number(form.minStock);
    if (!form.name.trim()) found.name = "Informe o nome.";
    if (!form.sku.trim()) found.sku = "Informe o SKU.";
    if (!form.category.trim()) found.category = "Informe a categoria.";
    if (Number.isNaN(price)) found.unitPrice = "Informe um preço válido.";
    else if (price < 0) found.unitPrice = "O preço não pode ser negativo.";
    if (form.minStock === "" || !Number.isInteger(minStock) || minStock < 0) found.minStock = "Informe um número inteiro maior ou igual a 0.";
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return;

    const data = { name: form.name.trim(), sku: form.sku.trim(), category: form.category.trim(), unitPrice: price, minStock };
    setSubmitting(true);
    try {
      const result = editing ? await productsApi.update(product.id, data) : await productsApi.create(data);
      onSaved(result.product, editing);
    } catch (err) {
      const fields = getFieldErrors(err);
      if (err.status === 409) setErrors({ sku: "Você já tem um produto com este SKU." });
      else if (Object.keys(fields).length > 0) setErrors(fields);
      else setFormError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && <Alert>{formError}</Alert>}
      <Input label="Nome" name="name" value={form.name} onChange={change} error={errors.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="SKU" name="sku" value={form.sku} onChange={change} error={errors.sku} hint="Será salvo em maiúsculas." />
        <Input label="Categoria" name="category" value={form.category} onChange={change} error={errors.category} />
        <Input label="Preço unitário (R$)" name="unitPrice" inputMode="decimal" value={form.unitPrice} onChange={change} error={errors.unitPrice} />
        <Input label="Estoque mínimo" name="minStock" type="number" min="0" step="1" value={form.minStock} onChange={change} error={errors.minStock} />
      </div>
      <p className="text-sm text-gray-500">O saldo é alterado por entradas e saídas.</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {editing ? "Salvar alterações" : "Criar produto"}
        </Button>
      </div>
    </form>
  );
}

export default function ProductFormModal({ open, product, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title={product ? "Editar produto" : "Novo produto"}>
      <ProductForm product={product} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}
