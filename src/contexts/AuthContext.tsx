import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/lib/api";

type UserEmpresa = {
  id: string;
  props:{
    nome: string;
  cnpj?: string;
  }
};

type User = {
  id: string;
  nomeUsuario: string;
  senhaHash: string;
  tipo: "USER" | "ADMIN" | "SUPER_ADMIN" | "EMPRESA";
  email?: string | null;
  status: "ATIVO" | "INATIVO";
  empresaId?: string | null;
  dataCriacao: string;
  dataAtualizacao: string;
  dataExclusao?: string | null;
};

type AuthContextType = {
  user: User | null;
  userEmpresa: UserEmpresa | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (nomeUsuario: string, senha: string) => Promise<void>;
  register: (data: { nome: string; cnpj?: string }) => Promise<void>;
  logout: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [userEmpresa, setUserEmpresa] = useState<UserEmpresa | null>(() => {
    const storedEmpresa = localStorage.getItem("userEmpresa");
    return storedEmpresa ? JSON.parse(storedEmpresa) : null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

const login = async (nomeUsuario: string, senha: string) => {
  try {
    const response = await api.post("/login", { nomeUsuario, senha });
    const usuario: User = response.data;

    // Salva usuário
    localStorage.setItem("user", JSON.stringify(usuario));
    setUser(usuario);

    // Busca empresa se o usuário tiver empresaId
    if (usuario.empresaId) {
      const empresaRes = await api.get(`/empresa/${usuario.empresaId}`);
      const empresa: UserEmpresa = empresaRes.data;
      setUserEmpresa(empresa);
      localStorage.setItem("userEmpresa", JSON.stringify(empresa));
    } else {
      setUserEmpresa(null);
      localStorage.removeItem("userEmpresa");
    }
  } catch (error: any) {
    throw new Error(
      "Falha no login: " +
        (error.response?.data?.message || error.message)
    );
  }
};


  const register = async (data: { nome: string; cnpj?: string }) => {
    try {
      const payload = {
        nome: data.nome,
        cnpj: data.cnpj?.trim() ? data.cnpj : undefined,
      };

      /**
       * O backend retorna algo assim:
       * {
       *   empresa: { id, nome, cnpj },
       *   usuario: { id, nomeUsuario, tipo, ... }
       * }
       */
      const response = await api.post("/empresa", payload);
      const { empresa, usuario } = response.data;

      // Salva os dois
      localStorage.setItem("userEmpresa", JSON.stringify(empresa));
      setUserEmpresa(empresa);

      localStorage.setItem("user", JSON.stringify(usuario));
      setUser(usuario);
    } catch (error: any) {
      throw new Error("Falha no cadastro: " + (error.response?.data?.message || error.message));
    }
  };

  const logout = () => {
    setUser(null);
    setUserEmpresa(null);
    localStorage.removeItem("user");
    localStorage.removeItem("userEmpresa");
    localStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userEmpresa,
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
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
