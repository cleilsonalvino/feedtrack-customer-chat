import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// --- INTERFACES ---
export interface Pergunta {
  id: string;
  texto: string;
  tipo: "nota" | "texto" | "multipla_escolha";
  opcoes?: string[];
  ativo?: boolean;
  empresaId?: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface Formulario {
  id: string;
  titulo: string;
  descricao: string;
  ativo: boolean;
  empresaId?: string;
  perguntas: Pergunta[];
}

// Payloads
export type NewQuestionData = Omit<
  Pergunta,
  "id" | "ativo" | "dataCriacao" | "dataAtualizacao"
>;

export type FormPayload = {
  titulo: string;
  descricao: string;
  idsPerguntas: string[];
};

// --- CONTEXT ---
interface FormContextType {
  formularios: Formulario[];
  perguntas: Pergunta[];
  loading: boolean;
  getFormById: (formId: string) => Promise<Formulario | void>;
  addForm: (formData: FormPayload) => Promise<Formulario | void>;
  addQuestion: (questionData: NewQuestionData) => Promise<Pergunta | void>;
  deleteForm: (formId: string) => Promise<void>;
  updateForm: (formId: string, updatedData: Partial<FormPayload>) => Promise<Formulario | void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  updateQuestion: (questionId: string, updatedData: Partial<NewQuestionData>) => Promise<Pergunta | void>;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

// --- HELPER ---
const mapApiFormToFormulario = (apiForm: any): Formulario => ({
  ...apiForm,
  perguntas: (apiForm.perguntas || []).map((p: any) => ({
    id: p.id,
    texto: p.texto,
    tipo: p.tipo,
    opcoes: p.opcoes,
    ativo: p.ativo,
    empresaId: p.empresaId,
    dataCriacao: p.dataCriacao,
    dataAtualizacao: p.dataAtualizacao,
  })),
});

// --- PROVIDER ---
export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const empresaId = parsedUser?.empresaId;

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.empresaId) return;

      try {
        setLoading(true);
        const [formsRes, questionsRes] = await Promise.all([
          api.get(`/formularios?empresaId=${user.empresaId}`),
          api.get(`/perguntas?empresaId=${user.empresaId}`),
        ]);

        setFormularios(formsRes.data.map(mapApiFormToFormulario));
        setPerguntas(questionsRes.data);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        toast({
          title: "Erro de Rede",
          description: "Não foi possível carregar os dados.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast, user?.empresaId]);

  const getFormById = async (formId: string) => {
    try {
      const response = await api.get(`/formulario/${formId}?empresaId=${user?.empresaId}`);
      return mapApiFormToFormulario(response.data);
    } catch (error) {
      console.error(`Erro ao buscar formulário ${formId}:`, error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o formulário.",
        variant: "destructive",
      });
    }
  };

  const addForm = async (formData: FormPayload) => {
    if (!user?.empresaId) return;
    try {
      const payload = { ...formData, empresaId: user.empresaId };
      const response = await api.post("/formulario", payload);
      const newForm = mapApiFormToFormulario(response.data);
      setFormularios((current) => [...current, newForm]);
      toast({ title: "Sucesso", description: "Formulário criado!" });
      return newForm;
    } catch (error) {
      console.error("Erro ao criar formulário:", error);
      toast({ title: "Erro", description: "Não foi possível criar.", variant: "destructive" });
    }
  };

  const addQuestion = async (questionData: NewQuestionData) => {
    if (!empresaId) return;
    try {
      const payload = { ...questionData, empresaId };
      const response = await api.post("/pergunta", payload);
      const newQuestion = response.data;
      setPerguntas((current) => [...current, newQuestion]);
      toast({ title: "Sucesso", description: "Pergunta adicionada!" });
      return newQuestion;
    } catch (error) {
      console.error("Erro ao criar pergunta:", error);
      toast({ title: "Erro", description: "Não foi possível criar a pergunta.", variant: "destructive" });
    }
  };

  const deleteForm = async (formId: string) => {
    try {
      await api.delete(`/delete-formulario/${formId}`);
      setFormularios((current) => current.filter((f) => f.id !== formId));
      toast({ title: "Sucesso", description: "Formulário excluído!" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    }
  };

  const updateForm = async (formId: string, updatedData: Partial<FormPayload>) => {
    try {
      const payload = { ...updatedData, empresaId: user?.empresaId };
      const response = await api.patch(`/update-formulario/${formId}`, payload);
      const updatedForm = mapApiFormToFormulario(response.data);
      setFormularios((current) => current.map((f) => (f.id === formId ? updatedForm : f)));
      toast({ title: "Sucesso", description: "Formulário atualizado!" });
      return updatedForm;
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Não foi possível atualizar.", variant: "destructive" });
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      await api.delete(`/deletar-pergunta/${questionId}`);
      setPerguntas((current) => current.filter((q) => q.id !== questionId));
      toast({ title: "Sucesso", description: "Pergunta excluída!" });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
    }
  };

  const updateQuestion = async (questionId: string, updatedData: Partial<NewQuestionData>) => {
    try {
      const payload = { ...updatedData, empresaId: user?.empresaId };
      const response = await api.put(`/atualizar-pergunta/${questionId}`, payload);
      const updatedQuestion = response.data;
      setPerguntas((current) => current.map((q) => (q.id === questionId ? updatedQuestion : q)));
      toast({ title: "Sucesso", description: "Pergunta atualizada!" });
      return updatedQuestion;
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Não foi possível atualizar.", variant: "destructive" });
    }
  };

  return (
    <FormContext.Provider
      value={{
        formularios,
        perguntas,
        loading,
        getFormById,
        addForm,
        addQuestion,
        deleteForm,
        updateForm,
        deleteQuestion,
        updateQuestion,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

// --- HOOK ---
export const useForm = (): FormContextType => {
  const context = useContext(FormContext);
  if (!context) throw new Error("useForm must be used within a FormProvider");
  return context;
};
