import { Routes, Route } from "react-router-dom";
import ProtectedRoutes from "./ProtectedRoutes";
import HomePage from "../pages/Home";
import Index2 from "../pages/test/index2";
import BusinessTable from "../pages/Home/components/BusinessTable";
import BusinessPage from "../pages/Business";
import TestPage from "../pages/test";
import Index3 from "../pages/test/index3";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<HomePage />}>
          <Route path="business" element={<BusinessTable />} />
          <Route path="business/:businessId" element={<BusinessPage />} />
          <Route path="test" element={<Index2 />} />
          <Route path="test2" element={<TestPage />} />
          <Route path="test3" element={<Index3 />} />
        </Route>
      </Route>
    </Routes>
  );
}
