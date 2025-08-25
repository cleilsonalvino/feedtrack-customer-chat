import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/lib/api";

type UserEmpresa = {
  id: string;
  props: {
    nome: string;
    cnpj?: string;
    email?: string;
  };
};

type User = {
  id: string;
  nomeUsuario: string;
  senhaHash: string;
  tipo: "USER" | "ADMIN" | "SUPER_ADMIN" | "EMPRESA";
  email?: string | null;
  status: "ATIVO" | "INATIVO";
  tokenRecuperacao?: string
  tokenRecuperacaoExpiracao?: string
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
  login: (nomeUsuario: string, senha: string) => Promise<User>;
  register: (data: {
    nome: string;
    cnpj?: string;
    email: string;
    plano: string;
  }) => Promise<void>;
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

    const { token, usuario } = response.data; // token do backend

    // SALVA O USER
    setUser(usuario);
    localStorage.setItem("user", JSON.stringify(usuario));

    // SALVA O TOKEN
    localStorage.setItem("authToken", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    if (usuario.empresaId) {
      const empresaRes = await api.get(`/empresa/${usuario.empresaId}`);
      const empresa: UserEmpresa = empresaRes.data;
      setUserEmpresa(empresa);
      localStorage.setItem("userEmpresa", JSON.stringify(empresa));
    } else {
      setUserEmpresa(null);
      localStorage.removeItem("userEmpresa");
    }

    return usuario;
  } catch (error: any) {
    throw new Error(
      "Falha no login: " + (error.response?.data?.message || error.message)
    );
  }
};

  const register = async (data: {
    nome: string;
    cnpj?: string;
    email: string;
    plano: string;
  }) => {
    try {
      const payload = {
        nome: data.nome,
        cnpj: data.cnpj?.trim() ? data.cnpj : undefined,
        email: data.email,
        plano: data.plano,
      };

      /**
       * Esperando:
       * {
       *  empresa: {...},
       *  usuario: {...}
       * }
       */
      const response = await api.post("/empresa", payload);
      const { empresa, usuario } = response.data;

      localStorage.setItem("userEmpresa", JSON.stringify(empresa));
      setUserEmpresa(empresa);

      localStorage.setItem("user", JSON.stringify(usuario));
      setUser(usuario);
    } catch (error: any) {
      throw new Error(
        "Falha no cadastro: Nome ou Email já existem no sistema")
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
