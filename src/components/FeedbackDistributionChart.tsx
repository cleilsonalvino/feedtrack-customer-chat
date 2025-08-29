import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  _id: string;
  _respostas: { tipo: "nota" | "texto"; nota?: number; resposta_texto?: string }[];
  _dataCriacao: string;
}

interface FeedbackData {
  name: string;
  value: number;
}

const COLORS: string[] = ["#AD343E", "#FF8552", "#FFBF69", "#9EE493", "#2081C3"];

export const FeedbackDistributionChart = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<FeedbackData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.empresaId) return;

    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const res = await api.get<Feedback[]>(`/feedbacks/empresa/${user.empresaId}`);
        const feedbacks = res.data;

        // Contar quantidade de cada nota
        const counts = [0, 0, 0, 0, 0]; // índices 0=>1 estrela, 4=>5 estrelas
        feedbacks.forEach(fb => {
          const rating = fb._respostas.find(r => r.tipo === "nota")?.nota;
          if (rating) counts[rating - 1] += 1;
        });

        const chartData: FeedbackData[] = counts.map((value, i) => ({
          name: `${i + 1} Estrela${i === 0 ? "" : "s"}`,
          value,
        }));

        setData(chartData);
      } catch (err) {
        console.error(err);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar a distribuição de feedbacks.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [user?.empresaId, toast]);

  if (loading) return <div className="text-center p-4">Carregando distribuição de avaliações...</div>;

  return (
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Star className="w-5 h-5" /> Distribuição de Avaliações
    </CardTitle>
  </CardHeader>
  <CardContent className="relative">
    {(() => {
      const empresa = JSON.parse(localStorage.getItem("userEmpresa") || "{}");
      const isBasicPlan = empresa?.props?.plano === "FREE";


      return (
        <>
          {/* Gráfico com blur se for plano BASIC */}
          <div className={`rounded-lg overflow-hidden transition-all duration-300 ${isBasicPlan ? "blur-sm" : ""}`}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
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
