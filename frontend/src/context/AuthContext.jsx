import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./authContext.js";
import { useToast } from "./toastContext.js";
import { authApi } from "../api/auth.js";
import { clearSession, getToken, setToken } from "../api/client.js";

export function AuthProvider({ children }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  // Se existe token guardado, começa "carregando" até validar em /auth/me.
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // Eventos disparados pelo cliente HTTP: sessão expirada (401) e acesso negado (403).
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      toast.error("Sua sessão expirou. Entre novamente.");
      navigate("/login", { replace: true });
    };
    const onForbidden = () => toast.error("Acesso negado.");
    window.addEventListener("auth:expired", onExpired);
    window.addEventListener("api:forbidden", onForbidden);
    return () => {
      window.removeEventListener("auth:expired", onExpired);
      window.removeEventListener("api:forbidden", onForbidden);
    };
  }, [toast, navigate]);

  // Ao abrir o app: valida o token guardado.
  useEffect(() => {
    if (!getToken()) return;
    const controller = new AbortController();
    authApi
      .me(controller.signal)
      .then((data) => setUser(data.user))
      .catch(() => {
        // 401: o cliente HTTP já limpou a sessão e avisou. Outros erros (ex.: API fora do ar):
        // mantém o token guardado e apenas segue para o login.
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback((name, email, password) => authApi.register(name, email, password), []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
