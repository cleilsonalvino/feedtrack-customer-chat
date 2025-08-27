// src/pages/CampaignsPage.tsx

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api"; // Importa a instância da api
import {
  useCampaign,
  Campanha,
  NewCampaignData,
} from "../contexts/CampaignContext";
import { useAuth } from "../contexts/AuthContext"; // Importa useAuth para consistência
import { useForm } from "../contexts/FormContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Plus, Edit, Trash2, Search, Loader2, Send, Mail } from "lucide-react";
import { Checkbox } from "../components/ui/checkbox";
import { useToast } from "../hooks/use-toast";

// --- INTERFACES ---
interface Produto {
    id: string;
    nome: string;
}

// Interface para Venda, atualizada para suportar múltiplos produtos.
interface Venda {
  id: string;
  dataVenda: string;
  clienteId: string;
  produtoIds: string[]; // Alterado para suportar múltiplos IDs de produto
  cliente: {
    id: string;
    nome: string;
  };
  produto?: Produto[]; // Alterado para uma lista de produtos
  empresaId: string;
}


// --- HOOKS CUSTOMIZADOS PARA DATA FETCHING ---

/**
 * Hook customizado para buscar vendas e dados relacionados.
 * Abstrai a lógica de fetching, loading e erro do componente.
 */
const useVendas = (isOpen: boolean) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user?.empresaId) {
      setVendas([]);
      return;
    }

    const fetchVendas = async () => {
      setLoading(true);
      try {
        const [vendasRes, clientesRes, produtosRes] = await Promise.all([
          api.get(`/vendas?empresaId=${user.empresaId}`),
          api.get(`/clientes?empresaId=${user.empresaId}`),
          api.get(`/produtos?empresaId=${user.empresaId}`),
        ]);

        console.log(vendasRes.data);


        const clienteMap = new Map(clientesRes.data.map((c: any) => [c.id, c]));
        const produtoMap = new Map(produtosRes.data.map((p: any) => [p.id, p]));

        const vendasCompletas = vendasRes.data.map((venda: any) => ({
          ...venda,
          cliente: clienteMap.get(venda.clienteId) || { id: venda.clienteId, nome: "Cliente não encontrado" },
          produtos: (venda.produtoIds || [])
            .map((id: string) => produtoMap.get(id))
            .filter(Boolean), // remove undefined
        }));

        setVendas(vendasCompletas);
      } catch (error) {
        console.error("Erro ao buscar dados para envio manual:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar a lista de vendas.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVendas();
  }, [isOpen, user?.empresaId, toast]);

  return { vendas, loading };
};


/**
 * Hook customizado para buscar produtos.
 */
const useProdutos = (isOpen: boolean) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !user?.empresaId) {
            setProdutos([]);
            return;
        }

        const fetchProdutos = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/produtos?empresaId=${user.empresaId}`);
                setProdutos(response.data);
            } catch (error) {
                console.error("Erro ao buscar produtos:", error);
                toast({
                    title: "Erro ao carregar produtos",
                    description: "Não foi possível carregar a lista de produtos.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProdutos();
    }, [isOpen, user?.empresaId, toast]);

    return { produtos, loading };
}


// --- COMPONENTES DE MODAL ---

// Componente para o modal de Envio Manual
const ManualSendModal = ({
  isOpen,
  onOpenChange,
  campaign,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campanha | null;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { vendas, loading: loadingVendas } = useVendas(isOpen);

  const [selectedVendaIds, setSelectedVendaIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Limpa o estado quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      setSelectedVendaIds(new Set());
      setSearchTerm("");
    }
  }, [isOpen]);

  const filteredVendas = useMemo(() =>
    vendas.filter((venda) =>
      venda.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
    ), [vendas, searchTerm]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVendaIds(new Set(filteredVendas.map((v) => v.id)));
    } else {
      setSelectedVendaIds(new Set());
    }
  };

  const handleSelectVenda = (vendaId: string, checked: boolean) => {
    setSelectedVendaIds(prev => {
        const newSet = new Set(prev);
        if(checked) {
            newSet.add(vendaId);
        } else {
            newSet.delete(vendaId);
        }
        return newSet;
    });
  };

  const handleManualSend = async () => {
    if (selectedVendaIds.size === 0) {
      toast({
        title: "Nenhuma venda selecionada",
        description: "Por favor, selecione ao menos uma venda para o envio.",
        variant: "destructive",
      });
      return;
    }

    if (!campaign || !user?.empresaId) {
      toast({
        title: "Erro de Autenticação",
        description: "Dados da campanha ou do usuário não encontrados.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    const vendaId = Array.from(selectedVendaIds)[0];

    const payload = {
        vendaId,
        empresaId: user.empresaId,
        campanhaId: campaign.id,
    };

    try {
        // Idealmente, a API deveria aceitar um array de IDs para processamento em lote
        await api.post("/envio/individual", payload);
        toast({
            title: "Envio Concluído!",
            description: `Campanha "${campaign.titulo}" enviada para ${selectedVendaIds.size} venda(s).`,
        });
        onOpenChange(false);
    } catch (error) {
        console.error("Erro no envio em massa:", error);
        toast({
            title: "Erro no Envio",
            description: "Ocorreu um erro ao enviar a campanha. Tente novamente.",
            variant: "destructive",
        });
    } finally {
        setIsSending(false);
    }
  };

  const allSelected = selectedVendaIds.size > 0 && selectedVendaIds.size === filteredVendas.length;
  const someSelected = selectedVendaIds.size > 0 && !allSelected;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Envio Manual de Campanha</DialogTitle>
          <DialogDescription>
            Selecione as vendas para enviar a campanha{" "}
            <span className="font-semibold text-primary">
              "{campaign?.titulo}"
            </span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Input
            placeholder="Buscar venda por nome do cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
            {loadingVendas ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2 p-2 sticky top-0 bg-background">
                  <Checkbox
                    id="select-all-vendas"
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    aria-label="Selecionar todas as vendas"
                  />
                  <Label htmlFor="select-all-vendas" className="font-semibold">
                    Selecionar Todas
                  </Label>
                </div>
                {filteredVendas.map((venda) => (
                  
                  <div
                    key={venda.id}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50"
                  >
                    <Checkbox
                      id={venda.id}
                      checked={selectedVendaIds.has(venda.id)}
                      onCheckedChange={(checked) => handleSelectVenda(venda.id, checked as boolean)}
                    />
                  <Label htmlFor={venda.id} className="w-full cursor-pointer">
                    {venda.cliente?.nome || "Cliente desconhecido"} -{" "}
                    {venda.produto?.map(p => p.nome).join(", ") || "Produto não especificado"}
                  </Label>

                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleManualSend} disabled={isSending || selectedVendaIds.size === 0}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar para ({selectedVendaIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Componente para o modal de Envio em Massa
const BulkSendModal = ({
  isOpen,
  onOpenChange,
  campaign,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campanha | null;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { produtos, loading: loadingProdutos } = useProdutos(isOpen);
  const [selectedProdutoId, setSelectedProdutoId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedProdutoId(null);
    }
  }, [isOpen]);

  const handleBulkSend = async () => {
    if (!selectedProdutoId) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Por favor, selecione um produto para o envio em massa.",
        variant: "destructive",
      });
      return;
    }

    if (!campaign || !user?.empresaId) {
      toast({
        title: "Erro de Autenticação",
        description: "Dados da campanha ou do usuário não encontrados.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const payload = {
        produtoId: selectedProdutoId,
        empresaId: user.empresaId,
        campanhaId: campaign.id,
      };
      console.log("Payload para envio em massa:", payload);
      await api.post("/envio/massa", payload);
      toast({
        title: "Envio em Massa Iniciado!",
        description: `A campanha "${campaign.titulo}" está sendo enviada para todos os clientes do produto selecionado.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro no envio em massa:", error);
      toast({
        title: "Erro no Envio",
        description: "Ocorreu um erro ao iniciar o envio em massa.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Envio em Massa por Produto</DialogTitle>
          <DialogDescription>
            Selecione um produto para enviar a campanha{" "}
            <span className="font-semibold text-primary">
              "{campaign?.titulo}"
            </span>{" "}
            para todos os clientes que o compraram.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {loadingProdutos ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <Select
              onValueChange={setSelectedProdutoId}
              value={selectedProdutoId || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto..." />
              </SelectTrigger>
              <SelectContent>
                {produtos.map((produto) => (
                  <SelectItem key={produto.id} value={produto.id}>
                    {produto.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleBulkSend}
            disabled={isSending || loadingProdutos || !selectedProdutoId}
          >
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar em Massa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


// --- COMPONENTE PRINCIPAL DA PÁGINA ---

const INITIAL_CAMPAIGN_STATE: Omit<NewCampaignData, "formularioId" | "empresaId"> = {
    titulo: "Minha Primeira Campanha",
    descricao: "Minha primeira campanha de feedback.",
    canalEnvio: "EMAIL",
    templateMensagem:
      "Olá [Nome do Cliente],\n\nEsperamos que você esteja aproveitando o [Nome do Produto].\nGostaríamos de saber: o produto atendeu às suas expectativas?\nSua avaliação nos ajuda a melhorar e oferecer sempre o melhor para você.\nPor favor, deixe seu feedback no link abaixo:\n\nAgradecemos pela sua confiança!\n\nAtenciosamente, \n[Nome da Empresa]",
};

export const CampaignsPage = () => {
  const { campaigns, addCampaign, updateCampaign, deleteCampaign, loading } = useCampaign();
  const { formularios } = useForm();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campanha | null>(null);
  const [manualSendState, setManualSendState] = useState<{isOpen: boolean, campaign: Campanha | null}>({
    isOpen: false,
    campaign: null,
  });
  const [bulkSendState, setBulkSendState] = useState<{isOpen: boolean, campaign: Campanha | null}>({
    isOpen: false,
    campaign: null,
  });

  const [newCampaign, setNewCampaign] = useState(INITIAL_CAMPAIGN_STATE);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  const uniqueCampaigns = useMemo(() => {
    if (!campaigns) return [];
    return Array.from(new Map(campaigns.map((c) => [c.id, c])).values());
  }, [campaigns]);

  const filteredCampaigns = uniqueCampaigns.filter((c) =>
    (c.titulo || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreateModal = () => {
    if (formularios.length === 0) {
      toast({
        title: "Nenhum formulário encontrado",
        description: "É necessário criar um formulário antes de criar uma campanha.",
        variant: "destructive",
      });
      navigate("/form-builder");
      return;
    }
    setIsCreateDialogOpen(true);
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.titulo.trim() || !newCampaign.templateMensagem.trim() || !selectedFormId) {
      toast({
        title: "Erro de Validação",
        description: "Título, template da mensagem e um formulário são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const payload = { ...newCampaign, formularioId: selectedFormId };
    const success = await addCampaign(payload as NewCampaignData);

    if (success) {
      setIsCreateDialogOpen(false);
      setNewCampaign(INITIAL_CAMPAIGN_STATE);
      setSelectedFormId(null);
    }
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;
    await updateCampaign(editingCampaign.id, editingCampaign);
    setEditingCampaign(null);
  };

  const handleDeleteCampaign = async (id: string) => {
    // Substituindo window.confirm por um modal de confirmação customizado (se disponível)
    // ou mantendo-o como um placeholder.
    if (window.confirm("Tem certeza que deseja desativar esta campanha?")) {
      await deleteCampaign(id);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8 mt-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Campanhas</h1>
          <p className="text-muted-foreground">
            Crie e gerencie suas campanhas de feedback.
          </p>
        </div>
        <Button onClick={handleOpenCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar campanha por nome..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Campanhas ({filteredCampaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border rounded-xl p-4 hover:shadow-lg transition-shadow duration-200 bg-white"
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {campaign.titulo}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {campaign.descricao}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-500">Formulário:</span>
                        <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
                          {formularios.find(f => f.id === campaign.formularioId)?.titulo || "Não definido"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-500">Canal de Envio:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${campaign.canalEnvio === 'EMAIL' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {campaign.canalEnvio}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" title="Envio Manual" onClick={() => setManualSendState({ isOpen: true, campaign })}>
                        <Send className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" title="Envio em Massa" onClick={() => setBulkSendState({ isOpen: true, campaign })}>
                        <Mail className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" title="Editar Campanha" onClick={() => setEditingCampaign(campaign)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="destructive" title="Desativar Campanha" onClick={() => handleDeleteCampaign(campaign.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Campanha</DialogTitle>
            <DialogDescription>
              Preencha os detalhes e selecione um formulário para associar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nome da Campanha *</Label>
              <Input id="name" value={newCampaign.titulo} onChange={(e) => setNewCampaign({ ...newCampaign, titulo: e.target.value })}/>
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={newCampaign.descricao} onChange={(e) => setNewCampaign({ ...newCampaign, descricao: e.target.value })}/>
            </div>
            <div>
              <Label htmlFor="form">Formulário *</Label>
              <Select onValueChange={setSelectedFormId} value={selectedFormId || ""}>
                <SelectTrigger><SelectValue placeholder="Selecione um formulário..." /></SelectTrigger>
                <SelectContent>
                  {formularios.map((form) => (<SelectItem key={form.id} value={form.id}>{form.titulo}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="channel">Canal de Envio</Label>
              <Select value={newCampaign.canalEnvio} onValueChange={(v) => setNewCampaign({ ...newCampaign, canalEnvio: v as "EMAIL" | "WHATSAPP" })}>
                <SelectTrigger><SelectValue placeholder="Selecione um canal..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="template">Template da Mensagem *</Label>
              <Textarea id="template" value={newCampaign.templateMensagem} onChange={(e) => setNewCampaign({ ...newCampaign, templateMensagem: e.target.value })} rows={8}/>
            </div>
            <p className="text-sm text-muted-foreground p-2 bg-slate-50 rounded-md">
              Use os placeholders <code className="text-orange-600">[Nome do Cliente]</code>, <code className="text-orange-600">[Nome do Produto]</code>, e <code className="text-orange-600">[Nome da Empresa]</code>.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateCampaign}>Criar Campanha</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <Dialog open={!!editingCampaign} onOpenChange={() => setEditingCampaign(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Campanha</DialogTitle>
              <DialogDescription>
                Altere os detalhes da campanha conforme necessário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <div>
                <Label htmlFor="edit-name">Nome da Campanha *</Label>
                <Input id="edit-name" value={editingCampaign.titulo} onChange={(e) => setEditingCampaign({ ...editingCampaign, titulo: e.target.value })}/>
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea id="edit-description" value={editingCampaign.descricao} onChange={(e) => setEditingCampaign({ ...editingCampaign, descricao: e.target.value })}/>
              </div>
              <div>
                <Label htmlFor="edit-form">Formulário *</Label>
                <Select onValueChange={(value) => setEditingCampaign({ ...editingCampaign, formularioId: value })} value={editingCampaign.formularioId || ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione um formulário..." /></SelectTrigger>
                  <SelectContent>
                    {formularios.map((form) => (<SelectItem key={form.id} value={form.id}>{form.titulo}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-channel">Canal de Envio</Label>
                <Select value={editingCampaign.canalEnvio} onValueChange={(v) => setEditingCampaign({ ...editingCampaign, canalEnvio: v as "EMAIL" | "WHATSAPP" })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um canal..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-template">Template da Mensagem *</Label>
                <Textarea id="edit-template" value={editingCampaign.templateMensagem} onChange={(e) => setEditingCampaign({ ...editingCampaign, templateMensagem: e.target.value })} rows={8}/>
              </div>
              
            </div>
             <p className="text-sm text-muted-foreground p-2 bg-slate-50 rounded-md">
              Use os placeholders <code className="text-orange-600">[Nome do Cliente]</code>, <code className="text-orange-600">[Nome do Produto]</code>, e <code className="text-orange-600">[Nome da Empresa]</code>.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCampaign(null)}>Cancelar</Button>
              <Button onClick={handleUpdateCampaign}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ManualSendModal isOpen={manualSendState.isOpen} onOpenChange={(open) => setManualSendState({ isOpen: open, campaign: open ? manualSendState.campaign : null })} campaign={manualSendState.campaign}/>
      <BulkSendModal isOpen={bulkSendState.isOpen} onOpenChange={(open) => setBulkSendState({ isOpen: open, campaign: open ? bulkSendState.campaign : null })} campaign={bulkSendState.campaign}/>
    </div>
  );
};
