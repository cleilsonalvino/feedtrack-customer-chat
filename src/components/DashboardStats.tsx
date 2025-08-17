import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, MessageSquare, Star, Users } from "lucide-react";
import api from "../lib/api";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  _id: string;
  _respostas: { tipo: "nota" | "texto"; nota?: number; resposta_texto?: string }[];
  _dataCriacao: string;
  _clienteNome: string;
  _produtoNome: string;
  _funcionarioNome: string;
}

export const DashboardStats = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setIsLoading(true);

        // Pegar empresa do localStorage
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user.empresaId) throw new Error("Empresa não encontrada");

        const response = await api.get(`/feedbacks/empresa/${user.empresaId}`);
        setFeedbacks(response.data);
      } catch (err) {
        console.error(err);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar os feedbacks",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbacks();
  }, [toast]);

  // Cálculos simples
  const totalFeedbacks = feedbacks.length;
  const averageRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, fb) => {
          const nota = fb._respostas.find(r => r.tipo === "nota")?.nota ?? 0;
          return sum + nota;
        }, 0) / feedbacks.length).toFixed(1)
      : 0;

  const clientesAtivos = new Set(feedbacks.map(fb => fb._clienteNome)).size;
  const taxaResposta = totalFeedbacks > 0 ? `${Math.round((totalFeedbacks / clientesAtivos) * 100)}%` : "0%";

  const stats = [
    { title: "Total de Avaliações", value: totalFeedbacks, icon: MessageSquare, color: "text-primary" },
    { title: "Nota Média", value: averageRating, icon: Star, color: "text-warning" },
    { title: "Clientes Ativos", value: clientesAtivos, icon: Users, color: "text-success" },
    { title: "Taxa de Resposta", value: taxaResposta, icon: TrendingUp, color: "text-primary" },
  ];

  if (isLoading) return <div className="min-h-[200px] flex justify-center items-center">Carregando...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:scale-105 transition-transform duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
