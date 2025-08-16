// src/pages/CampaignsPage.tsx

import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api"; // Import the api instance
import {
  useCampaign,
  Campanha,
  NewCampaignData,
} from "../contexts/CampaignContext";
import { useAuth } from "../contexts/AuthContext"; // Import useAuth for consistency
import { useForm } from "../contexts/FormContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Calendar as CalendarIcon,
  Search,
  Loader2,
  Send,
} from "lucide-react";
import { Checkbox } from "../components/ui/checkbox";
import { useToast } from "../hooks/use-toast";
import { cn } from "../lib/utils";
import { format, isValid } from "date-fns"; // Import isValid
import { ptBR } from "date-fns/locale";

// --- NEW INTERFACE FOR SALE (VENDA) ---
interface Venda {
  id: string;
  dataVenda: string;
  clienteId: string; // Keep original IDs for mapping
  produtoId: string; // Keep original IDs for mapping
  cliente: {
    id: string;
    nome: string;
  };
  produto?: {
    id: string;
    nome: string;
  };
  empresaId: string;
}

// --- MANUAL SEND MODAL COMPONENT ---
// This component handles the manual sending of a campaign to selected sales.
const ManualSendModal = ({
  isOpen,
  onOpenChange,
  campaign,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campanha | null;
}) => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [selectedVendaIds, setSelectedVendaIds] = useState<string[]>([]);
  const [loadingVendas, setLoadingVendas] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth(); // Use the user from AuthContext for consistency

  // Fetches sales from the API when the modal is opened.
  useEffect(() => {
    if (isOpen && user?.empresaId) {
      const fetchVendas = async () => {
        setLoadingVendas(true);
        try {
          // Fetch all data in parallel
          const [vendasResponse, clientesResponse, produtosResponse] =
            await Promise.all([
              api.get(`/vendas?empresaId=${user.empresaId}`),
              api.get(`/clientes?empresaId=${user.empresaId}`),
              api.get(`/produtos?empresaId=${user.empresaId}`),
            ]);

          const vendasData: Venda[] = vendasResponse.data;
          console.log("[VENDAS CAMPANHA]", vendasData);
          const clientes = clientesResponse.data;
          console.log("[CLIENTES CAMPANHA]", clientes);
          const produtos = produtosResponse.data;

          // Create maps for quick lookups
          const clienteMap = new Map(clientes.map((c) => [c.id, c]));
          const produtoMap = new Map(produtos.map((p) => [p.id, p]));

          // Map sales with complete data
          const vendasCompletas: Venda[] = vendasData.map((venda) => ({
            ...venda,
            cliente: clienteMap.get(venda.clienteId) as Venda["cliente"], // << Type assertion
            produto: produtoMap.get(venda.produtoId) as
              | Venda["produto"]
              | undefined,
          }));

          setVendas(vendasCompletas);
        } catch (error) {
          console.error("Erro ao buscar dados:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar a lista de vendas.",
            variant: "destructive",
          });
        } finally {
          setLoadingVendas(false);
        }
      };

      fetchVendas();
    } else {
      // Clears state when the modal is closed.
      setSelectedVendaIds([]);
      setSearchTerm("");
    }
  }, [isOpen, user?.empresaId, toast]);

  // Filters sales based on the search term (client name).
  const filteredVendas = useMemo(() => {
    return vendas.filter((venda) =>
      (venda.cliente?.nome || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [vendas, searchTerm]);

  // Handles the "Select All" checkbox functionality.
  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedVendaIds(filteredVendas.map((v) => v.id));
    } else {
      setSelectedVendaIds([]);
    }
  };

  // Handles the manual campaign sending process.
  const handleManualSend = async () => {
    if (selectedVendaIds.length === 0) {
      toast({
        title: "Nenhuma venda selecionada",
        description: "Por favor, selecione ao menos uma venda para o envio.",
        variant: "destructive",
      });
      return;
    }

    if (!campaign || !user?.id || !user.empresaId) {
      toast({
        title: "Erro de Autenticação",
        description:
          "Dados da campanha ou do usuário não encontrados. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    const sendPromises = selectedVendaIds.map((vendaId) => {
      const venda = vendas.find((v) => v.id === vendaId);
      console.log("[VENDA ENVIADA]", venda.id);
      if (!venda) return Promise.resolve();

      const payload = {
        vendaId: venda.id, // ID da venda enviado no JSON
        empresaId: user.empresaId,
        campanhaId: campaign.id,
      };

      return api.post("/envio/individual", payload); // API espera o JSON, não URL
    });

    try {
      await Promise.all(sendPromises);
      toast({
        title: "Envio Concluído!",
        description: `Campanha "${campaign.titulo}" enviada para ${selectedVendaIds.length} venda(s).`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro no envio em massa:", error);
      toast({
        title: "Erro no Envio",
        description:
          "Ocorreu um erro ao enviar a campanha para uma ou mais vendas.",
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
          <DialogTitle>Envio Manual de Campanha</DialogTitle>
          <DialogDescription>
            Selecione as vendas para enviar a campanha{" "}
            <span className="font-semibold text-primary">
              "{campaign?.titulo}"
            </span>
            .
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
                <div className="flex items-center space-x-2 p-2">
                  <Checkbox
                    id="select-all-vendas"
                    onCheckedChange={handleSelectAll}
                    checked={
                      filteredVendas.length > 0 &&
                      selectedVendaIds.length === filteredVendas.length
                    }
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
                      checked={selectedVendaIds.includes(venda.id)}
                      onCheckedChange={(checked) => {
                        setSelectedVendaIds((prev) =>
                          checked
                            ? [...prev, venda.id]
                            : prev.filter((id) => id !== venda.id)
                        );
                      }}
                    />
                    <Label htmlFor={venda.id} className="w-full cursor-pointer">
                      {/* --- FIX: Use optional chaining for produto.nome --- */}
                      {venda.cliente?.nome || "Cliente desconhecido"} -{" "}
                      {venda.produto?.nome || "Produto desconhecido"}
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
          <Button onClick={handleManualSend} disabled={isSending}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar para ({selectedVendaIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- MAIN CAMPAIGNS PAGE COMPONENT ---
export const CampaignsPage = () => {
  const { campaigns, addCampaign, updateCampaign, deleteCampaign, loading } =
    useCampaign();
  const { formularios } = useForm();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State for UI elements and forms
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campanha | null>(null);
  const [manualSendState, setManualSendState] = useState<{
    isOpen: boolean;
    campaign: Campanha | null;
  }>({ isOpen: false, campaign: null });

  // State for the new campaign creation form
  const [newCampaign, setNewCampaign] = useState<
    Omit<NewCampaignData, "formularioId" | "empresaId">
  >({
    titulo: "",
    descricao: "",
    canalEnvio: "EMAIL",
    tipoCampanha: "POS_COMPRA",
    segmentoAlvo: "TODOS_CLIENTES",
    dataFim: new Date().toISOString(),
    templateMensagem:
      "Olá [Nome do Cliente],\n\nEsperamos que você esteja aproveitando o [Nome do Produto].\nGostaríamos de saber: o produto atendeu às suas expectativas?\nSua avaliação nos ajuda a melhorar e oferecer sempre o melhor para você.\nPor favor, deixe seu feedback no link abaixo:\n\nAgradecemos pela sua confiança!\n\nAtenciosamente, \n[Nome da Empresa]",
  });
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  // Memoized list of unique campaigns to prevent duplicates in the UI
  const uniqueCampaigns = useMemo(() => {
    if (!campaigns) return [];
    return Array.from(new Map(campaigns.map((c) => [c.id, c])).values());
  }, [campaigns]);

  // Filters campaigns based on the search term
  const filteredCampaigns = uniqueCampaigns.filter((c) =>
    (c.titulo || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Opens the create modal, checking if forms exist first
  const handleOpenCreateModal = () => {
    if (formularios.length === 0) {
      toast({
        title: "Nenhum formulário encontrado",
        description:
          "É necessário criar um formulário antes de criar uma campanha.",
        variant: "destructive",
      });
      navigate("/form-builder");
      return;
    }
    setIsCreateDialogOpen(true);
  };

  // Handles the creation of a new campaign
  const handleCreateCampaign = async () => {
    if (
      !newCampaign.titulo.trim() ||
      !newCampaign.templateMensagem.trim() ||
      !selectedFormId
    ) {
      toast({
        title: "Erro",
        description: "Título, template e um formulário são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // The context will add the 'empresaId' automatically
    const payload: Omit<NewCampaignData, "empresaId"> = {
      ...newCampaign,
      formularioId: selectedFormId,
    };

    const created = await addCampaign(payload as NewCampaignData);
    if (created) {
      setIsCreateDialogOpen(false);
      // Reset form state
      setNewCampaign({
        titulo: "",
        descricao: "",
        tipoCampanha: "POS_COMPRA",
        canalEnvio: "EMAIL",
        segmentoAlvo: "TODOS_CLIENTES",
        dataFim: new Date().toISOString(),
        templateMensagem: "",
      });
      setSelectedFormId(null);
    }
  };

  // Handles updating an existing campaign
  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;
    // The context expects the ID and a partial object of the data to update
    await updateCampaign(editingCampaign.id, editingCampaign);
    setEditingCampaign(null);
  };

  // Toggles the active status of a campaign
  const handleToggleCampaignStatus = async (campaign: Campanha) => {
    await updateCampaign(campaign.id, { ativo: !campaign.ativo });
  };

  // Deletes a campaign (soft delete as handled by the context)
  const handleDeleteCampaign = async (id: string) => {
    if (window.confirm("Tem certeza que deseja desativar esta campanha?")) {
      await deleteCampaign(id);
    }
  };

  // Helper to render the status badge
  const getStatusBadge = (ativo: boolean) => {
    return ativo ? (
      <Badge className="bg-green-500 text-white hover:bg-green-600">
        Ativa
      </Badge>
    ) : (
      <Badge variant="secondary">Inativa</Badge>
    );
  };

  // Helper to safely format dates
  const formatDateSafe = (
    date: string | Date | null | undefined,
    formatString: string
  ) => {
    if (!date) return "N/A";
    const dateObj = new Date(date);
    if (!isValid(dateObj)) return "Data Inválida";
    return format(dateObj, formatString);
  };

  return (
    <div className="space-y-6 p-4 md:p-8 mt-8">
      <div className="flex justify-between items-center flex-wrap">
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
                  className="border rounded-lg p-4 hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between flex-wrap">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {campaign.titulo}
                        </h3>
                        {getStatusBadge(campaign.ativo)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {campaign.descricao}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap mb-2">
                        <span>Tipo: {campaign.tipoCampanha}</span>
                        <span>Segmento: {campaign.segmentoAlvo}</span>
                        <span>
                          Período:{" "}
                          {formatDateSafe(campaign.dataFim, "dd/MM/yy")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        title="Envio Manual"
                        onClick={() =>
                          setManualSendState({
                            isOpen: true,
                            campaign: campaign,
                          })
                        }
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                      {campaign.ativo ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          title="Pausar Campanha"
                          onClick={() => handleToggleCampaignStatus(campaign)}
                        >
                          <Pause className="w-3 h-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          title="Iniciar Campanha"
                          onClick={() => handleToggleCampaignStatus(campaign)}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        title="Editar Campanha"
                        onClick={() => setEditingCampaign(campaign)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        title="Desativar Campanha"
                        onClick={() => handleDeleteCampaign(campaign.id)}
                      >
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
              <Input
                id="name"
                value={newCampaign.titulo}
                onChange={(e) =>
                  setNewCampaign({ ...newCampaign, titulo: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newCampaign.descricao}
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    descricao: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="form">Formulário *</Label>
              <Select
                onValueChange={setSelectedFormId}
                value={selectedFormId || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um formulário..." />
                </SelectTrigger>
                <SelectContent>
                  {formularios.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={newCampaign.tipoCampanha}
                  onValueChange={(v) =>
                    setNewCampaign({ ...newCampaign, tipoCampanha: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POS_COMPRA">Pós-Compra</SelectItem>
                    <SelectItem value="AUTOMATICO">Automático</SelectItem>
                    <SelectItem value="PROMOCIONAL">Promocional</SelectItem>
                    <SelectItem value="SATISFACAO">Satisfação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="segment">Segmento</Label>
                <Select
                  value={newCampaign.segmentoAlvo}
                  onValueChange={(v) =>
                    setNewCampaign({ ...newCampaign, segmentoAlvo: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS_CLIENTES">Todos</SelectItem>
                    <SelectItem value="CLIENTES_REGULARES">
                      Clientes Regulares
                    </SelectItem>
                    <SelectItem value="NOVOS_CLIENTES">
                      Novos Clientes
                    </SelectItem>
                    <SelectItem value="CLIENTES_PREMIUM">
                      Clientes Premium
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateSafe(newCampaign.dataFim, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(newCampaign.dataFim)}
                      onSelect={(date) =>
                        date &&
                        setNewCampaign({
                          ...newCampaign,
                          dataFim: date.toISOString(),
                        })
                      }
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="col-span-2">
              <Label htmlFor="channel">Canal de Envio</Label>
              <Select
                value={newCampaign.canalEnvio}
                onValueChange={(v) =>
                  setNewCampaign({
                    ...newCampaign,
                    canalEnvio: v as "EMAIL" | "WHATSAPP",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um canal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="template">Template da Mensagem *</Label>
              <Textarea
                id="template"
                value={newCampaign.templateMensagem}
                onChange={(e) =>
                  setNewCampaign({
                    ...newCampaign,
                    templateMensagem: e.target.value,
                  })
                }
              />
            </div>
            <p className="text-600 text-sm bg-slate-100">
              Crie sua mensagem usando os placeholders <span className="text-orange-600">[Nome do Cliente]</span>, <span className="text-orange-600">
                [Nome
                do Produto]
              </span> e <span className="text-orange-600">[Nome da Empresa]</span>; eles serão substituídos
              automaticamente pelos dados reais.
            </p>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateCampaign}>Criar Campanha</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <Dialog
          open={!!editingCampaign}
          onOpenChange={() => setEditingCampaign(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Campanha</DialogTitle>
              <DialogDescription>
                Altere os detalhes da campanha conforme necessário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              {/* Form fields are identical to create, but pre-filled with editingCampaign data */}
              {/* ... (rest of the edit form fields) ... */}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingCampaign(null)}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateCampaign}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Manual Send Modal */}
      <ManualSendModal
        isOpen={manualSendState.isOpen}
        onOpenChange={(open) =>
          setManualSendState({ isOpen: open, campaign: null })
        }
        campaign={manualSendState.campaign}
      />
    </div>
  );
};
