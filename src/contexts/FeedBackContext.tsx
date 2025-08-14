import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import api from "../lib/api"; 
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// --- TIPOS ---
export type FeedbackApiResponse = {
  id: string;
  formularioId: string;
  envioId: string;
  respostas: { perguntaId: string; resposta: any }[];
  empresaId: string;
  dataCriacao: string;
  dataExclusao?: string | null;
};

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

// --- FORMULÁRIOS ---
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

// --- FUNCIONÁRIOS ---
export type IFuncionario = {
  id: string;
  usuarioId: string;
  cargo: string;
  telefone?: string;
};
export type Usuario = { id: string; nomeUsuario: string; };
export type FuncionarioComNome = IFuncionario & { nomeUsuario?: string; };

// --- CONTEXTO ---
type FeedBackContextType = {
  feedbacks: FeedbackApiResponse[];
  fetchFeedbacks: () => Promise<void>;
  submitDynamicFeedback: (data: DynamicFeedbackPayload) => Promise<FeedbackApiResponse | null>;
  deleteFeedback: (id: string) => Promise<boolean>;
  formularios: IFormulario[];
  fetchFormularios: () => Promise<void>;
  funcionarios: FuncionarioComNome[];
  fetchFuncionariosComNome: () => Promise<void>;
  loading: boolean;
  error: string | null;
};

const FeedBackContext = createContext<FeedBackContextType | undefined>(undefined);

export const useFeedBack = () => {
  const ctx = useContext(FeedBackContext);
  if (!ctx) throw new Error("useFeedBack must be used within FeedBackProvider");
  return ctx;
};

export const FeedBackProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // pega empresaId do usuário logado
  const { toast } = useToast();

  const [feedbacks, setFeedbacks] = useState<FeedbackApiResponse[]>([]);
  const [formularios, setFormularios] = useState<IFormulario[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioComNome[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    if (!user?.empresaId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<FeedbackApiResponse[]>(`/feedbacks?empresaId=${user.empresaId}`);
      setFeedbacks(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erro ao buscar feedbacks");
    } finally {
      setLoading(false);
    }
  }, [user?.empresaId]);

  const fetchFormularios = useCallback(async () => {
    if (!user?.empresaId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<IFormulario[]>(`/formularios?empresaId=${user.empresaId}`);
      setFormularios(data.filter(f => f.ativo));
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erro ao buscar formulários");
    } finally {
      setLoading(false);
    }
  }, [user?.empresaId]);

  const submitDynamicFeedback = useCallback(async (data: DynamicFeedbackPayload) => {
    if (!user?.empresaId) return null;
    setLoading(true);
    setError(null);
    try {
      const payload = { ...data, empresaId: user.empresaId }; // adiciona empresaId
      const response = await api.post<FeedbackApiResponse>("/feedback/manual", payload);
      setFeedbacks(prev => [response.data, ...prev]);
      toast({ title: "Sucesso", description: "Feedback enviado!" });
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erro ao submeter feedback");
      toast({ title: "Erro", description: "Não foi possível enviar o feedback.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.empresaId, toast]);

  const deleteFeedback = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/feedback/${id}?empresaId=${user?.empresaId}`);
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      toast({ title: "Sucesso", description: "Feedback excluído!" });
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erro ao deletar feedback");
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.empresaId, toast]);

  const fetchFuncionariosComNome = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: funcionariosRaw } = await api.get<IFuncionario[]>(`/funcionarios?empresaId=${user?.empresaId}`);
      const funcionariosComNome = await Promise.all(
        funcionariosRaw.map(async func => {
          const { data: usuario } = await api.get<Usuario>(`/usuarios/${func.usuarioId}`);
          return { ...func, nomeUsuario: usuario?.nomeUsuario || "Nome não encontrado" };
        })
      );
      setFuncionarios(funcionariosComNome);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erro ao buscar funcionários");
    } finally {
      setLoading(false);
    }
  }, [user?.empresaId]);

  return (
    <FeedBackContext.Provider
      value={{
        feedbacks,
        fetchFeedbacks,
        submitDynamicFeedback,
        deleteFeedback,
        formularios,
        fetchFormularios,
        funcionarios,
        fetchFuncionariosComNome,
        loading,
        error
      }}
    >
      {children}
    </FeedBackContext.Provider>
  );
};
