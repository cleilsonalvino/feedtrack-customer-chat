import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

interface Company {
  id: string;
  nome: string;
  qtdFeedbacks: number;
  qtdClientes: number;
  qtdProdutos: number;
}

export const AverageMetricsChart = () => {
  const [chartData, setChartData] = useState<{ name: string; feedbacks: number; customers: number; products: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get('/empresas');
        const companies: Company[] = response.data;

        const data = companies.map(company => ({
          name: company.nome,
          feedbacks: company.qtdFeedbacks,
          customers: company.qtdClientes,
          products: company.qtdProdutos
        }));

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
        <CardTitle>Métricas Médias por Empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="feedbacks" fill="#8884d8" name="Feedbacks" />
            <Bar dataKey="customers" fill="#82ca9d" name="Clientes" />
            <Bar dataKey="products" fill="#ffc658" name="Produtos" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
