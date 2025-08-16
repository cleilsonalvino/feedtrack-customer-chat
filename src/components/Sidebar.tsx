import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  MessageSquare,
  Settings,
  FileBarChart,
  LogOut,
  Star,
  FolderKanban,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

const getNavigation = (isAdmin: boolean) => {
  const baseNavigation = [
    { name: "Clientes", href: "/customers", icon: Users },
    { name: "Campanhas", href: "/campaigns", icon: MessageSquare },
    { name: "Feedbacks", href: "/feedbacks", icon: Star },
    { name: "Produtos", href: "/products", icon: Star },
    { name: "Vendas", href: "/sales", icon: DollarSign },
  ];

  const adminNavigation = [
    { name: "Dashboard", href: "/home", icon: BarChart3 },
    ...baseNavigation,
    { name: "Editor de Formulário", href: "/form-builder", icon: FolderKanban },
    { name: "Relatórios", href: "/reports", icon: FileBarChart },
    { name: "Configurações", href: "/settings", icon: Settings },
  ];

  return isAdmin ? adminNavigation : baseNavigation;
};

export const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userEmpresa, logout } = useAuth();

  const [nomeEmpresa, setNomeEmpresa] = useState<string>("");
  const [tipoUsuario, setTipoUsuario] = useState<string>("");

  const isAdmin = user?.tipo === "ADMIN" || user?.tipo === "SUPER_ADMIN";
  const navigation = getNavigation(isAdmin);

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate("/login");
  };

  useEffect(() => {
    setNomeEmpresa(userEmpresa?.props.nome || user?.nomeUsuario || "");
    setTipoUsuario(user?.tipo || "");
  }, [user, userEmpresa]);

  return (
    <div className="w-64 bg-card border-r h-screen sticky top-0 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-start gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {nomeEmpresa}
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="mb-4 px-3 py-2 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            Logado como: {tipoUsuario}
          </p>
        </div>

        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}

          <li>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          <p>FeedTrack v1.0</p>
          <p>Sistema de Gestão Pós-Venda</p>
        </div>
      </div>
    </div>
  );
};
