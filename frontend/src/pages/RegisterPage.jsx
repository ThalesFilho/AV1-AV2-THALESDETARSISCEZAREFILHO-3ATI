// Formulário de cadastro, escrito no estilo do HyperUI (não há componente de cadastro no site;
// ver docs/FONTES-COMPONENTES.md).
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/layout/AuthShell.jsx";
import Alert from "../components/ui/Alert.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import { useAuth } from "../context/authContext.js";
import { useToast } from "../context/toastContext.js";
import { getErrorMessage, getFieldErrors } from "../api/client.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!form.name.trim()) found.name = "Informe o nome.";
    if (!form.email.trim()) found.email = "Informe o e-mail.";
    else if (!EMAIL_REGEX.test(form.email.trim())) found.email = "E-mail inválido.";
    if (!form.password) found.password = "Informe a senha.";
    else if (form.password.length < 8) found.password = "A senha deve ter pelo menos 8 caracteres.";
    if (form.confirm !== form.password) found.confirm = "As senhas não conferem.";
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      toast.success("Cadastro realizado! Entre com seu e-mail e senha.");
      navigate("/login");
    } catch (err) {
      const fields = getFieldErrors(err);
      setErrors(fields);
      if (err.status === 409) setErrors({ email: "Este e-mail já está cadastrado." });
      else if (Object.keys(fields).length === 0) setFormError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Criar conta" subtitle="Cadastre-se para gerenciar seus produtos.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert>{formError}</Alert>}
        <Input label="Nome" name="name" autoComplete="name" value={form.name} onChange={change} error={errors.name} />
        <Input label="E-mail" name="email" type="email" autoComplete="email" value={form.email} onChange={change} error={errors.email} />
        <Input label="Senha" name="password" type="password" autoComplete="new-password" hint="Mínimo de 8 caracteres." value={form.password} onChange={change} error={errors.password} />
        <Input label="Confirmar senha" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={change} error={errors.confirm} />
        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? "Cadastrando..." : "Cadastrar"}
        </Button>
        <p className="text-center text-sm text-gray-500">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-teal-700 underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
