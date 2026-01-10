import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export const CampaignResponseChart = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<
    { titulo: string; taxaResposta: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.empresaId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [enviosRes, feedbacksRes] = await Promise.all([
          api.get(`/envios/${user.empresaId}`),
          api.get(`/feedbacks/empresa/${user.empresaId}`),
        ]);

        const envios = enviosRes.data;
        const feedbacks = feedbacksRes.data;

        // Agrupa envios por campanha
        const campanhasMap: Record<
          string,
          { totalEnvios: number; respostasRecebidas: number }
        > = {};
        envios.forEach((envio: any) => {
          if (!campanhasMap[envio._campanhaId]) {
            campanhasMap[envio._campanhaId] = {
              totalEnvios: 0,
              respostasRecebidas: 0,
            };
          }
          campanhasMap[envio._campanhaId].totalEnvios += 1;

          // Verifica se este envio tem feedback
          const hasFeedback = feedbacks.some(
            (fb: any) => fb._vendaId === envio._vendaId
          );
          if (hasFeedback)
            campanhasMap[envio._campanhaId].respostasRecebidas += 1;
        });

        // Busca os nomes das campanhas em paralelo
        const campaignIds = Object.keys(campanhasMap);
        const campaignNames = await Promise.all(
          campaignIds.map(async (id) => {
            try {
              const res = await api.get(
                `/campanha/${id}/empresa/${user.empresaId}`
              );
              return res.data.titulo;
            } catch {
              return `Campanha ${id}`; // fallback
            }
          })
        );

        // Monta os dados finais do gráfico
        const data = campaignIds.map((id, index) => ({
          titulo: campaignNames[index],
          taxaResposta:
            campanhasMap[id].totalEnvios > 0
              ? (campanhasMap[id].respostasRecebidas /
                  campanhasMap[id].totalEnvios) *
                100
              : 0,
        }));

        setChartData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.empresaId]);

  if (loading) return <div>Carregando gráfico...</div>;

  return (
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <BarChart3 className="w-5 h-5" /> Taxa de Resposta por Campanha
    </CardTitle>
  </CardHeader>
  <CardContent className="relative">
    {(() => {
      const empresa = JSON.parse(localStorage.getItem("userEmpresa") || "{}");
      const isBasicPlan = empresa?.props?.plano === "FREE";
      return (
        <>
          <div className={`rounded-lg overflow-hidden transition-all duration-300 ${isBasicPlan ? "blur-sm" : ""}`}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="titulo" />
                <YAxis unit="%" />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="taxaResposta" fill="#8884d8" name="Taxa de Resposta (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

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
