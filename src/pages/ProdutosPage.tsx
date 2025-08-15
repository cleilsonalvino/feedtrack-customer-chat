import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProduct, Product, NewProductData } from "../contexts/ProductContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Edit, Trash2, Eye, RotateCcw, PackagePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const ProductsPage = () => {
  const { products, addProduct, updateProduct, deleteProduct, addMultipleProducts } = useProduct();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isInactiveModalOpen, setIsInactiveModalOpen] = useState(false);
  const [isBatchAddOpen, setIsBatchAddOpen] = useState(false); // Estado para o novo modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para o formulário de adição em lote
  const [batchProducts, setBatchProducts] = useState<NewProductData[]>([]);
  const [batchFormState, setBatchFormState] = useState<NewProductData>({ nome: "", descricao: "", valor: 0, empresaId: "" });

  const { activeProducts, inactiveProducts } = useMemo(() => {
    const active: Product[] = [];
    const inactive: Product[] = [];
    products.forEach(p => {
      if (p.ativo) {
        active.push(p);
      } else {
        inactive.push(p);
      }
    });
    return { activeProducts: active, inactiveProducts: inactive };
  }, [products]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = activeProducts.filter((p) =>
        (p.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
      setDisplayedProducts(filtered);
    } else {
      setDisplayedProducts(activeProducts);
    }
  }, [activeProducts, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const [newData, setNewData] = useState({ nome: "", descricao: "", valor: 0, empresaId: "" });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newData.nome.trim() && newData.descricao.trim() && newData.valor > 0) {
      const newProduct = await addProduct(newData); 
      if (newProduct) {
        setNewData({ nome: "", descricao: "", valor: 0, empresaId: "" });
        setIsAddDialogOpen(false);
        if (location.state?.from === "/feedbacks") {
          navigate("/feedbacks", { state: { newProductId: newProduct.id } });
        }
      }
    } else {
      toast({
        title: "Erro de Validação",
        description: "Preencha todos os campos corretamente.",
        variant: "destructive",
      });
    }
  };

  // Lógica para o modal de adição em lote
  const handleAddProductToBatch = () => {
    if (batchFormState.nome.trim() && batchFormState.descricao.trim() && batchFormState.valor > 0) {
        setBatchProducts([...batchProducts, batchFormState]);
        setBatchFormState({ nome: "", descricao: "", valor: 0, empresaId: "" }); // Reseta o formulário
    } else {
        toast({
            title: "Campos Inválidos",
            description: "Preencha nome, descrição e valor para adicionar à lista.",
            variant: "destructive",
        });
    }
  };

  const handleRemoveFromBatch = (indexToRemove: number) => {
    setBatchProducts(batchProducts.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveBatch = async () => {
    if (batchProducts.length === 0) {
        toast({
            title: "Lista Vazia",
            description: "Adicione pelo menos um produto à lista antes de salvar.",
            variant: "destructive"
        });
        return;
    }
    await addMultipleProducts(batchProducts);
    setBatchProducts([]);
    setIsBatchAddOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    await updateProduct(editingProduct);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Tem certeza que deseja desativar este produto? Ele será movido para a lista de inativos.")) {
      await deleteProduct(id);
    }
  };

  const handleReactivateProduct = async (product: Product) => {
    const productToReactivate = {
      ...product,
      ativo: true,
      dataExclusao: null,
    };
    await updateProduct(productToReactivate);
    toast({ title: "Sucesso!", description: `Produto "${product.nome}" foi reativado.` });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Produtos</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsInactiveModalOpen(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Ver Inativos ({inactiveProducts.length})
          </Button>
          
          {/* Botão para Adicionar em Lote */}
          <Button variant="outline" onClick={() => setIsBatchAddOpen(true)}>
            <PackagePlus className="w-4 h-4 mr-2" />
            Adicionar em Lote
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Produto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Produto</Label>
                  <Input id="nome" value={newData.nome} onChange={(e) => setNewData({ ...newData, nome: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input id="descricao" value={newData.descricao} onChange={(e) => setNewData({ ...newData, descricao: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input id="valor" type="number" step="0.01" value={newData.valor === 0 ? '' : newData.valor} onChange={(e) => setNewData({ ...newData, valor: Number(e.target.value) || 0 })} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Cadastrar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Input placeholder="Pesquisar produto pelo nome..." value={searchTerm} onChange={handleSearchChange} />

      <Card>
        <CardHeader>
          <CardTitle>Produtos Ativos ({displayedProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {displayedProducts.map((p) => (
              <div key={p.id} className="p-3 border rounded-md flex justify-between items-center hover:bg-muted/50">
                <div>
                  <p className="font-medium">{p.nome}</p>
                  <p className="text-sm text-gray-500">{p.descricao}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    {(p.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <Button variant="outline" size="icon" onClick={() => setEditingProduct(p)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDeleteProduct(p.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {displayedProducts.length === 0 && (<p className="text-center text-gray-500">Nenhum produto ativo encontrado.</p>)}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-nome">Nome do Produto</Label>
                <Input id="edit-nome" value={editingProduct.nome} onChange={(e) => setEditingProduct({ ...editingProduct, nome: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Input id="edit-descricao" value={editingProduct.descricao} onChange={(e) => setEditingProduct({ ...editingProduct, descricao: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-valor">Valor (R$)</Label>
                <Input id="edit-valor" type="number" step="0.01" value={editingProduct.valor === 0 ? '' : editingProduct.valor} onChange={(e) => setEditingProduct({ ...editingProduct, valor: Number(e.target.value) || 0 })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Produtos Inativos */}
      <Dialog open={isInactiveModalOpen} onOpenChange={setIsInactiveModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Produtos Inativos</DialogTitle>
            <DialogDescription>
              Lista de produtos que foram desativados. Você pode reativá-los a qualquer momento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[400px] overflow-y-auto">
            {inactiveProducts.length > 0 ? (
              inactiveProducts.map((p) => (
                <div key={p.id} className="p-3 border rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-medium">{p.nome}</p>
                    <p className="text-sm text-gray-500">
                      Desativado em: {p.dataExclusao ? new Date(p.dataExclusao).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleReactivateProduct(p)}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reativar
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 pt-10">Nenhum produto inativo.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInactiveModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NOVO MODAL: Para Adicionar Produtos em Lote */}
      <Dialog open={isBatchAddOpen} onOpenChange={setIsBatchAddOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Adicionar Produtos em Lote</DialogTitle>
            <DialogDescription>
              Preencha os dados e adicione produtos à lista. Quando terminar, clique em "Salvar Todos".
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Formulário para adicionar um item */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">Novo Item</h3>
                <div>
                    <Label htmlFor="batch-nome">Nome do Produto</Label>
                    <Input id="batch-nome" value={batchFormState.nome} onChange={(e) => setBatchFormState({ ...batchFormState, nome: e.target.value })} />
                </div>
                <div>
                    <Label htmlFor="batch-descricao">Descrição</Label>
                    <Input id="batch-descricao" value={batchFormState.descricao} onChange={(e) => setBatchFormState({ ...batchFormState, descricao: e.target.value })} />
                </div>
                <div>
                    <Label htmlFor="batch-valor">Valor (R$)</Label>
                    <Input id="batch-valor" type="number" step="0.01" value={batchFormState.valor === 0 ? '' : batchFormState.valor} onChange={(e) => setBatchFormState({ ...batchFormState, valor: Number(e.target.value) || 0 })} />
                </div>
                <Button onClick={handleAddProductToBatch} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar à Lista
                </Button>
            </div>
            {/* Lista de produtos a serem adicionados */}
            <div className="space-y-2 p-4 border rounded-lg max-h-[400px] overflow-y-auto">
                <h3 className="font-semibold text-lg">Lista para Adicionar ({batchProducts.length})</h3>
                {batchProducts.length > 0 ? (
                    batchProducts.map((p, index) => (
                        <div key={index} className="p-2 bg-muted/50 rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-medium">{p.nome}</p>
                                <p className="text-sm text-gray-500">{(p.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveFromBatch(index)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 pt-10">Nenhum produto na lista.</p>
                )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveBatch}>Salvar Todos os Produtos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
