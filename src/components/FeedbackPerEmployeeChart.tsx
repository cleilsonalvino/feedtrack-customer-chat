import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Feedback {
  _id: string;
  _funcionarioNome: string;
}

export const FeedbackPerEmployeeChart = () => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.empresaId) return;

    const fetchFeedbacks = async () => {
      try {
        const response = await api.get(`/feedbacks/empresa/${user.empresaId}`);
        const feedbacks: Feedback[] = response.data;

        const grouped = feedbacks.reduce((acc: Record<string, number>, feedback) => {
          acc[feedback._funcionarioNome] = (acc[feedback._funcionarioNome] || 0) + 1;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedbacks por Funcionário</CardTitle>
      </CardHeader>
      
      <CardContent className='blur'>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#82ca9d" name="Feedbacks" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
