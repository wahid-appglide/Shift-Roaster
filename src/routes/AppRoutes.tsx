import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import EmployeeDashboard from "../pages/EmployeeDashboard";
import Employee from "../pages/Employee";
import NocEmployees from "../pages/NocEmployees";
import SreEmployees from "../pages/SreEmployees";
import Shift from "../pages/shift";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route
        path="/employee-dashboard"
        element={<EmployeeDashboard />}
      />

      <Route path="/employee" element={<Employee />} />

      <Route path="/employees/noc" element={<NocEmployees />} />

      <Route path="/employees/sre" element={<SreEmployees />} />

      <Route path="/shift" element={<Shift />} />
    </Routes>
  );
}