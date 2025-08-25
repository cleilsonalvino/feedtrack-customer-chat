import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

interface Company {
  id: string;
  dataCriacao: string;
}

export const RecentSignupsChart = () => {
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get('/empresas');
        const companies: Company[] = response.data;

        const grouped = companies.reduce((acc: Record<string, number>, company) => {
          const date = new Date(company.dataCriacao);
          const monthYear = `${date.toLocaleString('default', { month: 'short' })}/${date.getFullYear()}`;
          acc[monthYear] = (acc[monthYear] || 0) + 1;
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

    fetchCompanies();
  }, []);

  if (loading) return <div>Carregando gráfico...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novas Empresas Cadastradas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#8884d8" name="Novas Empresas" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
