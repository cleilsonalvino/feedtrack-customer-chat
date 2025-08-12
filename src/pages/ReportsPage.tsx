import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, Download, Calendar as CalendarIcon, 
  TrendingUp, Star, MessageSquare,
  Users, Eye, Filter, Lock, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import api from "../lib/api"; // Ajuste o caminho para sua API
import { ReportsProvider, useReports } from "@/contexts/RepostsContext"; // Importe o Provider e o Hook

// Defina a interface aqui também para o estado inicial
interface Feedback {
  _id: string;
  _respostas: {
    perguntaId: string;
    tipo: 'nota';
    nota: number;
  };
  _dataCriacao: string;
  _clienteNome: string;
  _produtoNome: string;
  _funcionarioNome: string;
}

// Componente de conteúdo que usa o contexto
const ReportsContent = () => {
  const { toast } = useToast();
  // Use o hook para obter dados e funções do contexto
  const { 
    reportData, 
    topProducts,
    monthlyData,
    selectedPeriod, 
    setSelectedPeriod, 
    dateRange, 
    setDateRange 
  } = useReports();

  const handleExportReport = (format: string) => {
    toast({
      title: "Relatório exportado",
      description: `Relatório foi exportado em formato ${format.toUpperCase()}`
    });
    // Aqui você pode adicionar a lógica real de exportação usando os dados filtrados
  };

  return (
    <div className="space-y-6 mt-16 p-2">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Relatórios e Analytics</h1>
          <p className="text-muted-foreground">
            Análise detalhada do feedback dos clientes e métricas de performance
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportReport("pdf")}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => handleExportReport("excel")}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="last90days">Últimos 90 dias</SelectItem>
                  <SelectItem value="thisMonth">Este mês</SelectItem>
                  <SelectItem value="lastMonth">Mês passado</SelectItem>
                  <SelectItem value="custom">Período personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedPeriod === "custom" && (
              <div>
                <label className="text-sm font-medium mb-2 block">Data personalizada</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/y", { locale: ptBR })} -{" "}
                            {format(dateRange.to, "dd/MM/y", { locale: ptBR })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/y", { locale: ptBR })
                        )
                      ) : (
                        "Selecionar período"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Feedbacks</p>
                <p className="text-2xl font-bold">{reportData.totalFeedbacks.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nota Média</p>
                <p className="text-2xl font-bold">{reportData.averageRating}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sentimento Positivo</p>
                <p className="text-2xl font-bold">{reportData.sentiment.positive}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sentimento Negativo</p>
                <p className="text-2xl font-bold">{reportData.sentiment.negative}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Evolução dos Feedbacks</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.slice(-6).map((data) => (
                <div key={data.month} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 text-sm text-muted-foreground">{data.month}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{data.feedbacks}</div>
                        <div className="text-xs text-muted-foreground">feedbacks</div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(data.feedbacks / Math.max(1, ...monthlyData.map(d => d.feedbacks))) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Star className="w-4 h-4 text-warning fill-current" />
                    <span className="text-sm font-medium">{data.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Análise de Sentimento</CardTitle></CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Positivo</span>
                <span className="text-sm font-medium">{reportData.sentiment.positive}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 mt-1">
                <div className="bg-success h-3 rounded-full" style={{ width: `${reportData.sentiment.positive}%` }}/>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Neutro</span>
                <span className="text-sm font-medium">{reportData.sentiment.neutral}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 mt-1">
                <div className="bg-warning h-3 rounded-full" style={{ width: `${reportData.sentiment.neutral}%` }}/>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Negativo</span>
                <span className="text-sm font-medium">{reportData.sentiment.negative}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 mt-1">
                <div className="bg-destructive h-3 rounded-full" style={{ width: `${reportData.sentiment.negative}%` }}/>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Produtos */}
      <Card>
        <CardHeader><CardTitle>Produtos Mais Avaliados</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">{product.feedbacks} avaliações</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-warning fill-current" />
                  <span className="font-medium">{product.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente principal que gerencia o estado de carregamento e permissões
export const ReportsPage = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin && user?.role !== "master") {
      navigate("/");
    }

    const fetchFeedbacks = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/feedbacks');
        setAllFeedbacks(response.data);
      } catch (error) {
        console.error("Erro ao buscar feedbacks:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar os feedbacks. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin || user?.role === "master") {
        fetchFeedbacks();
    }
  }, [isAdmin, user, navigate, toast]);

  if (!isAdmin && user?.role !== "master") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Acesso Restrito</CardTitle>
            <p className="text-muted-foreground">Esta página é exclusiva para administradores.</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ReportsProvider allFeedbacks={allFeedbacks}>
      <ReportsContent />
    </ReportsProvider>
  );
};
