import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building,
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Empresas", href: "/admin", icon: Building },
];

export const AdminSidebar = ({ onClose }: { onClose?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate("/login");
  };

  return (
    <div className="w-64 bg-card border-r h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b">
        <div className="flex justify-start gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Admin
          </h1>
        </div>
      </div>

      <nav className="flex-1 p-4">
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

      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          <p>FeedTrack v1.0</p>
          <p>Painel Administrativo</p>
        </div>
      </div>
    </div>
  );
};
