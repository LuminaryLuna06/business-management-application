import { Routes, Route } from "react-router-dom";
import ProtectedRoutes from "./ProtectedRoutes";
import HomePage from "../pages/Home";
import TestPage from "../pages/test";
import BusinessPage from "../pages/Business";

export default function UserRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/business/:businessId" element={<BusinessPage />}>
          <Route path="dashboard" element={<div>Dashboard Page</div>} />
          <Route path="employees" element={<div>Employees Page</div>} />
          <Route path="sub-licenses" element={<div>Sublicense Page</div>} />
          <Route
            path="inspection-schedule"
            element={<div>Inspection Page</div>}
          />
          <Route path="violations" element={<div>Violation Page</div>} />
        </Route>
      </Route>
    </Routes>
  );
}
