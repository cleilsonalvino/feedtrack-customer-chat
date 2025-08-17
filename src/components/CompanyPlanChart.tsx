import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

interface Company {
  id: string;
  plano: string;
}

export const CompanyPlanChart = () => {
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get('/empresas');
        const companies: Company[] = response.data;

        // Agrupa por plano
        const grouped = companies.reduce((acc: Record<string, number>, company) => {
          acc[company.plano] = (acc[company.plano] || 0) + 1;
          return acc;
        }, {});

        // Transforma em array para o gráfico
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
        <CardTitle>Empresas por Plano</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
