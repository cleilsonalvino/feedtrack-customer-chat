import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import api from "../lib/api";  // ajuste o caminho conforme a estrutura do seu projeto


// Tipos de API
export type FeedbackApiResponse = {
  id: string;
  formularioId: string;
  envioId: string;
  respostas: { perguntaId: string; resposta: any }[];
  dataCriacao: string;
  dataExclusao?: string | null;
};

export type FeedbackApiRequest = {
  formularioId: string;
  envioId: string;
  respostas: { perguntaId: string; resposta: any }[];
};

// NOVO: Tipo para o payload do formulário dinâmico
export type DynamicFeedbackPayload = {
  clienteNome: string;
  produtoNome: string;
  funcionarioNome: string;
  respostas: {
    perguntaId: string;
    tipo: "texto" | "nota" | "multipla_escolha";
    resposta_texto?: string;
    nota?: number;
  }[];
};

// Tipo para a estrutura de um formulário
export type IFormulario = {
  id: string;
  titulo: string;
  descricao?: string;
  ativo: boolean;
  perguntas: {
    _id: string;
    _texto: string;
    _tipo: "texto" | "nota" | "multipla_escolha";
    _opcoes?: string[];
    obrigatoria: boolean;
  }[];
  dataCriacao: string;
  dataAtualizacao: string;
  dataExclusao?: string | null;
};

export type IFuncionario = {
  _id: string;
  _usuarioId: string;
  _cargo: string;
  telefone?: string;
};

export type Usuario = {
  _id: string;
  _nomeUsuario: string;
  // outros campos que precisar
};

async function fetchUsuarioPorId(id: string): Promise<Usuario | null> {
  try {
    const { data } = await api.get<Usuario>(`/usuarios/${id}`);
    
    return data;
  } catch {
    return null;
  }
}

export type FuncionarioComNome = IFuncionario & { _nomeUsuario?: string };

async function fetchFuncionariosComNomeApi(): Promise<FuncionarioComNome[]> {
  try {
    const { data: funcionarios } = await api.get<IFuncionario[]>("/funcionarios");

    

    const funcionariosComNome = await Promise.all(
      funcionarios.map(async (func) => {
        const usuario = await fetchUsuarioPorId(func._usuarioId);
        return {
          ...func,
          _nomeUsuario: usuario?._nomeUsuario || "Nome não encontrado",
        };
      })
    );

    return funcionariosComNome;
  } catch {
    return [];
  }
}



type FeedBackContextType = {
  feedbacks: FeedbackApiResponse[];
  fetchFeedbacks: () => Promise<void>;
  submitDynamicFeedback: (data: DynamicFeedbackPayload) => Promise<FeedbackApiResponse | null>;
  deleteFeedback: (id: string) => Promise<boolean>;
  formularios: IFormulario[];
  fetchFormularios: () => Promise<void>;
fetchFuncionariosComNome: () => Promise<void>;
  loading: boolean;
  error: string | null;
    funcionarios: FuncionarioComNome[];
};

const FeedBackContext = createContext<FeedBackContextType | undefined>(undefined);

export const useFeedBack = () => {
  const ctx = useContext(FeedBackContext);
  if (!ctx) throw new Error("useFeedBack must be used within FeedBackProvider");
  return ctx;
};

export const FeedBackProvider = ({ children }: { children: ReactNode }) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackApiResponse[]>([]);
  const [formularios, setFormularios] = useState<IFormulario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [funcionarios, setFuncionarios] = useState<FuncionarioComNome[]>([]);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<FeedbackApiResponse[]>("/feedbacks");  // <- aqui usa api
      setFeedbacks(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFormularios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<IFormulario[]>("/formularios");  // <- aqui usa api
      setFormularios(data.filter(f => f.ativo));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  const submitDynamicFeedback = useCallback(async (data: DynamicFeedbackPayload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<FeedbackApiResponse>("/feedback/manual", data);  // <- aqui usa api
      setFeedbacks((prev) => [response.data, ...prev]);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erro desconhecido ao submeter feedback.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFeedback = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/feedback/${id}`);  // <- aqui usa api
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erro desconhecido");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

const fetchFuncionariosComNome = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const dados = await fetchFuncionariosComNomeApi();
    setFuncionarios(dados);
  } catch (err: any) {
    setError(err.response?.data?.message || err.message || "Erro desconhecido");
  } finally {
    setLoading(false);
  }
}, []);


  return (
    <FeedBackContext.Provider
      value={{
        feedbacks,
        fetchFeedbacks,
        submitDynamicFeedback,
        deleteFeedback,
        formularios,
        fetchFormularios,
        loading,
        error,
        funcionarios,
        fetchFuncionariosComNome
      }}
    >
      {children}
    </FeedBackContext.Provider>
  );
};