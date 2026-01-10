// src/pages/Index.tsx

import { DashboardStats } from "@/components/DashboardStats";
import { RecentFeedback } from "@/components/RecentFeedback";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, BarChart3, PieChart, LineChart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Importe seus componentes de gráfico
import { CampaignResponseChart } from "@/components/CampaignResponseChart";
import { FeedbackDistributionChart } from "@/components/FeedbackDistributionChart";
import { SatisfactionTrendChart } from "@/components/SatisfactionTrendChart";
import { FeedbackPerProductChart } from "@/components/FeedbackPerProductChart";
import { AverageRatingPerProductChart } from "@/components/AverageRatingPerProductChart";
import { KeywordsInFeedbackChart } from "@/components/KeywordsInFeedbackChart";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const {toast} = useToast()
  const [nomeEmpresa, setNomeEmpresa] = useState<string>()

  useEffect(()=>{
        const userData = localStorage.getItem("user");
    const nomeEmpresa = userData ? JSON.parse(userData).nomeEmpresa: null;
    setNomeEmpresa(nomeEmpresa)

  }, [])



  // Dashboard limpo para Administradores
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mt-16">Dashboard {nomeEmpresa}</h1>
        <p className="text-muted-foreground">
          Acompanhe as métricas de satisfação dos seus clientes em tempo real.
        </p>
      </div>


      <Tabs defaultValue="dashboard" className="space-y-6">
        {/* A lista de abas agora tem apenas 2 itens, focados em visualização */}
        <TabsList className="flex flex-wrap gap-2 mb-20">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Últimas Avaliações
          </TabsTrigger>
          <TabsTrigger value="more-charts" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Mais Gráficos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="">
          <DashboardStats />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CampaignResponseChart />
            <FeedbackDistributionChart />
          </div>
          <div className="">
            <SatisfactionTrendChart />
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <RecentFeedback />
        </TabsContent>

        <TabsContent value="more-charts" className="space-y-6">
          <div className="gap-6">
            <FeedbackPerProductChart />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AverageRatingPerProductChart />
            <KeywordsInFeedbackChart />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;