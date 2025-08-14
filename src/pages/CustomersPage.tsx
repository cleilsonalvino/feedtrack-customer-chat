// src/pages/CustomersPage.tsx

import React, { useState, useMemo } from "react";
import {
  useCustomer,
  Customer,
  NewCustomerData,
} from "../contexts/CustomerContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Eye,
  RotateCcw,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";

export const CustomersPage = () => {
  // Use the customer context to manage customer data
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    loading,
  } = useCustomer();
  const { toast } = useToast();

  // State for managing UI interactions
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isInactiveModalOpen, setIsInactiveModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // State for the new customer form, matching the updated NewCustomerData type
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerData>({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
  });

  // Memoized separation of active and inactive customers for performance
  const { activeCustomers, inactiveCustomers } = useMemo(() => {
    const active: Customer[] = [];
    const inactive: Customer[] = [];
    customers.forEach((c) => {
      c.status === "ATIVO" ? active.push(c) : inactive.push(c);
    });
    return { activeCustomers: active, inactiveCustomers: inactive };
  }, [customers]);

  // Memoized filtering of customers based on the search term
  const filteredCustomers = useMemo(
    () =>
      activeCustomers.filter(
        (customer) =>
          (customer.nome || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (customer.email || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      ),
    [activeCustomers, searchTerm]
  );

  // Handler to add a new customer
  const handleAddCustomer = async () => {
    // Validation using the new flat structure
    if (!newCustomerData.nome || !newCustomerData.email) {
      toast({
        title: "Erro de Validação",
        description: "Nome e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    // The context handles adding 'empresaId' and structuring the final payload
    const createdCustomer = await addCustomer(newCustomerData);
    if (createdCustomer) {
      // Reset form with the new flat structure and close dialog on success
      setNewCustomerData({
        nome: "",
        email: "",
        telefone: "",
        cidade: "",
      });
      setIsAddDialogOpen(false);
    }
  };

  // Handler to save edits to an existing customer
  const handleSaveEdit = async () => {
    if (!editingCustomer) return;
    try {
      await updateCustomer(editingCustomer);
      setEditingCustomer(null);
      toast({ title: "Sucesso!", description: "Cliente atualizado." });
    } catch (error) {
      // Error is already handled and toasted in the context
    }
  };

  // Handler to deactivate a customer (soft delete)
  const handleDeleteCustomer = async (id: string) => {
    // A confirmation dialog is a good practice before destructive actions
    if (window.confirm("Tem certeza que deseja desativar este cliente?")) {
      await deleteCustomer(id);
    }
  };

  // Handler to reactivate an inactive customer
  const handleReactivateCustomer = async (customer: Customer) => {
    const customerToReactivate = { ...customer, status: "ATIVO" as const };
    try {
      await updateCustomer(customerToReactivate);
      toast({
        title: "Sucesso!",
        description: `Cliente "${customer.nome}" foi reativado.`,
      });
      // Close the inactive modal if it's the last one
      if (inactiveCustomers.length === 1) {
        setIsInactiveModalOpen(false);
      }
    } catch (error) {
      // Error is already handled and toasted in the context
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 mt-10">
      <div className="flex flex-col ">
        <div className="flex items-baseline">
          <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
          <p className="ml-4 text-muted-foreground">
            Cadastre e gerencie seus clientes
          </p>
        </div>
        <div className="flex justify-between items-center gap-2 flex-wrap mt-4">
          <Button
            variant="outline"
            onClick={() => setIsInactiveModalOpen(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Inativos ({inactiveCustomers.length})
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                <DialogDescription>
                  Preencha as informações para criar um novo cliente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={newCustomerData.nome}
                    onChange={(e) =>
                      setNewCustomerData((prev) => ({
                        ...prev,
                        nome: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomerData.email}
                    onChange={(e) =>
                      setNewCustomerData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={newCustomerData.telefone}
                    onChange={(e) =>
                      setNewCustomerData((prev) => ({
                        ...prev,
                        telefone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={newCustomerData.cidade}
                    onChange={(e) =>
                      setNewCustomerData((prev) => ({
                        ...prev,
                        cidade: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleAddCustomer}>Adicionar Cliente</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes Ativos ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="ml-4">A carregar...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {customer.nome}
                        </h3>
                        <Badge
                          variant={
                            customer.status === "ATIVO"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {customer.status}
                        </Badge>
                      </div>
                      <div className="gap-x-4 gap-y-2 text-sm text-muted-foreground flex flex-wrap">
                        <div className="flex items-center gap-2 ">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {customer.telefone || "Não informado"}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {customer.cidade || "Não informado"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Editar Cliente"
                        onClick={() => setEditingCustomer(customer)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        title="Desativar Cliente"
                        onClick={() => handleDeleteCustomer(customer.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredCustomers.length === 0 && !loading && (
                <div className="text-center text-muted-foreground py-10">
                  Nenhum cliente ativo encontrado.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      {editingCustomer && (
        <Dialog
          open={!!editingCustomer}
          onOpenChange={() => setEditingCustomer(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>
                Altere os dados do cliente conforme necessário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editingCustomer.nome}
                  onChange={(e) =>
                    setEditingCustomer((prev) =>
                      prev
                        ? {
                            ...prev,
                             nome: e.target.value 
                          }
                        : null
                    )
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingCustomer.email}
                  onChange={(e) =>
                    setEditingCustomer((prev) =>
                      prev
                        ? {
                            ...prev,
                            email: e.target.value,
                          }
                        : null
                    )
                  }
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={editingCustomer.telefone}
                  onChange={(e) =>
                    setEditingCustomer((prev) =>
                      prev
                        ? {
                            ...prev,
                              telefone: e.target.value,
                          }
                        : null
                    )
                  }
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={editingCustomer.cidade}
                  onChange={(e) =>
                    setEditingCustomer((prev) =>
                      prev ? { ...prev, cidade: e.target.value } : null
                    )
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingCustomer(null)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit}>Guardar Alterações</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Inactive Customers Dialog */}
      <Dialog open={isInactiveModalOpen} onOpenChange={setIsInactiveModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Clientes Inativos</DialogTitle>
            <DialogDescription>
              Visualize e reative clientes inativos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
            {inactiveCustomers.length > 0 ? (
              inactiveCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-3 border rounded-md flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-muted-foreground">
                      {customer.nome}
                    </p>
                    <p className="text-sm text-gray-500">
                      {customer.email}
                    </p>
                  </div>
                  <Button onClick={() => handleReactivateCustomer(customer)}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reativar
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">
                Nenhum cliente inativo.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
