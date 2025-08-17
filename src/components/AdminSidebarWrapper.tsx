import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AdminSidebar } from "./AdminSidebar";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export const AdminSidebarWrapper = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>A carregar...</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.tipo !== 'SUPER_ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen relative bg-muted/40">
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 bg-card border rounded-lg shadow"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div
        className={cn(
          "fixed top-0 left-0 h-full z-40 transition-transform duration-300 md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <AdminSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};
