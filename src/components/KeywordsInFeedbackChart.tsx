import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Feedback {
  _id: string;
  _respostas: { tipo: "nota" | "texto"; resposta_texto?: string }[];
}

export const KeywordsInFeedbackChart = () => {
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

        const allWords = feedbacks
          .flatMap(fb => fb._respostas.filter(r => r.tipo === 'texto').map(r => r.resposta_texto || ''))
          .join(' ')
          .toLowerCase()
          .split(/\s+/);

        const wordCounts = allWords.reduce((acc, word) => {
          if (word.length > 3) { // Simple filter for short words
            acc[word] = (acc[word] || 0) + 1;
          }
          return acc;
        }, {});

        const sortedWords = Object.entries(wordCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10); // Top 10 words

        const data = sortedWords.map(([name, value]) => ({ name, value }));
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
        <CardTitle>Palavras-chave nos Feedbacks</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#ff8042" name="Ocorrências" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
