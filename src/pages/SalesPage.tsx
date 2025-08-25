import React, { useState, useEffect, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Interface atualizada para suportar múltiplos produtos
interface Sale {
  id: string;
  clienteId: string;
  produtoIds: string[]; // Alterado de produtoId para produtoIds
  clienteNome: string;
  produtoNomes: string[]; // Alterado de produtoNome para produtoNomes
  dataCriacao: string;
}

const SalesPage: React.FC = () => {
  // --- ESTADOS ---
  const [newSaleClientId, setNewSaleClientId] = useState("");
  // Estado para múltiplos produtos
  const [newSaleProductIds, setNewSaleProductIds] = useState<string[]>([]);

  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);

  // Estados para filtragem e paginação
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClientId, setFilterClientId] = useState("");
  const [filterProductId, setFilterProductId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // --- CONTEXTOS E HOOKS ---
  const { customers, loading: loadingCustomers } = useCustomer();
  const { products, loading: loadingProducts } = useProduct();
  const { user } = useAuth();
  const { toast } = useToast();

  // --- Otimização: Buscar e processar vendas ---
  useEffect(() => {
    if (loadingCustomers || loadingProducts || !user?.empresaId) return;

    const fetchAndProcessSales = async () => {
      try {
        setLoadingSales(true);
        const customerMap = new Map(customers.map(c => [c.id, c.nome]));
        const productMap = new Map(products.map(p => [p.id, p.nome]));

        const res = await api.get(`/vendas?empresaId=${user.empresaId}`);
        const vendasData = res.data;

        // Processar vendas com múltiplos produtos
        const vendasComNomes: Sale[] = vendasData.map((v: any) => ({
          id: v.id,
          clienteId: v.clienteId,
          produtoIds: v.produtoId || [], // Garante que seja um array
          clienteNome: customerMap.get(v.clienteId) || "Cliente desconhecido",
          produtoNomes: (v.produtoId || []).map((pId: string) => productMap.get(pId) || "Produto desconhecido"),
          dataCriacao: v.dataCriacao || new Date().toISOString(),
        }));

        vendasComNomes.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
        setSales(vendasComNomes);
      } catch (err) {
        console.error(err);
        toast({ title: "Erro", description: "Não foi possível carregar as vendas.", variant: "destructive" });
      } finally {
        setLoadingSales(false);
      }
    };

    fetchAndProcessSales();
  }, [user?.empresaId, toast, customers, products, loadingCustomers, loadingProducts]);

  // --- LÓGICA DE FILTRAGEM E PAGINAÇÃO (com useMemo para performance) ---
  const filteredSales = useMemo(() => {
    return sales.filter(sale =>
      (sale.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
       sale.produtoNomes.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (filterClientId === "" || sale.clienteId === filterClientId) &&
      // Filtra se algum dos produtos da venda corresponde ao filtro
      (filterProductId === "" || sale.produtoIds.includes(filterProductId))
    );
  }, [sales, searchTerm, filterClientId, filterProductId]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSales.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSales, currentPage]);


  // --- HANDLERS ---
  const handleAddProduct = (productId: string) => {
    if (productId && !newSaleProductIds.includes(productId)) {
      setNewSaleProductIds(prev => [...prev, productId]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setNewSaleProductIds(prev => prev.filter(id => id !== productId));
  };

  const handleCreateSale = async () => {
    if (!newSaleClientId || newSaleProductIds.length === 0 || !user?.empresaId) {
      toast({ title: "Erro", description: "Selecione um cliente e pelo menos um produto.", variant: "destructive" });
      return;
    }
    try {
      // Payload com array de IDs de produto
      const payload = { clienteId: newSaleClientId, produtoId: newSaleProductIds, empresaId: user.empresaId };
      const response = await api.post("/venda", payload);

      const customerName = customers.find(c => c.id === newSaleClientId)?.nome || "";
      const productNames = newSaleProductIds.map(pId => products.find(p => p.id === pId)?.nome || "");

      // Adiciona a nova venda no topo da lista
      setSales(prev => [{
        id: response.data.id,
        clienteId: newSaleClientId,
        produtoIds: newSaleProductIds,
        clienteNome: customerName,
        produtoNomes: productNames,
        dataCriacao: new Date().toISOString(),
      }, ...prev]);

      toast({ title: "Sucesso!", description: `Venda para ${customerName} criada.` });
      setNewSaleClientId("");
      setNewSaleProductIds([]);
    } catch (error) {
      console.error("Erro ao criar venda:", error);
      toast({ title: "Erro", description: "Não foi possível criar a venda.", variant: "destructive" });
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterClientId("");
    setFilterProductId("");
    setCurrentPage(1);
  };

  // --- RENDERIZAÇÃO ---
  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Formulário de criação de venda */}
      <Card>
        <CardHeader><CardTitle>Criar Nova Venda</CardTitle></CardHeader>
        <CardContent className="grid gap-6 pt-6">
          <div className="grid gap-4 md:grid-cols-3 md:items-start">
            <div className="grid gap-1.5">
              <Label htmlFor="clientId">Cliente</Label>
              <Select onValueChange={setNewSaleClientId} value={newSaleClientId} disabled={loadingCustomers}>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor="productId">Produtos</Label>
              <Select onValueChange={handleAddProduct} value="" disabled={loadingProducts}>
                <SelectTrigger><SelectValue placeholder="Adicionar um produto..." /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Badges dos produtos selecionados */}
          {newSaleProductIds.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t mt-4">
              {newSaleProductIds.map(id => {
                const product = products.find(p => p.id === id);
                return (
                  <Badge key={id} variant="secondary" className="flex items-center gap-2">
                    {product?.nome}
                    <button onClick={() => handleRemoveProduct(id)} className="rounded-full hover:bg-muted-foreground/20 p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}

          <Button onClick={handleCreateSale} disabled={loadingCustomers || loadingProducts} className="w-full md:w-auto md:justify-self-end mt-4">
            Criar Venda
          </Button>
        </CardContent>
      </Card>

      {/* Card de Filtros e Lista de Vendas */}
      <Card>
        <CardHeader>
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <CardTitle>Vendas Recentes</CardTitle>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                    Limpar Filtros
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          {/* Controles de Filtro */}
          <div className="grid gap-4 md:grid-cols-3 mb-6 p-4 border rounded-lg bg-muted/50">
            <Input
              placeholder="Buscar por nome de cliente ou produto..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="md:col-span-3"
            />
            <Select value={filterClientId} onValueChange={(val) => { setFilterClientId(val); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Filtrar por cliente" /></SelectTrigger>
              <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterProductId} onValueChange={(val) => { setFilterProductId(val); setCurrentPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Filtrar por produto" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Lista de Vendas */}
          {loadingSales ? (
            <div className="text-center p-4">Carregando vendas...</div>
          ) : paginatedSales.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              <p>Nenhuma venda encontrada.</p>
              <Button variant="link" onClick={resetFilters}>Limpar filtros</Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Produtos</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedSales.map(sale => (
                      <tr key={sale.id}>
                        <td className="px-4 py-3 font-medium">{sale.clienteNome}</td>
                        <td className="px-4 py-3">{sale.produtoNomes.join(", ")}</td>
                        <td className="px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {new Date(sale.dataCriacao).toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Controles de Paginação */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  Mostrando {paginatedSales.length} de {filteredSales.length} vendas
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">Página {currentPage} de {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesPage;
