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
  Users, Filter, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import api from "../lib/api";
import { ReportsProvider, useReports } from "../contexts/RepostsContext";

interface Resposta {
  tipo: "nota" | "texto";
  perguntaId: string;
  nota?: number;
  resposta_texto?: string;
}

interface Feedback {
  _id: string;
  _respostas: Resposta[];
  _dataCriacao: string;
  _clienteNome: string;
  _produtoNome: string;
  _funcionarioNome: string;
}

// Componente para restringir conteúdo a planos PRO
const RestrictedCard: React.FC<{ children: React.ReactNode; isRestricted: boolean }> = ({ children, isRestricted }) => {
  if (!isRestricted) return <>{children}</>;

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg pointer-events-none z-10 text-center px-4">
        <span className="text-white font-semibold">Disponível aapenas no plano PRO</span>
      </div>
    </div>
  );
};

const ReportsContent = ({ isBasicPlan }: { isBasicPlan: boolean }) => {
  const { toast } = useToast();
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
      title: "Funcionalidade não implementada",
      description: `em breve`
    });
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
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" onClick={() => handleExportReport("excel")}>
            <Download className="w-4 h-4 mr-2" /> Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />Filtros do Relatório
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
                      {dateRange?.from
                        ? dateRange.to
                          ? <>
                              {format(dateRange.from, "dd/MM/y", { locale: ptBR })} -{" "}
                              {format(dateRange.to, "dd/MM/y", { locale: ptBR })}
                            </>
                          : format(dateRange.from, "dd/MM/y", { locale: ptBR })
                        : "Selecionar período"}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Feedbacks</p>
              <p className="text-2xl font-bold">{reportData.totalFeedbacks.toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>

        <RestrictedCard isRestricted={isBasicPlan}>
          <Card>
            <CardContent className="p-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nota Média</p>
                <p className="text-2xl font-bold">{reportData.averageRating}</p>
              </div>
            </CardContent>
          </Card>
        </RestrictedCard>

        <RestrictedCard isRestricted={isBasicPlan}>
          <Card>
            <CardContent className="p-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sentimento Positivo</p>
                <p className="text-2xl font-bold">{reportData.sentiment.positive}%</p>
              </div>
            </CardContent>
          </Card>
        </RestrictedCard>

        <RestrictedCard isRestricted={isBasicPlan}>
          <Card>
            <CardContent className="p-6 flex items-center gap-3">
              <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sentimento Negativo</p>
                <p className="text-2xl font-bold">{reportData.sentiment.negative}%</p>
              </div>
            </CardContent>
          </Card>
        </RestrictedCard>
      </div>

      <RestrictedCard isRestricted={isBasicPlan}>
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
      </RestrictedCard>

      <RestrictedCard isRestricted={isBasicPlan}>
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
      </RestrictedCard>

      <RestrictedCard isRestricted={isBasicPlan}>
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
      </RestrictedCard>
    </div>
  );
};

export const ReportsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const empresa = JSON.parse(localStorage.getItem("userEmpresa") || "{}");
  const isBasicPlan = empresa?.props?.plano === "FREE" || empresa?.props?.plano === "BASIC";

  useEffect(() => {
    let empresaId = user?.empresaId;
    if (!empresaId) {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          empresaId = JSON.parse(stored).empresaId;
        } catch {
          empresaId = null;
        }
      }
    }
    if (!empresaId) return;

    const fetchFeedbacks = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/feedbacks/empresa/${empresaId}`);
        setAllFeedbacks(response.data);
      } catch (error) {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar os feedbacks. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbacks();
  }, [user?.empresaId, toast]);

  if (isLoading || !user?.empresaId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ReportsProvider allFeedbacks={allFeedbacks}>
      <ReportsContent isBasicPlan={isBasicPlan} />
    </ReportsProvider>
  );
};
