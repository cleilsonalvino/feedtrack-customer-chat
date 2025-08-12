import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { DateRange } from "react-day-picker";
import {
  parseISO,
  isAfter,
  subDays,
  startOfMonth,
  endOfMonth,
  getMonth,
  getYear,
} from "date-fns";

// 1. INTERFACES: Definem a estrutura dos seus dados
interface Feedback {
  _id: string;
  _respostas: {
    perguntaId: string;
    tipo: "nota";
    nota: number;
  };
  _dataCriacao: string;
  _clienteNome: string;
  _produtoNome: string;
  _funcionarioNome: string;
}

interface ReportData {
  totalFeedbacks: number;
  averageRating: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface TopProduct {
  name: string;
  rating: number;
  feedbacks: number;
}

interface MonthlyData {
  month: string;
  feedbacks: number;
  rating: number;
}

interface ReportsContextType {
  // Estados e Setters dos Filtros
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  dateRange: DateRange | undefined;
  setDateRange: (dateRange: DateRange | undefined) => void;

  // Dados Processados
  reportData: ReportData;
  topProducts: TopProduct[];
  monthlyData: MonthlyData[];
  filteredFeedbacks: Feedback[];
}

// 2. CRIAÇÃO DO CONTEXTO
const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

// 3. PROVIDER: O componente que vai abraçar sua página
interface ReportsProviderProps {
  children: ReactNode;
  allFeedbacks: Feedback[]; // Recebe todos os feedbacks como propriedade
}

const monthNames = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const ReportsProvider = ({
  children,
  allFeedbacks,
}: ReportsProviderProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("last30days");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // useMemo para processar os dados apenas quando os filtros ou os dados brutos mudarem
  const processedData = useMemo(() => {
    const now = new Date();

    // Filtra os feedbacks com base no período selecionado
    const filteredFeedbacks = allFeedbacks.filter((fb) => {
      const feedbackDate = parseISO(fb._dataCriacao);
      if (selectedPeriod === "custom" && dateRange?.from) {
        const toDate = dateRange.to || dateRange.from;
        return (
          feedbackDate >= dateRange.from && feedbackDate <= endOfMonth(toDate)
        );
      }
      switch (selectedPeriod) {
        case "last7days":
          return isAfter(feedbackDate, subDays(now, 7));
        case "last30days":
          return isAfter(feedbackDate, subDays(now, 30));
        case "last90days":
          return isAfter(feedbackDate, subDays(now, 90));
        case "thisMonth":
          return (
            feedbackDate >= startOfMonth(now) && feedbackDate <= endOfMonth(now)
          );
        case "lastMonth":
          const lastMonthStart = startOfMonth(subDays(now, 30));
          const lastMonthEnd = endOfMonth(subDays(now, 30));
          return feedbackDate >= lastMonthStart && feedbackDate <= lastMonthEnd;
        default:
          return true;
      }
    });

    // Calcula as métricas principais
    const totalFeedbacks = filteredFeedbacks.length;
    const sumOfRatings = filteredFeedbacks.reduce(
      (sum, fb) => sum + fb._respostas.nota,
      0
    );
    const averageRating =
      totalFeedbacks > 0
        ? parseFloat((sumOfRatings / totalFeedbacks).toFixed(1))
        : 0;

    // Calcula a análise de sentimento
    const positiveCount = filteredFeedbacks.filter(
      (fb) => fb._respostas.nota >= 4
    ).length;
    const neutralCount = filteredFeedbacks.filter(
      (fb) => fb._respostas.nota === 3
    ).length;
    const negativeCount = filteredFeedbacks.filter(
      (fb) => fb._respostas.nota < 3
    ).length;
    const sentiment = {
      positive:
        totalFeedbacks > 0
          ? Math.round((positiveCount / totalFeedbacks) * 100)
          : 0,
      neutral:
        totalFeedbacks > 0
          ? Math.round((neutralCount / totalFeedbacks) * 100)
          : 0,
      negative:
        totalFeedbacks > 0
          ? Math.round((negativeCount / totalFeedbacks) * 100)
          : 0,
    };

    // Calcula os produtos mais avaliados
    const productGroups = filteredFeedbacks.reduce((acc, fb) => {
      acc[fb._produtoNome] = acc[fb._produtoNome] || {
        name: fb._produtoNome,
        feedbacks: 0,
        totalRating: 0,
      };
      acc[fb._produtoNome].feedbacks++;
      acc[fb._produtoNome].totalRating += fb._respostas.nota;
      return acc;
    }, {} as Record<string, { name: string; feedbacks: number; totalRating: number }>);

    const topProducts = Object.values(productGroups)
      .map((p) => ({
        ...p,
        rating: parseFloat((p.totalRating / p.feedbacks).toFixed(1)),
      }))
      .sort((a, b) => b.feedbacks - a.feedbacks)
      .slice(0, 5);

    // Calcula dados mensais (para o gráfico de evolução)
    const monthlyGroups = filteredFeedbacks.reduce((acc, fb) => {
      const date = parseISO(fb._dataCriacao);
      const year = getYear(date);
      const month = getMonth(date);
      const key = `${year}-${month}`;

      acc[key] = acc[key] || {
        month: monthNames[month],
        feedbacks: 0,
        totalRating: 0,
        year,
        monthIndex: month,
      };
      acc[key].feedbacks++;
      acc[key].totalRating += fb._respostas.nota;
      return acc;
    }, {} as Record<string, { month: string; feedbacks: number; totalRating: number; year: number; monthIndex: number }>);

    const monthlyData = Object.values(monthlyGroups)
      .map((m) => ({
        ...m,
        rating: parseFloat((m.totalRating / m.feedbacks).toFixed(1)),
      }))
      .sort(
        (a, b) => a.year * 100 + a.monthIndex - (b.year * 100 + b.monthIndex)
      );

    return {
      filteredFeedbacks,
      reportData: { totalFeedbacks, averageRating, sentiment },
      topProducts,
      monthlyData,
    };
  }, [allFeedbacks, selectedPeriod, dateRange]);

  return (
    <ReportsContext.Provider
      value={{
        selectedPeriod,
        setSelectedPeriod,
        dateRange,
        setDateRange,
        ...processedData,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
};

// 4. HOOK CUSTOMIZADO: Facilita o uso do contexto em outros componentes
export const useReports = () => {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error("useReports must be used within a ReportsProvider");
  }
  return context;
};
