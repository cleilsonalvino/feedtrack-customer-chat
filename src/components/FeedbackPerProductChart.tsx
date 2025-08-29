import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Feedback {
  _id: string;
  _produtoNome: string;
}

export const FeedbackPerProductChart = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dadosEmpresa = localStorage.getItem("userEmpresa");
  const empresa = dadosEmpresa ? JSON.parse(dadosEmpresa) : null;

  useEffect(() => {
    if (!user?.empresaId) return;

    const fetchFeedbacks = async () => {
      try {
        const response = await api.get(`/feedbacks/empresa/${user.empresaId}`);
        const feedbacks: Feedback[] = response.data;
        
        const grouped = feedbacks.reduce((acc: Record<string, number>, feedback) => {
          acc[feedback._produtoNome] = (acc[feedback._produtoNome] || 0) + 1;
          return acc;
        }, {});

        const data = Object.entries(grouped).map(([name, value]) => ({ name, value }));
        setChartData(data);
      } catch (err) {
        setError('Não foi possível carregar os dados do gráfico.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [user?.empresaId]);

  if (loading) return <div>Carregando gráfico...</div>;
  if (error) return <div>{error}</div>;

const isBasicPlan = empresa?.props?.plano === "BASIC" || empresa?.props?.plano === "FREE";

  return (
  <Card>
    <CardHeader>
      <CardTitle>Feedbacks por Produto</CardTitle>
    </CardHeader>
    <CardContent className="relative">
      {/* Gráfico com blur apenas para FREE/BASIC */}
      <div className={`${isBasicPlan ? "blur-sm" : ""}`}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Feedbacks" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Overlay apenas para FREE/BASIC */}
      {isBasicPlan && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl pointer-events-none">
          <span className="text-white font-semibold text-center px-4">
            Disponível apenas no plano PRO
          </span>
        </div>
      )}
    </CardContent>
  </Card>


  );
};
