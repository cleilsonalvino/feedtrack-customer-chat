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

export interface Customer {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  status: string;
  empresaId: string; // agora obrigatório
  dataCriacao?: string;
  dataAtualizacao?: string;
  dataExclusao?: string | null;
}

export type NewCustomerData = {
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
};

// --- CONTEXT TYPE ---
interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  addCustomer: (newCustomerData: NewCustomerData) => Promise<Customer | void>;
  updateCustomer: (
    updatedCustomer: Omit<Customer, "produtos">
  ) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  fetchCustomers: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(
  undefined
);

// --- PROVIDER COMPONENT ---
export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth(); // ✅ pega o usuário logado do AuthContext

  const fetchCustomers = async () => {
    if (!user?.empresaId) return;
    try {
      setLoading(true);
      const response = await api.get(`/clientes?empresaId=${user.empresaId}`);
      setCustomers(response.data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast({
        title: "Erro de Rede",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user?.empresaId]);

  const addCustomer = async (data: NewCustomerData) => {
    if (!user?.empresaId) {
      toast({
        title: "Erro",
        description: "Usuário não associado a nenhuma empresa.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        ...data,
        empresaId: user.empresaId, // ✅ adiciona empresaId automaticamente
      };

      const response = await api.post("/cliente", payload);
      const newCustomer = response.data;

      setCustomers((current) => [...current, newCustomer]);
      toast({
        title: "Sucesso",
        description: "Cliente adicionado com sucesso!",
      });

      return newCustomer;
    } catch (error: any) {
      console.error("Erro ao adicionar cliente:", error);
      toast({
        title: "Erro ao Adicionar",
        description: error.message || "Não foi possível criar o cliente.",
        variant: "destructive",
      });
    }
  };

  const updateCustomer = async (
    updatedCustomer: Omit<Customer, "produtos">
  ) => {
    try {
      await api.put(
        `/atualizar-cliente/${updatedCustomer.id}`,
        updatedCustomer
      );
      await fetchCustomers();
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      toast({
        title: "Erro ao Atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
      throw error;
    }
  };

  

  const deleteCustomer = async (id: string) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;

    const deactivatedCustomer = { ...customer, status: "INATIVO" };

    try {
      await updateCustomer(deactivatedCustomer);
      toast({
        title: "Sucesso",
        description: `Cliente "${customer.nome}" foi desativado.`,
      });
    } catch (error) {
      // já tratado
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        loading,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        fetchCustomers,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (!context)
    throw new Error("useCustomer must be used within a CustomerProvider");
  return context;
};
