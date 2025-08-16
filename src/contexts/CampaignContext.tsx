// src/contexts/CampaignContext.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import api from '../lib/api';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext"; // para pegar o usuário logado

// --- INTERFACES ---
export interface Campanha {
  id: string;
  titulo: string;
  descricao: string;
  tipoCampanha: string;
  segmentoAlvo: string;
  canalEnvio: string;
  dataFim: string;
  templateMensagem: string;
  formularioId: string;
  ativo: boolean;
  empresaId: string; // agora obrigatório
}

export type NewCampaignData = Omit<Campanha, 'id' | 'ativo' | 'dataInicio'>;

interface CampaignContextType {
  campaigns: Campanha[];
  loading: boolean;
  addCampaign: (campaignData: NewCampaignData) => Promise<Campanha | void>;
  updateCampaign: (campaignId: string, campaignData: Partial<NewCampaignData & { ativo: boolean }>) => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;
  fetchCampaigns: () => Promise<void>;
}

// --- CONTEXT ---
const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

// --- PROVIDER ---
export const CampaignProvider = ({ children }: { children: ReactNode }) => {
  const [campaigns, setCampaigns] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth(); // usuário logado

  const fetchCampaigns = async () => {
    console.log('CampaignContext: fetchCampaigns called');
    console.log('CampaignContext: user in fetchCampaigns', user);
    if (!user?.empresaId) {
      console.log('CampaignContext: empresaId is missing, not fetching campaigns.');
      setLoading(false); // Ensure loading is set to false if not fetching
      return;
    }
    try {
      setLoading(true);
      console.log(`CampaignContext: Fetching campaigns for empresaId: ${user.empresaId}`);
      const response = await api.get(`/campanhas?empresaId=${user.empresaId}`);
      setCampaigns(response.data);
      console.log('CampaignContext: Campaigns fetched successfully', response.data);
    } catch (error) {
      console.error("CampaignContext: Erro ao buscar campanhas:", error);
      toast({
        title: "Erro de Rede",
        description: "Não foi possível carregar as campanhas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('CampaignContext: useEffect triggered');
    fetchCampaigns();
  }, [user?.empresaId]);

  const addCampaign = async (campaignData: NewCampaignData) => {
    if (!user?.empresaId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const dataFim = new Date(campaignData.dataFim);

    if (dataFim < today) {
      toast({
        title: "Erro",
        description: "A Data Fim da campanha não pode ser anterior à data atual.",
        variant: "destructive",
      });
      return;
    }

    try {
      const empresaId = user?.empresaId || localStorage.getItem("user");
      console.log("EmpresaId", empresaId)
if (!empresaId) {
  toast({
    title: "Erro",
    description: "Empresa não encontrada.",
    variant: "destructive",
  });
  return;
}

const payload = { ...campaignData, empresaId };


      const response = await api.post('/campanha', payload);
      const newCampaign = response.data;
      await fetchCampaigns();
      toast({ title: "Sucesso", description: "Campanha criada com sucesso!" });
      return newCampaign;
    } catch (error) {
      console.error("Erro ao criar campanha:", error);
      toast({ title: "Erro", description: "Não foi possível criar a campanha.", variant: "destructive" });
    }
  };

  const updateCampaign = async (campaignId: string, campaignData: Partial<NewCampaignData & { ativo: boolean }>) => {
    if (!user?.empresaId) return;
    const campaignToUpdate = campaigns.find(c => c.id === campaignId);
    if (!campaignToUpdate) {
      toast({ title: "Erro", description: "Campanha não encontrada para atualizar.", variant: "destructive" });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const dataFim = new Date(campaignData.dataFim || campaignToUpdate.dataFim);

    if (dataFim < today) {
      toast({
        title: "Erro",
        description: "A Data Fim da campanha não pode ser anterior à data atual.",
        variant: "destructive",
      });
      return;
    }

    const updatedLocalCampaign = { ...campaignToUpdate, ...campaignData, empresaId: user.empresaId };

    try {
      await api.put(`/atualizar-campanha/${campaignId}`, updatedLocalCampaign);
      setCampaigns(current => current.map(c => c.id === campaignId ? updatedLocalCampaign : c));
      toast({ title: "Sucesso", description: "Campanha atualizada." });
    } catch (error) {
      console.error("Erro ao atualizar campanha:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar a campanha.", variant: "destructive" });
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      await api.delete(`/deletar-campanha/${campaignId}`);
      setCampaigns(current => current.map(c => c.id === campaignId ? { ...c, ativo: false } : c));
      toast({ title: "Sucesso", description: "Campanha desativada." });
    } catch (error) {
      console.error("Erro ao desativar campanha:", error);
      toast({ title: "Erro", description: "Não foi possível desativar a campanha.", variant: "destructive" });
    }
  };

  return (
    <CampaignContext.Provider value={{ campaigns, loading, addCampaign, updateCampaign, deleteCampaign, fetchCampaigns }}>
      {children}
    </CampaignContext.Provider>
  );
};

// --- HOOK ---
export const useCampaign = (): CampaignContextType => {
  const context = useContext(CampaignContext);
  if (!context) throw new Error("useCampaign must be used within a CampaignProvider");
  return context;
};