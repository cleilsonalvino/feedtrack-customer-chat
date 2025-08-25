// src/components/SidebarWrapper.tsx

import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // 1. Importar nosso hook de autenticação

import { Sidebar } from "./Sidebar"; // Supondo que você tenha um componente Sidebar separado
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export const SidebarWrapper = () => {
  // 2. Obter o estado de autenticação do nosso AuthContext
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>A carregar...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 5. Se estiver autenticado, renderiza o layout (com a sidebar) e a página da rota filha (Outlet)
  return (
    <div className="flex h-screen relative bg-muted/40">
      {/* Botão de menu (mobile) */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 bg-card border rounded-lg shadow"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full z-40 transition-transform duration-300 md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Passamos a função para fechar a sidebar no mobile */}
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* O Outlet é o espaço onde a sua página (Index, CustomersPage, etc.) será renderizada */}
        <Outlet />
      </main>
    </div>
  );
};