import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext.js";
import FullPageSpinner from "../components/ui/FullPageSpinner.jsx";

// Só deixa passar quem está logado; guarda a página de origem para voltar depois do login.
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner label="Verificando sessão..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
