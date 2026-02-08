import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store";

function isLikelyJwt(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  if (!isLikelyJwt(token)) return <Navigate to="/" replace />;
  return <Outlet />;
}