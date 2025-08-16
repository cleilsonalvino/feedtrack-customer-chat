import React, { useState } from "react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useCustomer } from "../contexts/CustomerContext";
import { useProduct } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import api from "@/lib/api";

const SalesPage: React.FC = () => {
  const [clientId, setClientId] = useState("");
  const [productId, setProductId] = useState("");

  const { customers, loading: loadingCustomers } = useCustomer();
  const { products, loading: loadingProducts } = useProduct();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleCreateSale = async () => {
  if (!clientId || !productId || !user?.empresaId) {
    toast({
      title: "Erro",
      description: "Selecione cliente, produto e verifique se a empresa está logada.",
      variant: "destructive",
    });
    return;
  }

  try {
    // Envia a venda para a rota /venda
    const payload = {
      clienteId: clientId,
      produtoId: productId,
      empresaId: user.empresaId,
    };

    const response = await api.post("/venda", payload);

    toast({
      title: "Sucesso!",
      description: `Venda criada para Cliente: ${
        customers.find(c => c.id === clientId)?.nome
      }, Produto: ${
        products.find(p => p.id === productId)?.nome
      }`,
    });

    // Resetar o formulário
    setClientId("");
    setProductId("");
  } catch (error: any) {
    console.error("Erro ao criar venda:", error);
    toast({
      title: "Erro",
      description: error.message || "Não foi possível criar a venda.",
      variant: "destructive",
    });
  }
};


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Criar Nova Venda</h1>

      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="clientId" className="text-right">Cliente</Label>
          <Select
            onValueChange={setClientId}
            value={clientId}
            disabled={loadingCustomers || !user?.empresaId}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={
                loadingCustomers ? "Carregando clientes..." :
                !user?.empresaId ? "Faça login" :
                "Selecione um cliente"
              } />
            </SelectTrigger>
            <SelectContent>
              {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="productId" className="text-right">Produto</Label>
          <Select
            onValueChange={setProductId}
            value={productId}
            disabled={loadingProducts || !user?.empresaId}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder={
                loadingProducts ? "Carregando produtos..." :
                !user?.empresaId ? "Faça login" :
                "Selecione um produto"
              } />
            </SelectTrigger>
            <SelectContent>
              {products.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleCreateSale} disabled={loadingCustomers || loadingProducts || !user?.empresaId}>
        Criar Venda
      </Button>
    </div>
  );
};

export default SalesPage;
