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

interface DashboardData {
  totalFeedbacks: number;
  averageRating: number | string;
  clientesAtivos: number;
  taxaResposta: string;
}

export const DashboardStats = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalFeedbacks: 0,
    averageRating: 0,
    clientesAtivos: 0,
    taxaResposta: "0%",
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user.empresaId) throw new Error("Empresa não encontrada");

        // Buscar todos os envios e feedbacks
        const [enviosRes, feedbacksRes] = await Promise.all([
          api.get(`/envios/${user.empresaId}`),
          api.get(`/feedbacks/empresa/${user.empresaId}`)
        ]);

        const envios = enviosRes.data;
        const feedbacks = feedbacksRes.data;

        const totalEnvios = envios.length;
        const respostasRecebidas = feedbacks.length;

        const totalFeedbacks = feedbacks.length;
        const averageRating = totalFeedbacks > 0
          ? (feedbacks.reduce((sum: number, fb: Feedback) => {
              const nota = fb._respostas.find(r => r.tipo === "nota")?.nota ?? 0;
              return sum + nota;
            }, 0) / totalFeedbacks).toFixed(1)
          : 0;

        const clientesAtivos = new Set(feedbacks.map(fb => fb._clienteNome)).size;

        const taxaResposta = totalEnvios > 0
          ? `${Math.round((respostasRecebidas / totalEnvios) * 100)}%`
          : "0%";

        setDashboardData({ totalFeedbacks, averageRating, clientesAtivos, taxaResposta });

      } catch (err) {
        console.error(err);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar os dados do dashboard",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const stats = [
    { title: "Total de Avaliações", value: dashboardData.totalFeedbacks, icon: MessageSquare, color: "text-primary" },
    { title: "Nota Média", value: dashboardData.averageRating, icon: Star, color: "text-warning" },
    { title: "Clientes Ativos", value: dashboardData.clientesAtivos, icon: Users, color: "text-success" },
    { title: "Taxa de Resposta", value: dashboardData.taxaResposta, icon: TrendingUp, color: "text-primary" },
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
