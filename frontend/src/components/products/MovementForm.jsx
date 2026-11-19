import { useState } from "react";
import Alert from "../ui/Alert.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import { productsApi } from "../../api/products.js";
import { getErrorMessage, getFieldErrors } from "../../api/client.js";
import { useToast } from "../../context/toastContext.js";

export default function MovementForm({ product, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({ type: "ENTRY", quantity: "", note: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const quantity = Number(form.quantity);
    const found = {};
    if (form.quantity === "" || !Number.isInteger(quantity) || quantity < 1) found.quantity = "Informe um número inteiro maior que zero.";
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      // Saída maior que o saldo NÃO é bloqueada aqui: o backend decide (422) e mostramos a mensagem dele.
      await productsApi.addMovement(product.id, { type: form.type, quantity, ...(form.note.trim() ? { note: form.note.trim() } : {}) });
      toast.success(form.type === "ENTRY" ? "Entrada registrada." : "Saída registrada.");
      setForm({ type: form.type, quantity: "", note: "" });
      onDone();
    } catch (err) {
      const fields = getFieldErrors(err);
      if (Object.keys(fields).length > 0) setErrors(fields);
      else if (err.status !== 403) setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Registrar movimentação</h2>
        <p className="text-sm text-gray-600">
          Saldo disponível: <strong>{product.quantity}</strong>
        </p>
      </div>
      {formError && <Alert>{formError}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Tipo" name="type" value={form.type} onChange={change} error={errors.type}>
          <option value="ENTRY">Entrada</option>
          <option value="EXIT">Saída</option>
        </Select>
        <Input label="Quantidade" name="quantity" type="number" min="1" step="1" value={form.quantity} onChange={change} error={errors.quantity} />
      </div>
      <Input label="Observação (opcional)" name="note" maxLength={300} value={form.note} onChange={change} error={errors.note} />
      <Button type="submit" loading={submitting}>
        Registrar
      </Button>
    </form>
  );
}
