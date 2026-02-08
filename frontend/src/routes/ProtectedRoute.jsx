import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => Boolean(s.token));

  if (!isAuthenticated) {
    // usuario no loggeado → login
    return <Navigate to="/" replace />;
  }

  // usuario loggeado → renderiza la ruta hija
  return <Outlet />;
}