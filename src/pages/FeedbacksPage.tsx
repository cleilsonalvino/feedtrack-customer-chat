import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomer, Customer } from "../contexts/CustomerContext";
import { useProduct, Product } from "../contexts/ProductContext";
import {
  useFeedBack,
  IFormulario,
  DynamicFeedbackPayload,
  FuncionarioComNome,
} from "@/contexts/FeedBackContext";

import { Star, Search, X, Loader2 } from "lucide-react";
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

type Alerta = { tipo: "success" | "danger"; mensagem: string };

// Componente para renderizar estrelas de avaliação
const RatingStars = ({
  rating,
  onRate,
  size = "lg",
}: {
  rating: number;
  onRate: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}) => {
  const starSize =
    size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-8 h-8";
  return (
    <div className="flex space-x-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          } cursor-pointer transition-transform hover:scale-110`}
          onClick={() => onRate(i + 1)}
        />
      ))}
    </div>
  );
};

const QuestionRenderer = ({
  pergunta,
  answers,
  handleAnswerChange,
}: {
  pergunta: IFormulario["perguntas"][0];
  answers: Record<string, any>;
  handleAnswerChange: (perguntaId: string, value: any) => void;
}) => {
  const { _id, _texto, _tipo, _opcoes, obrigatoria } = pergunta;
  const label = `${_texto}${obrigatoria ? " *" : ""}`;

  switch (_tipo) {
    case "nota":
      return (
        <div>
          <label className="block text-sm font-medium mb-2">{label}</label>
          <RatingStars
            rating={answers[_id] || 0}
            onRate={(value) => handleAnswerChange(_id, value)}
          />
        </div>
      );
    case "texto":
      return (
        <div>
          <label className="block text-sm font-medium mb-1">{label}</label>
          <Textarea
            value={answers[_id] || ""}
            onChange={(e) => handleAnswerChange(_id, e.target.value)}
            placeholder="Digite sua resposta..."
          />
        </div>
      );
    case "multipla_escolha":
      return (
        <div>
          <label className="block text-sm font-medium mb-1">{label}</label>
          <Select
            onValueChange={(value) => handleAnswerChange(_id, value)}
            value={answers[_id] || ""}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção..." />
            </SelectTrigger>
            <SelectContent>
              {_opcoes?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    default:
      return null;
  }
};

export const FeedbacksPage = () => {
  const navigate = useNavigate();
  const { customers } = useCustomer();
  const { products } = useProduct();
  const {
    fetchFeedbacks,
    formularios,
    fetchFormularios,
    submitDynamicFeedback,
    loading,
    error: apiError,
    fetchFuncionariosComNome,
    funcionarios, 
    
  } = useFeedBack();
  const [alerta, setAlerta] = useState<Alerta | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedForm, setSelectedForm] = useState<IFormulario | null>(null);
  const [employeeName, setEmployeeName] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<string>("");




  useEffect(() => {
    fetchFeedbacks();
    fetchFormularios();
  }, [fetchFeedbacks, fetchFormularios]);

useEffect(() => {
  fetchFuncionariosComNome();
}, [fetchFuncionariosComNome]);




  // Lógica de busca de clientes
  const filteredCustomers = useMemo(() => {
    if (!customerSearchTerm) return [];
    return customers.filter((c) =>
      c.pessoa.nome.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  }, [customerSearchTerm, customers]);

  // Lógica de busca de produtos
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm) return [];
    return products.filter((p) =>
      p.nome.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [productSearchTerm, products]);

  const handleSelectForm = (formId: string) => {
    const form = formularios.find((f) => f.id === formId);
    setSelectedForm(form || null);
    setAnswers({}); // Limpa as respostas ao trocar de formulário
  };

  const handleAnswerChange = (perguntaId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [perguntaId]: value }));
  };

  const clearAll = () => {
    setSelectedCustomer(null);
    setCustomerSearchTerm("");
    setSelectedProduct(null);
    setProductSearchTerm("");
    setSelectedForm(null);
    setAnswers({});
    setEmployeeName("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !selectedCustomer ||
      !selectedProduct ||
      !selectedForm ||
      !employeeName.trim()
    ) {
      setAlerta({
        tipo: "danger",
        mensagem:
          "Preencha todos os campos: cliente, produto, atendente e formulário.",
      });
      return;
    }

    // Validação de perguntas obrigatórias
    for (const pergunta of selectedForm.perguntas) {
      if (
        pergunta.obrigatoria &&
        (answers[pergunta._id] === undefined || answers[pergunta._id] === "")
      ) {
        setAlerta({
          tipo: "danger",
          mensagem: `A pergunta "${pergunta._texto}" é obrigatória.`,
        });
        return;
      }
    }

    const payload: DynamicFeedbackPayload = {
      clienteNome: selectedCustomer.pessoa.nome,
      produtoNome: selectedProduct.nome,
      funcionarioNome: employeeName,
      respostas: selectedForm.perguntas
        .map((p) => {
          const resposta: any = {
            perguntaId: p._id,
            tipo: p._tipo,
          };
          if (p._tipo === "nota") {
            resposta.nota = answers[p._id];
          } else {
            resposta.resposta_texto = answers[p._id];
          }
          return resposta;
        })
        .filter((r) => r.nota !== undefined || r.resposta_texto !== undefined),
    };

    const result = await submitDynamicFeedback(payload);

    if (result) {
      setAlerta({ tipo: "success", mensagem: "Feedback enviado com sucesso!" });
      clearAll();
    } else {
      setAlerta({
        tipo: "danger",
        mensagem: apiError || "Ocorreu um erro ao enviar o feedback.",
      });
    }
    setTimeout(() => setAlerta(null), 4000);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 mt-10">
      <h1 className="text-3xl font-bold">Gestão de Feedbacks</h1>
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {alerta && (
            <div
              className={`p-3 rounded-md mb-4 text-sm ${
                alerta.tipo === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {alerta.mensagem}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                {!selectedCustomer ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={customerSearchTerm}
                      onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      placeholder="Busque o cliente..."
                      className="pl-9"
                    />
                    {customerSearchTerm && (
                      <ul className="border rounded-md max-h-40 overflow-y-auto bg-white z-20 absolute w-full shadow-lg mt-1">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((c) => (
                            <li
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomer(c);
                                setCustomerSearchTerm("");
                              }}
                              className="p-2 hover:bg-primary/10 cursor-pointer text-sm"
                            >
                              {c.pessoa.nome}
                            </li>
                          ))
                        ) : (
                          <div className="p-2 text-center text-gray-500 text-sm">
                            Cliente não encontrado.
                          </div>
                        )}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="p-2 bg-muted rounded-md flex justify-between items-center h-10">
                    <span className="font-medium text-sm">
                      {selectedCustomer.pessoa.nome}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto
                </label>
                {!selectedProduct ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      placeholder="Busque o produto..."
                      className="pl-9"
                    />
                    {productSearchTerm && (
                      <ul className="border rounded-md max-h-40 overflow-y-auto bg-white z-20 absolute w-full shadow-lg mt-1">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((p) => (
                            <li
                              key={p.id}
                              onClick={() => {
                                setSelectedProduct(p);
                                setProductSearchTerm("");
                              }}
                              className="p-2 hover:bg-primary/10 cursor-pointer text-sm"
                            >
                              {p.nome}
                            </li>
                          ))
                        ) : (
                          <div className="p-2 text-center text-gray-500 text-sm">
                            Produto não encontrado.
                          </div>
                        )}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="p-2 bg-muted rounded-md flex justify-between items-center h-10">
                    <span className="font-medium text-sm">{selectedProduct.nome}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedProduct(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Atendente
  </label>
<Select
  onValueChange={(id) => {
    setSelectedFuncionarioId(id);
    const func = funcionarios.find(f => f.id === id);
    setEmployeeName(func?.nomeUsuario || "");
  }}
  value={selectedFuncionarioId}
  disabled={funcionarios.length === 0}
>
  <SelectTrigger>
    <SelectValue placeholder="Selecione um atendente..."/>
  </SelectTrigger>
  <SelectContent>
    {funcionarios.length === 0 ? (
      <SelectItem value="loading" disabled>Carregando...</SelectItem>

    ) : (
      funcionarios.map((func) => (
        <SelectItem key={func.id} value={func.id}>
          {func.nomeUsuario || "Nome não encontrado"}
        </SelectItem>
      ))
    )}
  </SelectContent>
</Select>

</div>

            </div>

            <div className="pt-6 border-t">
              <label className="block text-sm font-medium mb-1">
                Tipo de Feedback
              </label>
              <Select
                onValueChange={handleSelectForm}
                value={selectedForm?.id || ""}
                disabled={
                  !selectedCustomer || !selectedProduct || !employeeName
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um formulário para começar..." />
                </SelectTrigger>
                <SelectContent>
                  {formularios.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedForm && (
              <div className="space-y-6 pt-6 border-t">
                <h3 className="text-lg font-semibold">{selectedForm.titulo}</h3>
                {selectedForm.descricao && (
                  <p className="text-sm text-muted-foreground">
                    {selectedForm.descricao}
                  </p>
                )}
                {selectedForm.perguntas.map((pergunta) => (
                  <QuestionRenderer
                    key={pergunta._id}
                    pergunta={pergunta}
                    answers={answers}
                    handleAnswerChange={handleAnswerChange}
                  />
                ))}
                <div className="text-right">
                  <Button type="submit" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Enviar Feedback
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
