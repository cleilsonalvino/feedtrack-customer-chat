import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Feedback {
  _id: string;
  _produtoNome: string;
  _respostas: { tipo: "nota" | "texto"; nota?: number }[];
}

export const AverageRatingPerProductChart = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dadosEmpresa = localStorage.getItem("userEmpresa");
  const empresa = dadosEmpresa ? JSON.parse(dadosEmpresa) : null;
const isBasicPlan =
  empresa?.props?.plano === "BASIC" || empresa?.props?.plano === "FREE";


  useEffect(() => {
    if (!user?.empresaId) return;

    const fetchFeedbacks = async () => {
      try {
        const response = await api.get(`/feedbacks/empresa/${user.empresaId}`);
        const feedbacks: Feedback[] = response.data;

        const grouped: Record<string, { total: number; count: number }> =
          feedbacks.reduce((acc, feedback) => {
            const rating = feedback._respostas.find(
              (r) => r.tipo === "nota"
            )?.nota;
            if (rating) {
              if (!acc[feedback._produtoNome]) {
                acc[feedback._produtoNome] = { total: 0, count: 0 };
              }
              acc[feedback._produtoNome].total += rating;
              acc[feedback._produtoNome].count++;
            }
            return acc;
          }, {});

        const data = Object.entries(grouped).map(
          ([name, { total, count }]) => ({
            name,
            value: total / count,
          })
        );

        setChartData(data);
      } catch (err) {
        setError("Não foi possível carregar os dados do gráfico.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [user?.empresaId]);

  if (loading) return <div>Carregando gráfico...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nota média por produto</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div
          className={`rounded-2xl overflow-hidden transition-all duration-300 ${
            isBasicPlan ? "blur-sm" : ""
          }`}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#ffc658" name="Nota Média" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {isBasicPlan && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl pointer-events-none">
            <span className="text-white font-bold text-center px-4">
              Disponível apenas no plano PRO
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
