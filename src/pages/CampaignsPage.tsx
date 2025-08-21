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
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Send,
  Mail,
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

      console.log("[PAYLOAD]", payload);


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

// --- BULK SEND MODAL COMPONENT ---
const BulkSendModal = ({
  isOpen,
  onOpenChange,
  campaign,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campanha | null;
}) => {
  const [produtos, setProdutos] = useState<{ id: string; nome: string }[]>([]);
  const [selectedProdutoId, setSelectedProdutoId] = useState<string | null>(null);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user?.empresaId) {
      const fetchProdutos = async () => {
        setLoadingProdutos(true);
        try {
          const response = await api.get(`/produtos?empresaId=${user.empresaId}`);
          setProdutos(response.data);
        } catch (error) {
          console.error("Erro ao buscar produtos:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar a lista de produtos.",
            variant: "destructive",
          });
        } finally {
          setLoadingProdutos(false);
        }
      };
      fetchProdutos();
    } else {
      setSelectedProdutoId(null);
    }
  }, [isOpen, user?.empresaId, toast]);

  const handleBulkSend = async () => {
    if (!selectedProdutoId) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Por favor, selecione um produto para o envio em massa.",
        variant: "destructive",
      });
      return;
    }

    if (!campaign || !user?.id || !user.empresaId) {
      toast({
        title: "Erro de Autenticação",
        description: "Dados da campanha ou do usuário não encontrados. Faça login novamente.",
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
            </span>
            {" "}para todos os clientes que o compraram.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {loadingProdutos ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <Select onValueChange={setSelectedProdutoId} value={selectedProdutoId || ""}>
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
          <Button onClick={handleBulkSend} disabled={isSending || loadingProdutos}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar em Massa
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
  const [manualSendState, setManualSendState] = useState({
    isOpen: false,
    campaign: null,
  });
  const [bulkSendState, setBulkSendState] = useState({
    isOpen: false,
    campaign: null,
  });

  // State for the new campaign creation form
  const [newCampaign, setNewCampaign] = useState<
    Omit<NewCampaignData, "formularioId" | "empresaId">
  >({
    titulo: "",
    descricao: "",
    canalEnvio: "EMAIL",
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
        canalEnvio: "EMAIL",
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

  // Deletes a campaign (soft delete as handled by the context)
  const handleDeleteCampaign = async (id: string) => {
    if (window.confirm("Tem certeza que deseja desativar esta campanha?")) {
      await deleteCampaign(id);
    }
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
  className="border rounded-xl p-4 hover:shadow-lg transition-shadow duration-200 bg-white"
>
  <div className="flex justify-between items-start flex-wrap gap-2">
    <div className="flex flex-col gap-2">
      {/* Título da campanha */}
      <h3 className="text-lg font-semibold text-gray-900">{campaign.titulo}</h3>
      
      {/* Descrição */}
      <p className="text-sm text-gray-600">{campaign.descricao}</p>
      
      {/* Formulário associado */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500">Formulário:</span>
        <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
          {campaign.formularioId || "Não definido"}
        </span>
      </div>
      
      {/* Canal de envio */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500">Canal de Envio:</span>
        {campaign.canalEnvio === "EMAIL" ? (
          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
            Email
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
            WhatsApp
          </span>
        )}
      </div>
    </div>

    {/* Ações */}
    <div className="flex gap-2 flex-wrap">
      <Button
        size="sm"
        variant="outline"
        title="Envio Manual"
        onClick={() =>
          setManualSendState({ isOpen: true, campaign: campaign })
        }
      >
        <Send className="w-3 h-3" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        title="Envio em Massa"
        onClick={() =>
          setBulkSendState({ isOpen: true, campaign: campaign })
        }
      >
        <Mail className="w-3 h-3" />
      </Button>
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
              Crie sua mensagem usando os placeholders{" "}
              <span className="text-orange-600">[Nome do Cliente]</span>,{" "}
              <span className="text-orange-600">[Nome do Produto]</span> e{" "}
              <span className="text-orange-600">[Nome da Empresa]</span>; eles
              serão substituídos automaticamente pelos dados reais.
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
              <div>
                <Label htmlFor="name">Nome da Campanha *</Label>
                <Input
                  id="name"
                  value={editingCampaign.titulo}
                  onChange={(e) =>
                    setEditingCampaign({
                      ...editingCampaign,
                      titulo: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={editingCampaign.descricao}
                  onChange={(e) =>
                    setEditingCampaign({
                      ...editingCampaign,
                      descricao: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="form">Formulário *</Label>
                <Select
                  onValueChange={(value) =>
                    setEditingCampaign({
                      ...editingCampaign,
                      formularioId: value,
                    })
                  }
                  value={editingCampaign.formularioId || ""}
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
              <div className="col-span-2">
                <Label htmlFor="channel">Canal de Envio</Label>
                <Select
                  value={editingCampaign.canalEnvio}
                  onValueChange={(v) =>
                    setEditingCampaign({
                      ...editingCampaign,
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
                  value={editingCampaign.templateMensagem}
                  onChange={(e) =>
                    setEditingCampaign({
                      ...editingCampaign,
                      templateMensagem: e.target.value,
                    })
                  }
                />
              </div>
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

      {/* Bulk Send Modal */}
      <BulkSendModal
        isOpen={bulkSendState.isOpen}
        onOpenChange={(open) =>
          setBulkSendState({ isOpen: open, campaign: null })
        }
        campaign={bulkSendState.campaign}
      />
    </div>
  );
};