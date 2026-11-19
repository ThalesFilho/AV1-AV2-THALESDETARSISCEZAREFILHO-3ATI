import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext.js";
import FullPageSpinner from "../components/ui/FullPageSpinner.jsx";

// Login e cadastro: quem já está logado sai daqui.
// Depois de entrar, volta para a página de origem (guardada pelo ProtectedRoute) ou para /products.
export default function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner label="Verificando sessão..." />;
  if (user) {
    const from = location.state?.from;
    return <Navigate to={from ? from.pathname + (from.search ?? "") : "/products"} replace />;
  }
  return <Outlet />;
}
