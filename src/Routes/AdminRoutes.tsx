import { Routes, Route } from "react-router-dom";
import ProtectedRoutes from "./ProtectedRoutes";
import HomePage from "../pages/Home";
import BusinessTable from "../pages/Home/components/BusinessTable";
import BusinessPage from "../pages/Business";
import Index3 from "../pages/test/index3";
import LicensePage from "../pages/License";
import IndustryPage from "../pages/Industry";
import EditPage from "../pages/Business/components/Dashboard/EditPage";
import AddPage from "../pages/Home/components/AddPage";
import UserManagement from "../pages/UserManagement";
import Dashboard from "../pages/Dashboard";
import Report from "../pages/Report";
import TestPage from "../pages/test/index2";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<HomePage />}>
          <Route index element={<Dashboard />} />
          <Route path="business" element={<BusinessTable />} />
          <Route path="business/:businessId" element={<BusinessPage />} />
          <Route path="business/add" element={<AddPage />} />
          <Route path="business/:businessId/edit" element={<EditPage />} />
          <Route path="test3" element={<Index3 />} />
          <Route path="test" element={<TestPage />} />
          <Route path="industry" element={<IndustryPage />} />
          <Route path="licenses" element={<LicensePage />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="report" element={<Report />} />
        </Route>
      </Route>
    </Routes>
  );
}
