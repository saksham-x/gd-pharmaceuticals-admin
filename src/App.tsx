import type { ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import RequirePermission, { HomeRedirect } from "./components/RequirePermission";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import type { Permission } from "./services/auth/auth.types";

import ActivityLogsAdmin from "./pages/activityLogs/ActivityLogsAdmin";
import Login from "./pages/auth/Login";
import CareersAdmin from "./pages/careers/CareersAdmin";
import ContentAdmin from "./pages/content/ContentAdmin";
import Dashboard from "./pages/dashboard/Dashboard";
import EnquiriesAdmin from "./pages/enquiries/EnquiriesAdmin";
import LegalPagesAdmin from "./pages/legalPages/LegalPagesAdmin";
import NoticesAdmin from "./pages/notices/NoticesAdmin";
import ProductsAdmin from "./pages/products/ProductsAdmin";
import RolesAdmin from "./pages/roles/RolesAdmin";
import TasksAdmin from "./pages/tasks/TasksAdmin";
import UsersAdmin from "./pages/users/UsersAdmin";

// A page inside the staff portal layout.
// With `permission`, accounts whose role
// lacks it see a "no access" note instead.
function ProtectedPage({ permission, children }: { permission?: Permission; children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <RequirePermission permission={permission}>{children}</RequirePermission>
      </AdminLayout>
    </ProtectedRoute>
  );
}

const PAGES: { path: string; permission: Permission; element: ReactNode }[] = [
  { path: "/dashboard", permission: "dashboard.view", element: <Dashboard /> },
  { path: "/enquiries", permission: "enquiries.view", element: <EnquiriesAdmin /> },
  { path: "/tasks", permission: "tasks.view", element: <TasksAdmin /> },
  { path: "/products", permission: "products.view", element: <ProductsAdmin /> },
  { path: "/notices", permission: "notices.view", element: <NoticesAdmin /> },
  { path: "/careers", permission: "careers.view", element: <CareersAdmin /> },
  { path: "/content", permission: "content.view", element: <ContentAdmin /> },
  { path: "/legal-pages", permission: "legalPages.view", element: <LegalPagesAdmin /> },
  { path: "/users", permission: "adminUsers.view", element: <UsersAdmin /> },
  { path: "/roles", permission: "roles.view", element: <RolesAdmin /> },
  { path: "/activity-logs", permission: "activityLogs.view", element: <ActivityLogsAdmin /> },
];

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick pauseOnHover theme="light" />

      <Routes>
        <Route path="/login" element={<Login />} />

        {PAGES.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<ProtectedPage permission={page.permission}>{page.element}</ProtectedPage>}
          />
        ))}

        {/* "/" and unknown URLs: the first page the account can open. */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <HomeRedirect />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
