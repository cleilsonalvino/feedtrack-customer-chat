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
import { FolderKanban } from "lucide-react"; // Novo ícone para categorias

// Definindo a interface para os dados de feedback por categoria
interface CategoryFeedbackData {
  category: string; // Ex: "Atendimento", "Produto", "Entrega"
  positive: number;
  negative: number;
  neutral: number;
}

// Dados de exemplo tipados para feedback por categoria
const data: CategoryFeedbackData[] = [
  { category: "Atendimento", positive: 120, negative: 15, neutral: 5 },
  { category: "Produto", positive: 90, negative: 25, neutral: 10 },
  { category: "Entrega", positive: 70, negative: 10, neutral: 3 },
  { category: "Preço", positive: 40, negative: 30, neutral: 8 },
];

export const FeedbackByCategoryChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5" /> Feedback por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="blur">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="positive" stackId="a" fill="#00C49F" name="Positivo" />
            <Bar dataKey="negative" stackId="a" fill="#FF0000" name="Negativo" />
            <Bar dataKey="neutral" stackId="a" fill="#FFBB28" name="Neutro" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};