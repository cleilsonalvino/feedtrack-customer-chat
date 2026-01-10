import React, { useState, useMemo, useEffect } from "react";
import {
  useCustomer,
  Customer,
  NewCustomerData,
} from "../contexts/CustomerContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Edit, Loader2, Mail, MapPin, Phone, Plus, Search, Trash2 } from "lucide-react";

// Interfaces IBGE
interface IBGEUFResponse { id: number; sigla: string; nome: string; }
interface IBGECityResponse { id: number; nome: string; }

export const CustomersPage = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, loading } = useCustomer();
  const { toast } = useToast();

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // IBGE state/city
  const [estados, setEstados] = useState<IBGEUFResponse[]>([]);
  const [cidades, setCidades] = useState<IBGECityResponse[]>([]);
  const [selectedEstado, setSelectedEstado] = useState("");

  const [editFormData, setEditFormData] = useState<NewCustomerData>({
  nome: "",
  email: "",
  telefone: "",
  estado: "",
  cidade: "",
});


  // Form state
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerData>({
    nome: "",
    email: "",
    telefone: "",
    estado: "",
    cidade: "",
  });

  // Fetch estados
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
        const data = await res.json();
        setEstados(data);
      } catch (error) {
        toast({ title: "Erro de API", description: "Não foi possível carregar estados.", variant: "destructive" });
      }
    };
    fetchEstados();
  }, [toast]);

  // Fetch cidades
  useEffect(() => {
    if (!selectedEstado) { setCidades([]); return; }
    const fetchCidades = async () => {
      try {
        const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedEstado}/municipios`);
        const data = await res.json();
        setCidades(data);
      } catch {
        toast({ title: "Erro de API", description: "Não foi possível carregar cidades.", variant: "destructive" });
      }
    };
    fetchCidades();
  }, [selectedEstado, toast]);

  // Prepara edição
// Preenche o formulário de edição quando um cliente é selecionado
useEffect(() => {
  if (editingCustomer) {
    setEditFormData({
      nome: editingCustomer.nome || "",
      email: editingCustomer.email || "",
      telefone: formatPhone(editingCustomer.telefone || ""),
      estado: editingCustomer.estado || "",
      cidade: editingCustomer.cidade || "",
    });
    if (editingCustomer.estado) setSelectedEstado(editingCustomer.estado);
  }
}, [editingCustomer]);


  // Separação ativos/inativos
  const activeCustomers = useMemo(() => customers.filter(c => c.status === "ATIVO"), [customers]);
  const inactiveCustomers = useMemo(() => customers.filter(c => c.status !== "ATIVO"), [customers]);

  // Filtragem por busca
  const filteredCustomers = useMemo(() =>
    activeCustomers.filter(c =>
      (c.nome || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(searchTerm.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  , [activeCustomers, searchTerm]);

  // Validação
  const validateCustomer = (customer: NewCustomerData | Customer) => {
    const errors: { [key: string]: string } = {};
    if (!customer.nome?.trim()) errors.nome = "Nome é obrigatório";
    if (!customer.email?.trim()) errors.email = "Email é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) errors.email = "Email inválido";

    if (customer.telefone) {
      const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!telefoneRegex.test(customer.telefone)) errors.telefone = "Telefone inválido";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Formata telefone
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6,10)}`;
  };

  const handleAddCustomer = async () => {
    if (!validateCustomer(newCustomerData)) return;
    const customerToAdd = { ...newCustomerData, telefone: newCustomerData.telefone?.replace(/\D/g, "") };
    const createdCustomer = await addCustomer(customerToAdd);
    if (createdCustomer) {
      setNewCustomerData({ nome:"", email:"", telefone:"", estado:"", cidade:"" });
      setSelectedEstado("");
      setFormErrors({});
      setIsAddDialogOpen(false);
    }
  };

const handleSaveEdit = async () => {
  if (!editingCustomer || !validateCustomer(editFormData)) return;

  const customerToUpdate = {
    ...editingCustomer,
    ...editFormData,
    telefone: editFormData.telefone.replace(/\D/g, ""),
  };

  await updateCustomer(customerToUpdate);
  setEditingCustomer(null);
  setFormErrors({});
  toast({ title: "Sucesso!", description: "Cliente atualizado." });
};

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      await deleteCustomer(id);
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
<Input
  id="telefone"
  value={newCustomerData.telefone}
  onChange={(e) => {
    const rawValue = e.target.value;
    setNewCustomerData((prev) => ({
      ...prev,
      telefone: formatPhone(rawValue),
    }));
  }}
  placeholder="(79) 9861-5536"
/>

                  {formErrors.telefone && (
                    <p className="text-red-500 text-sm">
                      {formErrors.telefone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={newCustomerData.estado}
                    onValueChange={(value) => {
                      setSelectedEstado(value);
                      setNewCustomerData((prev) => ({
                        ...prev,
                        estado: value,
                        cidade: "", // Reset city on state change
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((uf) => (
                        <SelectItem key={uf.id} value={uf.sigla}>
                          {uf.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Select
                    value={newCustomerData.cidade}
                    onValueChange={(value) =>
                      setNewCustomerData((prev) => ({ ...prev, cidade: value }))
                    }
                    disabled={!newCustomerData.estado || cidades.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {cidades.map((city) => (
                        <SelectItem key={city.id} value={city.nome}>
                          {city.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                          {customer.cidade && customer.estado
                            ? `${customer.cidade} - ${customer.estado}`
                            : "Não informado"}
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
    onOpenChange={(open) => !open && setEditingCustomer(null)}
  >
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Editar Cliente</DialogTitle>
        <DialogDescription>
          Altere os dados do cliente conforme necessário.
        </DialogDescription>
      </DialogHeader>

      {/* Formulário de edição */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={editFormData.nome}
            onChange={(e) =>
              setEditFormData((prev) => ({ ...prev, nome: e.target.value }))
            }
          />
          {formErrors.nome && <p className="text-red-500 text-sm">{formErrors.nome}</p>}
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={editFormData.email}
            onChange={(e) =>
              setEditFormData((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label>Telefone</Label>
          <Input
            value={editFormData.telefone}
            onChange={(e) =>
              setEditFormData((prev) => ({
                ...prev,
                telefone: formatPhone(e.target.value),
              }))
            }
          />
          {formErrors.telefone && <p className="text-red-500 text-sm">{formErrors.telefone}</p>}
        </div>

        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            value={editFormData.estado}
            onValueChange={(value) => {
              setSelectedEstado(value);
              setEditFormData((prev) => ({ ...prev, estado: value, cidade: "" }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um estado" />
            </SelectTrigger>
            <SelectContent>
              {estados.map((uf) => (
                <SelectItem key={uf.id} value={uf.sigla}>
                  {uf.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cidade</Label>
          <Select
            value={editFormData.cidade}
            onValueChange={(value) =>
              setEditFormData((prev) => ({ ...prev, cidade: value }))
            }
            disabled={!editFormData.estado || cidades.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma cidade" />
            </SelectTrigger>
            <SelectContent>
              {cidades.map((city) => (
                <SelectItem key={city.id} value={city.nome}>
                  {city.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => setEditingCustomer(null)}>
          Cancelar
        </Button>
        <Button onClick={handleSaveEdit}>Guardar Alterações</Button>
      </div>
    </DialogContent>
  </Dialog>
)}
    </div>
  );
};
