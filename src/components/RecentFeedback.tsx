import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, MessageSquare } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Feedback {
  _id: string;
  _clienteNome: string;
  _produtoNome: string;
  _respostas: { tipo: "nota" | "texto"; nota?: number; resposta_texto?: string }[];
  _dataCriacao: string;
}

const getRatingColor = (rating: number) => {
  if (rating >= 4) return "text-success";
  if (rating >= 3) return "text-warning";
  return "text-destructive";
};

export const RecentFeedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  // Verifica plano do usuário
  const dadosEmpresa = localStorage.getItem("userEmpresa");
  const empresa = dadosEmpresa ? JSON.parse(dadosEmpresa) : null;
const isBasicPlan =
  empresa?.props?.plano === "BASIC" || empresa?.props?.plano === "FREE";


  useEffect(() => {
    if (!user?.empresaId) return;

    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/feedbacks/empresa/${user.empresaId}`);
        setFeedbacks(res.data);
      } catch (err) {
        console.error(err);
        toast({
          title: "Erro ao carregar feedbacks",
          description: "Não foi possível buscar as avaliações recentes.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [user?.empresaId, toast]);

  if (loading) return <div className="text-center p-4">Carregando feedbacks...</div>;

  // Ordena os feedbacks da mais recente para a mais antiga
  const sortedFeedbacks = [...feedbacks].sort(
    (a, b) => new Date(b._dataCriacao).getTime() - new Date(a._dataCriacao).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Avaliações Recentes
        </CardTitle>
      </CardHeader>

      <div className="relative">
        {/* CardContent com blur se for plano BASIC */}
        <CardContent className={isBasicPlan ? "blur-sm pointer-events-none select-none" : ""}>
          <div className="space-y-4">
            {sortedFeedbacks.slice(0, 5).map(fb => {
              const rating = fb._respostas.find(r => r.tipo === "nota")?.nota ?? 0;
              const textAnswer = fb._respostas.find(r => r.tipo === "texto")?.resposta_texto;

              return (
                <div
                  key={fb._id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{fb._clienteNome}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{fb._produtoNome}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rating ? `fill-current ${getRatingColor(rating)}` : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {textAnswer && (
                    <p className="text-sm mb-2 italic text-muted-foreground">{textAnswer}</p>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(fb._dataCriacao).toLocaleString("pt-BR")}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>

        {/* Sobreposição com aviso para usuários BASIC */}
        {isBasicPlan && (
          <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-muted-foreground bg-white/50">
            Visualização limitada para o plano FREE
            <br />
            Assine o plano BASIC para ver mais avaliações.
          </div>
        )}
      </div>
    </Card>
  );
};
