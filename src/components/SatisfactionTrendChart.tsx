import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  _id: string;
  _respostas: { tipo: "nota" | "texto"; nota?: number; resposta_texto?: string }[];
  _dataCriacao: string;
}

interface SatisfactionTrendData {
  name: string; // ex: "Jan/2025"
  satisfactionScore: number; // média de estrelas
}

export const SatisfactionTrendChart = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<SatisfactionTrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.empresaId) return;

    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const res = await api.get<Feedback[]>(`/feedbacks/empresa/${user.empresaId}`);
        const feedbacks = res.data;

        // Agrupar feedbacks por mês/ano
        const grouped: Record<string, number[]> = {};
        feedbacks.forEach(fb => {
          const date = new Date(fb._dataCriacao);
          const monthYear = `${date.toLocaleString("pt-BR", { month: "short" })}/${date.getFullYear()}`;
          const rating = fb._respostas.find(r => r.tipo === "nota")?.nota;
          if (rating) {
            if (!grouped[monthYear]) grouped[monthYear] = [];
            grouped[monthYear].push(rating);
          }
        });

        // Calcular média por mês
        const chartData: SatisfactionTrendData[] = Object.entries(grouped)
          .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
          .map(([month, ratings]) => ({
            name: month,
            satisfactionScore: ratings.reduce((acc, val) => acc + val, 0) / ratings.length,
          }));

        setData(chartData);
      } catch (err) {
        console.error(err);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar a tendência de satisfação.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [user?.empresaId, toast]);

  if (loading) return <div className="text-center p-4">Carregando tendência de satisfação...</div>;

  return (
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <TrendingUp className="w-5 h-5" /> Tendência de Satisfação
    </CardTitle>
  </CardHeader>
  <CardContent className="relative">
    {(() => {
      const empresa = JSON.parse(localStorage.getItem("userEmpresa") || "{}");
      const isBasicPlan = empresa?.props?.plano ===  "FREE";

      return (
        <>
          {/* Gráfico com blur se for plano BASIC */}
          <div className={`rounded-lg overflow-hidden transition-all duration-300 ${isBasicPlan ? "blur-sm" : ""}`}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="satisfactionScore"
                  stroke="#82ca9d"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Overlay informando acesso restrito para plano BASIC */}
          {isBasicPlan && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg pointer-events-none z-10 text-center px-4">
              <span className="text-white font-semibold">
                Gráfico Disponível a partir do plano BASIC
              </span>
            </div>
          )}
        </>
      );
    })()}
  </CardContent>
</Card>

  );
};
