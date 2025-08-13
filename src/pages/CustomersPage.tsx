// src/pages/CustomersPage.tsx

import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useCustomer,
  Customer,
  NewCustomerData,
} from "@/contexts/CustomerContext";
import { useProduct, Product } from "@/contexts/ProductContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  PackagePlus,
  List,
  Replace,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const CustomersPage = () => {
  // <<< CORRIGIDO: Usando a nova função `manageProductAssociation`
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    manageCustomerProducts, 
    loading,
  } = useCustomer();
  const { products: availableProducts } = useProduct();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isInactiveModalOpen, setIsInactiveModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [addingProductsToCustomer, setAddingProductsToCustomer] =
    useState<Customer | null>(null);
  const [viewingCustomerProducts, setViewingCustomerProducts] =
    useState<Customer | null>(null);
  const [replacingProduct, setReplacingProduct] = useState<{
    customer: Customer;
    oldProductId: string;
  } | null>(null);

  const [newCustomerData, setNewCustomerData] = useState<
    Omit<NewCustomerData, "idsProdutos">
  >({
    pessoa: { nome: "", email: "", telefone: "" },
    cidade: "",
    vendedorResponsavel: "",
  });
  const [initialSelectedProductId, setInitialSelectedProductId] = useState<
    string | null
  >(null);
  const [newlySelectedProducts, setNewlySelectedProducts] = useState<string[]>(
    []
  );

  const { activeCustomers, inactiveCustomers } = useMemo(() => {
    const active: Customer[] = [];
    const inactive: Customer[] = [];
    customers.forEach((c) => {
      c.status === "ATIVO" ? active.push(c) : inactive.push(c);
    });
    return { activeCustomers: active, inactiveCustomers: inactive };
  }, [customers]);

  const filteredCustomers = useMemo(
    () =>
      activeCustomers.filter(
        (customer) =>
          (customer.pessoa.nome || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (customer.pessoa.email || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      ),
    [activeCustomers, searchTerm]
  );

  const handleAddCustomer = async () => {
    if (
      !newCustomerData.pessoa.nome ||
      !newCustomerData.pessoa.email ||
      !initialSelectedProductId
    ) {
      toast({
        title: "Erro de Validação",
        description: "Nome, email e um produto inicial são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    const payload: NewCustomerData = {
      ...newCustomerData,
      idsProdutos: [initialSelectedProductId],
    };
    const createdCustomer = await addCustomer(payload);
    if (createdCustomer) {
      setNewCustomerData({
        pessoa: { nome: "", email: "", telefone: "" },
        cidade: "",
        vendedorResponsavel: "",
      });
      setInitialSelectedProductId(null);
      setIsAddDialogOpen(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;
    try {
      await updateCustomer(editingCustomer);
      setEditingCustomer(null);
      toast({ title: "Sucesso!", description: "Cliente atualizado." });
    } catch (error) {
      // O erro já é tratado no contexto
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm("Tem certeza que deseja desativar este cliente?")) {
      await deleteCustomer(id);
    }
  };

  const handleReactivateCustomer = async (customer: Customer) => {
    const customerToReactivate = { ...customer, status: "ATIVO" };
    try {
      await updateCustomer(customerToReactivate);
      toast({
        title: "Sucesso!",
        description: `Cliente "${customer.pessoa.nome}" foi reativado.`,
      });
    } catch (error) {
      // O erro já é tratado no contexto
    }
  };

  const handleSaveNewProducts = async () => {
    if (!addingProductsToCustomer || newlySelectedProducts.length === 0) return;
    try {
      await manageCustomerProducts(addingProductsToCustomer.id, {
        idsProdutosParaAdicionar: newlySelectedProducts,
      });
      setAddingProductsToCustomer(null);
      setNewlySelectedProducts([]);
      // O toast de sucesso já está na função do contexto
    } catch (error) {
      // O erro já é tratado no contexto
    }
  };


  const handleRemoveProduct = async (customer: Customer, productId: string) => {
    if (
      window.confirm("Tem certeza que deseja remover este produto do cliente?")
    ) {
      try {
        await manageCustomerProducts(customer.id, {
          idsProdutosParaRemover: [productId],
        });
        // Fecha o modal. A atualização dos dados é feita pelo fetch no contexto.
        setViewingCustomerProducts(null);
      } catch (error) {
        // O erro já é tratado no contexto
      }
    }
  };

  const handleReplaceProduct = async (newProductId: string) => {
    if (!replacingProduct) return;
    try {
      await manageCustomerProducts(replacingProduct.customer.id, {
        idsProdutosParaAdicionar: [newProductId],
        idsProdutosParaRemover: [replacingProduct.oldProductId],
      });
      setReplacingProduct(null);
      setViewingCustomerProducts(null); // Fecha ambos os modais
    } catch (error) {
      // O erro já é tratado no contexto
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 mt-10">
      <div className="flex flex-col ">
        <div className="flex">
          <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
          <p className="m-2 text-muted-foreground">
            Cadastre e gerencie seus clientes
          </p>
        </div>
        <div className="flex justify-between items-center gap-2 flex-wrap">
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
                    value={newCustomerData.pessoa.nome}
                    onChange={(e) =>
                      setNewCustomerData((prev) => ({
                        ...prev,
                        pessoa: { ...prev.pessoa, nome: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomerData.pessoa.email}
                    onChange={(e) =>
                      setNewCustomerData((prev) => ({
                        ...prev,
                        pessoa: { ...prev.pessoa, email: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={newCustomerData.pessoa.telefone}
                    onChange={(e) =>
                      setNewCustomerData((prev) => ({
                        ...prev,
                        pessoa: { ...prev.pessoa, telefone: e.target.value },
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
                <div>
                  <Label htmlFor="vendedor">Vendedor Responsável</Label>
                  <Input
                    id="vendedor"
                    value={newCustomerData.vendedorResponsavel}
                    onChange={(e) =>
                      setNewCustomerData((prev) => ({
                        ...prev,
                        vendedorResponsavel: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="produtos">Produto Inicial *</Label>
                  <Select
                    onValueChange={(value) =>
                      setInitialSelectedProductId(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts
                        .filter((p) => p.ativo)
                        .map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
                          {customer.pessoa.nome}
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
                          {customer.pessoa.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {customer.pessoa.telefone || "Não informado"}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {customer.cidade || "Não informado"}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {customer.vendedorResponsavel || "Não informado"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Ver Produtos"
                        onClick={() => setViewingCustomerProducts(customer)}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Adicionar Produtos"
                        onClick={() => setAddingProductsToCustomer(customer)}
                      >
                        <PackagePlus className="w-4 h-4" />
                      </Button>
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
                  value={editingCustomer.pessoa.nome}
                  onChange={(e) =>
                    setEditingCustomer((prev) =>
                      prev
                        ? {
                            ...prev,
                            pessoa: { ...prev.pessoa, nome: e.target.value },
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
                  value={editingCustomer.pessoa.email}
                  onChange={(e) =>
                    setEditingCustomer((prev) =>
                      prev
                        ? {
                            ...prev,
                            pessoa: { ...prev.pessoa, email: e.target.value },
                          }
                        : null
                    )
                  }
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={editingCustomer.pessoa.telefone}
                  onChange={(e) =>
                    setEditingCustomer((prev) =>
                      prev
                        ? {
                            ...prev,
                            pessoa: {
                              ...prev.pessoa,
                              telefone: e.target.value,
                            },
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
              <div>
                <Label>Vendedor Responsável</Label>
                <Input
                  value={editingCustomer.vendedorResponsavel}
                  onChange={(e) =>
                    setEditingCustomer((prev) =>
                      prev
                        ? { ...prev, vendedorResponsavel: e.target.value }
                        : null
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
                      {customer.pessoa.nome}
                    </p>
                    <p className="text-sm text-gray-500">
                      {customer.pessoa.email}
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

      {addingProductsToCustomer && (
        <Dialog
          open={!!addingProductsToCustomer}
          onOpenChange={() => {
            setAddingProductsToCustomer(null);
            setNewlySelectedProducts([]);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Adicionar Produtos a {addingProductsToCustomer.pessoa.nome}
              </DialogTitle>
              <DialogDescription>
                Selecione os produtos para adicionar a este cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Label>Produtos Disponíveis</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                {availableProducts
                  .filter(
                    (p) =>
                      p.ativo &&
                      !addingProductsToCustomer.produtos.some(
                        (cp) => cp.id === p.id
                      )
                  )
                  .map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`prod-${product.id}`}
                        onCheckedChange={(checked) => {
                          setNewlySelectedProducts((prev) =>
                            checked
                              ? [...prev, product.id]
                              : prev.filter((id) => id !== product.id)
                          );
                        }}
                      />
                      <label
                        htmlFor={`prod-${product.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {product.nome}
                      </label>
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setAddingProductsToCustomer(null);
                  setNewlySelectedProducts([]);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveNewProducts}>
                Adicionar Selecionados
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {viewingCustomerProducts && (
        <Dialog
          open={!!viewingCustomerProducts}
          onOpenChange={() => setViewingCustomerProducts(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Produtos de {viewingCustomerProducts.pessoa.nome}
              </DialogTitle>
              <DialogDescription>
                Visualize, remova ou substitua os produtos deste cliente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
              {viewingCustomerProducts.produtos.length > 0 ? (
                viewingCustomerProducts.produtos.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 border rounded-md flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{product.nome}</p>
                      <p className="text-sm text-gray-500">
                        {product.descricao}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Substituir Produto"
                        onClick={() =>
                          setReplacingProduct({
                            customer: viewingCustomerProducts,
                            oldProductId: product.id,
                          })
                        }
                      >
                        <Replace className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        title="Remover Produto"
                        onClick={() =>
                          handleRemoveProduct(
                            viewingCustomerProducts,
                            product.id
                          )
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">
                  Este cliente ainda não possui produtos.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {replacingProduct && (
        <Dialog
          open={!!replacingProduct}
          onOpenChange={() => setReplacingProduct(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Substituir Produto</DialogTitle>
              <DialogDescription>
                Selecione o novo produto para substituir o antigo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Label>Selecione o novo produto</Label>
              <Select onValueChange={handleReplaceProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um novo produto..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts
                    .filter(
                      (p) =>
                        p.ativo &&
                        !replacingProduct.customer.produtos.some(
                          (cp) => cp.id === p.id
                        )
                    )
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
