// src/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/lib/api"; // sua instância axios configurada

type User = {
  nomeUsuario: string;
  senha: string;
  tipo?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { nomeUsuario: string, nomeEmpresa: string, email: string, senha: string }) => Promise<void>;
  logout: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
const [user, setUser] = useState<User | null>(() => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    return JSON.parse(storedUser);
  } else {
    localStorage.removeItem('user');
    return null;  // importante retornar null para o estado inicial
  }
});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (nomeUsuario: string, senha: string) => {
    try {
      const response = await api.post("/login", { nomeUsuario, senha });
      const usuario = response.data;

      localStorage.setItem("user", JSON.stringify(usuario));
      setUser(usuario);
    } catch (error) {
      // Trate erros aqui, por ex:
      throw new Error("Falha no login: " + (error as any).response?.data?.message || error.message);
    }
  };

  const register = async (data: { nomeUsuario: string; senha: string; nomeEmpresa: string; }) => {
    try {
      const response = await api.post("/cadastro-empresa", data);
      console.log("Usuário registrado com sucesso:", response.data);
      const usuario = response.data;

      console.log("Novo usuário:", usuario);

      localStorage.setItem("user", JSON.stringify(usuario));
      setUser(usuario);
      // window.location.href = "/onboarding"; // Redireciona para a página de login após o registro
    } catch (error) {
      throw new Error("Falha no cadastro: " + (error as any).response?.data?.message || error.message);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
