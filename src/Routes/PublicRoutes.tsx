import { Routes, Route } from "react-router-dom";
import LoginPage from "../component/auth/login";
export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
