import React from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import AdminLayout from "./pages/admin/adminLayout";
import AdminDashboard from "./pages/admin/Index";
import UserManagementPage from "./pages/admin/user-management/UserManagementPage";
import OrdersPage from "./pages/admin/OrdersPage";
import MenuPage from "./pages/admin/MenuPage";
import UserProfilePage from "./pages/admin/UserProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import { useAuthStore } from "./stores/useAuthStore";
import { Loader } from "lucide-react";
import { Toaster } from "sonner";
import PaymentPage from "./pages/admin/PaymentPage";

const App = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const authUser = useAuthStore((state) => state.authUser);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="min-h-svh flex items-center justify-center">
          <Loader className="animate-spin size-5 text-muted-foreground"/>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Routes>
          <Route path="/" element={<Index/>}/>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/signup" element={<SignupPage/>}/>
          <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>

          <Route
            path="/admin"
            element={
              authUser?.role === "admin"
                ? <AdminLayout />
                : <Navigate to={authUser ? "/" : "/login"} replace />
            }
          > 
            <Route index element={<AdminDashboard />} />
            <Route path="user-management" element={<UserManagementPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="payment" element={<PaymentPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster/>
    </ThemeProvider>
  );
};

export default App;
