import { Routes, Route } from "react-router-dom";
import ProtectedRoutes from "./ProtectedRoutes";
import HomePage from "../pages/Home";
import TestPage from "../pages/test";
import BusinessPage from "../pages/Business";
import EmployeesPage from "../pages/Business/components/Employees";
import SubLicenses from "../pages/Business/components/Sub-Licenses";
import DashboardPage from "../pages/Business/components/Dashboard";
import InspectionPage from "../pages/Business/components/Inspection-Schedule";
import Index2 from "../pages/test/index2";
// import ViolationPage from "../pages/Business/components/Violations";

export default function UserRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/business/:businessId" element={<BusinessPage />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="sub-licenses" element={<SubLicenses />} />
          <Route path="inspection-schedule" element={<InspectionPage />} />
          <Route path="test" element={<Index2 />} />
          {/* <Route path="violations" element={<ViolationPage />} /> */}
        </Route>
      </Route>
    </Routes>
  );
}
