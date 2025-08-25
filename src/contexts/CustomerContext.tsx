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

// Interface for a single customer, now includes 'estado'
export interface Customer {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  estado: string; // Added state field
  cidade: string;
  status: string;
  empresaId: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
  dataExclusao?: string | null;
}

// Type for creating a new customer, now includes 'estado'
export type NewCustomerData = {
  nome: string;
  email: string;
  telefone: string;
  estado: string; // Added state field
  cidade: string;
};

// Defines the shape of the context
interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  addCustomer: (data: NewCustomerData) => Promise<Customer | void>;
  updateCustomer: (customer: Omit<Customer, "produtos">) => Promise<void>;
  inativeCustomer: (id: string) => Promise<void>;
  fetchCustomers: () => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(
  undefined
);

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetches all customers for the logged-in user's company
  const fetchCustomers = async () => {
    if (!user?.empresaId) {
      setCustomers([]);
      setLoading(false);
      return;
    }
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

  // Effect to fetch customers when the user's company ID is available
  useEffect(() => {
    if (user?.empresaId) {
      fetchCustomers();
    }
  }, [user?.empresaId]);

  // Adds a new customer
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
      const payload = { ...data, empresaId: user.empresaId };
      const response = await api.post("/cliente", payload);
      setCustomers((prev) => [...prev, response.data]);
      toast({ title: "Sucesso", description: "Cliente adicionado!" });
      return response.data;
    } catch (error: any) {
      toast({
        title: "Erro ao Adicionar",
        description: error.message || "Não foi possível criar o cliente.",
        variant: "destructive",
      });
    }
  };

  // Updates an existing customer's data
  const updateCustomer = async (
    updatedCustomer: Omit<Customer, "produtos">
  ) => {
    try {
      await api.put(`/atualizar-cliente/${updatedCustomer.id}`, updatedCustomer);
      await fetchCustomers(); // Refetch to get the latest data
    } catch (error) {
      toast({
        title: "Erro ao Atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Deactivates a customer (soft delete)
  const inativeCustomer = async (id: string) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;
    const deactivated = { ...customer, status: "INATIVO" };
    await updateCustomer(deactivated);
    toast({
      title: "Sucesso",
      description: `Cliente "${customer.nome}" foi desativado.`,
    });
  };

  // Permanently deletes a customer
  const deleteCustomer = async (id: string) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) {
      toast({
        title: "Erro",
        description: "Cliente não encontrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.delete(`/deletar-cliente/${id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: "Sucesso",
        description: `Cliente "${customer.nome}" foi deletado permanentemente.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao deletar",
        description: error.message || "Não foi possível deletar o cliente.",
        variant: "destructive",
      });
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
        inativeCustomer,
        fetchCustomers,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

// Custom hook to use the CustomerContext
export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context)
    throw new Error("useCustomer must be used within CustomerProvider");
  return context;
};
