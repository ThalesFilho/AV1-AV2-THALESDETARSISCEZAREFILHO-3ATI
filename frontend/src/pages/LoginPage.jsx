// Formulário de login. O HyperUI não tem componente de login: a URL
// https://www.hyperui.dev/components/marketing/sign-ins retornou 404 (ver docs/FONTES-COMPONENTES.md).
// Por isso este formulário foi escrito no mesmo estilo dos componentes HyperUI (cartão branco, bordas finas, cor teal).
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../components/layout/AuthShell.jsx";
import Alert from "../components/ui/Alert.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import { useAuth } from "../context/authContext.js";
import { getErrorMessage, getFieldErrors } from "../api/client.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!form.email.trim()) found.email = "Informe o e-mail.";
    else if (!EMAIL_REGEX.test(form.email.trim())) found.email = "E-mail inválido.";
    if (!form.password) found.password = "Informe a senha.";
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      // O redirecionamento é feito pela PublicOnlyRoute (volta à página de origem).
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(err.status === 401 ? "E-mail ou senha inválidos." : getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Entrar" subtitle="Acesse sua conta para controlar o estoque.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert>{formError}</Alert>}
        <Input label="E-mail" name="email" type="email" autoComplete="email" value={form.email} onChange={change} error={errors.email} />
        <Input label="Senha" name="password" type="password" autoComplete="current-password" value={form.password} onChange={change} error={errors.password} />
        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
        <p className="text-center text-sm text-gray-500">
          Ainda não tem conta?{" "}
          <Link to="/register" className="font-medium text-teal-700 underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
