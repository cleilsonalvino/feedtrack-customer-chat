import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCustomer, Customer } from "../contexts/CustomerContext";
import { useProduct, Product } from "../contexts/ProductContext";
// Importa os novos tipos e a função do contexto
import { useFeedBack, FeedbackApiRequest, ManualFeedbackRequest } from "@/contexts/FeedBackContext";

import {
  Star,
  Search,
  X,
  Trash2,
  User,
  ShoppingBag,
  Building,
  FilterX,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileJson,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DisplayFeedback = {
  id: string;
  customerId: string;
  customerName: string;
  productName: string;
  rating: number;
  comment: string;
  date: string;
  employeeName: string;
  type: "Atendimento" | "Produto" | "Empresa";
};

type Alerta = { tipo: "success" | "danger"; mensagem: string };

const RatingStars = ({
  rating,
  interactive = false,
  onRate,
  size = "md",
}: {
  rating: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}) => {
  const starSize =
    size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-8 h-8";
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          } ${interactive ? "cursor-pointer" : ""}`}
          onClick={() => interactive && onRate?.(i + 1)}
        />
      ))}
    </div>
  );
};

const ITEMS_PER_PAGE = 5;

export const FeedbacksPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customers } = useCustomer();
  const { products } = useProduct();
  const {
    feedbacks: apiFeedbacks,
    fetchFeedbacks,
    createFeedback,
    createManualFeedback, // <-- Pega a nova função do contexto
    deleteFeedback,
    loading,
    error: apiError,
  } = useFeedBack();
  
  const [alerta, setAlerta] = useState<Alerta | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [formState, setFormState] = useState({
    rating: 5,
    comment: "",
    employeeName: "",
    type: "Atendimento" as DisplayFeedback["type"],
  });
  const [filters, setFilters] = useState({
    searchTerm: "",
    type: "all",
    rating: 0,
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm) return [];
    return customers.filter((c) =>
      c.pessoa.nome.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  }, [customerSearchTerm, customers]);

  const filteredProducts = useMemo(() => {
    if (!productSearchTerm) return [];
    return products.filter((p) =>
      p.nome.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [productSearchTerm, products]);

  const transformedFeedbacks = useMemo((): DisplayFeedback[] => {
    return (apiFeedbacks || []).map((fb) => {
      const getAnswer = (questionId: string) =>
        fb.respostas.find((r) => r.perguntaId === questionId)?.resposta;

      const customerId = getAnswer("customerId");
      const productId = getAnswer("productId");

      const customer = customerId ? customers.find((c) => c.id === customerId) : null;
      const product = productId ? products.find((p) => p.id === productId) : null;

      return {
        id: fb.id,
        customerId: customer?.id ?? "",
        customerName: customer?.pessoa?.nome ?? "Cliente Desconhecido",
        productName: product?.nome ?? "Produto Desconhecido",
        rating: Number(getAnswer("rating")) || 0,
        comment: getAnswer("comment") || "",
        date: fb.dataCriacao,
        employeeName: getAnswer("employeeName") || "N/A",
        type: getAnswer("feedbackType") || "Empresa",
      };
    });
  }, [apiFeedbacks, customers, products]);

  const filteredFeedbacks = useMemo(() => {
    setCurrentPage(1);
    return transformedFeedbacks.filter((fb) => {
        const searchTermLower = filters.searchTerm.toLowerCase();
        const matchSearch = filters.searchTerm
          ? fb.customerName.toLowerCase().includes(searchTermLower) ||
            fb.productName.toLowerCase().includes(searchTermLower) ||
            fb.employeeName.toLowerCase().includes(searchTermLower) ||
            fb.comment.toLowerCase().includes(searchTermLower)
          : true;
        const matchType =
          filters.type !== "all" ? fb.type === filters.type : true;
        const matchRating =
          filters.rating > 0 ? fb.rating === filters.rating : true;
        const matchStartDate = filters.startDate
          ? new Date(fb.date) >= new Date(filters.startDate)
          : true;
        const matchEndDate = filters.endDate
          ? new Date(fb.date) <= new Date(filters.endDate)
          : true;
    
        return (
          matchSearch && matchType && matchRating && matchStartDate && matchEndDate
        );
      });
  }, [transformedFeedbacks, filters]);
  
  const paginatedFeedbacks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFeedbacks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFeedbacks, currentPage]);

  const totalPages = Math.ceil(filteredFeedbacks.length / ITEMS_PER_PAGE);
  
  useEffect(() => {
      const { newCustomerId, newProductId } = location.state || {};
      if (newCustomerId && customers.length > 0) {
        const customer = customers.find(c => c.id === newCustomerId);
        if (customer) setSelectedCustomer(customer);
      }
      if (newProductId && products.length > 0) {
        const product = products.find(p => p.id === newProductId);
        if (product) setSelectedProduct(product);
      }
      if (newCustomerId || newProductId)
        window.history.replaceState({}, document.title);
    }, [location.state, customers, products]);

  const clearForm = () => {
    setSelectedCustomer(null);
    setCustomerSearchTerm("");
    setSelectedProduct(null);
    setProductSearchTerm("");
    setFormState({
      rating: 5,
      comment: "",
      employeeName: "",
      type: "Atendimento",
    });
  };

  const handleDeleteFeedback = async (idToDelete: string) => {
    // Usando um modal customizado no futuro seria melhor
    if (window.confirm("Tem certeza que deseja excluir este feedback?")) {
      const success = await deleteFeedback(idToDelete);
      setAlerta({
        tipo: success ? "success" : "danger",
        mensagem: success
          ? "Feedback excluído com sucesso!"
          : apiError || "Erro ao excluir feedback.",
      });
      setTimeout(() => setAlerta(null), 3000);
    }
  };

  const handleAddFeedback = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedProduct) {
      setAlerta({ tipo: "danger", mensagem: "Selecione um cliente e um produto." });
      return;
    }
    if (!formState.comment.trim()) {
      setAlerta({ tipo: "danger", mensagem: "O campo de comentário é obrigatório." });
      return;
    }

    const requestData: FeedbackApiRequest = {
      formularioId: "form-geral-feedback-v1",
      envioId: crypto.randomUUID(),
      respostas: [
        { perguntaId: "customerId", resposta: selectedCustomer.id },
        { perguntaId: "productId", resposta: selectedProduct.id },
        { perguntaId: "rating", resposta: formState.rating },
        { perguntaId: "comment", resposta: formState.comment },
        { perguntaId: "employeeName", resposta: formState.employeeName },
        { perguntaId: "feedbackType", resposta: formState.type },
      ],
    };

    const result = await createFeedback(requestData);
    if (result) {
      clearForm();
      setAlerta({ tipo: "success", mensagem: "Feedback adicionado com sucesso!" });
    } else {
      setAlerta({ tipo: "danger", mensagem: apiError || "Não foi possível adicionar o feedback." });
    }
    setTimeout(() => setAlerta(null), 4000);
  };

  // =======================================================================
  // NOVA FUNÇÃO PARA LIDAR COM O ENVIO MANUAL 👇
  // =======================================================================
  const handleAddManualFeedback = async () => {
    const manualJson: ManualFeedbackRequest = {
      "formularioId": "03f347c2-3d16-4816-8773-ae25aa5d9821",
      "envioId": "fb74e297-7b13-4634-8532-5b48ecb6f3db",
      "respostas": [
        {
          "perguntaId": "comment", // Mapeado para 'comment'
          "tipo": "texto",
          "resposta_texto": "Gostei do atendimento, mas o produto veio com defeito."
        },
        {
          "perguntaId": "rating", // Mapeado para 'rating'
          "tipo": "nota",
          "nota": 2
        },
        // Adicionando os campos que faltam para o feedback ser completo na UI
        { "perguntaId": "customerId", "tipo": "texto", "resposta_texto": customers[0]?.id || "cliente-padrao" },
        { "perguntaId": "productId", "tipo": "texto", "resposta_texto": products[0]?.id || "produto-padrao" },
        { "perguntaId": "employeeName", "tipo": "texto", "resposta_texto": "Atendente Manual" },
        { "perguntaId": "feedbackType", "tipo": "texto", "resposta_texto": "Produto" },
      ]
    };

    setAlerta({ tipo: "success", mensagem: "Processando feedback manual..." });
    const result = await createManualFeedback(manualJson);

    if (result) {
      setAlerta({ tipo: "success", mensagem: "Feedback manual adicionado com sucesso!" });
    } else {
      setAlerta({ tipo: "danger", mensagem: apiError || "Não foi possível adicionar o feedback manual." });
    }
    setTimeout(() => setAlerta(null), 4000);
  };
  
  return (
    <div className="p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-bold">Gestão de Feedbacks</h1>

      <Card>
        <CardHeader><CardTitle>Adicionar Feedback</CardTitle></CardHeader>
        <CardContent>
          {alerta && (<div className={`p-3 rounded-md mb-4 text-sm ${ alerta.tipo === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800" }`}>{alerta.mensagem}</div>)}
          
          {/* Formulário Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* ... (código de busca de cliente) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">1. Cliente</label>
              {!selectedCustomer ? (
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="text" value={customerSearchTerm} onChange={(e) => setCustomerSearchTerm(e.target.value)} placeholder="Busque o cliente..." className="pl-9" />
                  {customerSearchTerm && (
                    <ul className="border rounded-md max-h-32 overflow-y-auto bg-white z-10 absolute w-full shadow-lg">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((c) => (
                          <li key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearchTerm(""); }} className="p-2 hover:bg-primary/10 cursor-pointer">
                            {c.pessoa.nome}
                          </li>
                        ))
                      ) : (
                        <div className="p-2 text-center text-gray-500">
                          <p className="text-sm">Cliente não encontrado.</p>
                          <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate("/customers", { state: { from: "/feedbacks" } })}>
                            Cadastrar Novo Cliente
                          </Button>
                        </div>
                      )}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="p-2 bg-muted rounded-md flex justify-between items-center">
                  <span className="font-medium">{selectedCustomer.pessoa.nome}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}><X className="w-4 h-4" /></Button>
                </div>
              )}
            </div>
            {/* ... (código de busca de produto) ... */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">2. Produto</label>
              {!selectedProduct ? (
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="text" value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} placeholder="Busque o produto..." className="pl-9" />
                  {productSearchTerm && (
                       <ul className="border rounded-md max-h-32 overflow-y-auto bg-white z-10 absolute w-full shadow-lg">
                           {filteredProducts.length > 0 ? (
                             filteredProducts.map((p) => (
                               <li key={p.id} onClick={() => { setSelectedProduct(p); setProductSearchTerm(""); }} className="p-2 hover:bg-primary/10 cursor-pointer">
                                 {p.nome}
                               </li>
                             ))
                           ) : (
                             <div className="p-2 text-center text-gray-500">
                               <p className="text-sm">Produto não encontrado.</p>
                               <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate("/products", { state: { from: "/feedbacks" } })}>
                                 Cadastrar Novo Produto
                               </Button>
                             </div>
                           )}
                       </ul>
                     )}
                </div>
              ) : (
                <div className="p-2 bg-muted rounded-md flex justify-between items-center">
                  <span className="font-medium">{selectedProduct.nome}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedProduct(null)}><X className="w-4 h-4" /></Button>
                </div>
              )}
            </div>
          </div>

          {selectedCustomer && selectedProduct && (
            <form onSubmit={handleAddFeedback} className="space-y-6 pt-6 border-t">
              {/* ... (código do formulário) ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium">Atendente</label>
                  <Input type="text" value={formState.employeeName} onChange={(e) => setFormState({ ...formState, employeeName: e.target.value })}/>
                </div>
                <div>
                  <label className="block text-sm font-medium">Tipo</label>
                  <Select value={formState.type} onValueChange={(v: DisplayFeedback["type"]) => setFormState({ ...formState, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Atendimento">Atendimento</SelectItem>
                      <SelectItem value="Produto">Produto</SelectItem>
                      <SelectItem value="Empresa">Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Avaliação</label>
                  <RatingStars rating={formState.rating} interactive onRate={(r) => setFormState({ ...formState, rating: r })} size="lg"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Comentário</label>
                  <Textarea rows={4} value={formState.comment} onChange={(e) => setFormState({ ...formState, comment: e.target.value })}/>
                </div>
              </div>
              <div className="text-right">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Feedback
                </Button>
              </div>
            </form>
          )}

          {/* Botão para Adição Manual */}
          <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground mb-2">Ou adicione um feedback a partir de um JSON para teste:</p>
              <Button variant="secondary" onClick={handleAddManualFeedback} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <FileJson className="mr-2 h-4 w-4" />
                  Adicionar Feedback Manual
              </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>Feedbacks Recebidos</CardTitle></CardHeader>
        <CardContent>
            {/* ... (código da listagem e filtros) ... */}
            <div className="space-y-4">
            {loading && !paginatedFeedbacks.length && (<div className="text-center py-8 flex items-center justify-center text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Carregando feedbacks...</div>)}
            {apiError && (<p className="text-center text-red-500 py-8">Erro ao carregar feedbacks: {apiError}</p>)}
            {!loading && !apiError && paginatedFeedbacks.map((fb) => (
                <div key={fb.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-bold text-lg">{fb.customerName}</span>
                        <RatingStars rating={fb.rating} size="sm" />
                      </div>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">"{fb.comment}"</p>
                      <div className="text-xs text-gray-500 mt-3 space-x-4">
                        <span><User className="inline w-3 h-3 mr-1" />Atendente: {fb.employeeName}</span>
                        <span><ShoppingBag className="inline w-3 h-3 mr-1" />Produto: {fb.productName}</span>
                        <span><Building className="inline w-3 h-3 mr-1" />Tipo: {fb.type}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm text-gray-500 whitespace-nowrap">{new Date(fb.date).toLocaleDateString()}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteFeedback(fb.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            {!loading && !apiError && filteredFeedbacks.length === 0 && (<p className="text-center text-gray-500 py-8">Nenhum feedback corresponde aos filtros selecionados.</p>)}
            </div>
        </CardContent>
      </Card>
    </div>
  );
};
