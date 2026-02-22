import { Navigate } from "react-router-dom";

export default function MatchRedirect() {
  return <Navigate to="/friends" replace />;
}
