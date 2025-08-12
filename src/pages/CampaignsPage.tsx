import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api"; // Import the api instance
import {
  useCampaign,
  Campanha,
  NewCampaignData,
} from "@/contexts/CampaignContext";
import { useForm } from "@/contexts/FormContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- INTERFACE PARA CLIENTE ---
interface Cliente {
  id: string;
  nome: string;
  // Adicione outros campos se necessário, ex: email
}

// --- COMPONENTE ATUALIZADO: MODAL DE ENVIO MANUAL ---
const ManualSendModal = ({
  isOpen,
  onOpenChange,
  campaign,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campanha | null;
}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Busca clientes da API quando o modal abre
  useEffect(() => {
    if (isOpen) {
      const fetchClients = async () => {
        setLoadingClients(true);
        try {
          const response = await api.get("/clientes"); // Assumindo que esta é a rota
          setClientes(response.data);
          console.log("Clientes carregados:", response.data);
        } catch (error) {
          console.error("Erro ao buscar clientes:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar a lista de clientes.",
            variant: "destructive",
          });
        } finally {
          setLoadingClients(false);
        }
      };
      fetchClients();
    } else {
      // Limpa o estado quando o modal fecha
      setSelectedClientIds([]);
      setSearchTerm("");
    }
  }, [isOpen, toast]);

  // <<< CORRIGIDO: Adicionada verificação para client.nome para evitar erros.
  const filteredClients = useMemo(() => {
    return clientes.filter((client) =>
      (client.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clientes, searchTerm]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClientIds(filteredClients.map((c) => c.id));
    } else {
      setSelectedClientIds([]);
    }
  };

  const handleManualSend = async () => {
    if (selectedClientIds.length === 0) {
      toast({
        title: "Nenhum cliente selecionado",
        description: "Por favor, selecione ao menos um cliente para o envio.",
        variant: "destructive",
      });
      return;
    }
    if (!campaign) return;

    const usuarioId = localStorage.getItem("usuarioId");
    if (!usuarioId) {
      toast({
        title: "Erro de Autenticação",
        description: "ID do usuário não encontrado. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    const sendPromises = selectedClientIds.map((clienteId) =>
      api.post("/envio/individual", {
        clienteId,
        campanhaId: campaign.id,
        usuarioId,
      })
    );

    try {
      await Promise.all(sendPromises);
      toast({
        title: "Envio Concluído!",
        description: `Campanha "${
          campaign.titulo
        }" enviada para ${selectedClientIds.length} cliente(s).`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro no envio em massa:", error);
      toast({
        title: "Erro no Envio",
        description: "Ocorreu um erro ao enviar a campanha para um ou mais clientes.",
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
            Selecione os clientes para enviar a campanha{" "}
            <span className="font-semibold text-primary">
              "{campaign?.titulo}"
            </span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Input
            placeholder="Buscar cliente por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
            {loadingClients ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2 p-2">
                  <Checkbox
                    id="select-all"
                    onCheckedChange={handleSelectAll}
                    checked={
                      filteredClients.length > 0 &&
                      selectedClientIds.length === filteredClients.length
                    }
                  />
                  <Label htmlFor="select-all" className="font-semibold">
                    Selecionar Todos
                  </Label>
                </div>
                {filteredClients.map((client) => (
                  <div key={client.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                    <Checkbox
                      id={client.id}
                      checked={selectedClientIds.includes(client.nome)}
                      onCheckedChange={(checked) => {
                        setSelectedClientIds((prev) =>
                          checked
                            ? [...prev, client.id]
                            : prev.filter((id) => id !== client.id)
                        );
                      }}
                    />
                    <Label htmlFor={client.id} className="w-full cursor-pointer">
                      {client.nome}
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
            Enviar para ({selectedClientIds.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const CampaignsPage = () => {
  const { campaigns, addCampaign, updateCampaign, deleteCampaign, loading } =
    useCampaign();
  const { formularios } = useForm();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campanha | null>(null);

  const [manualSendState, setManualSendState] = useState<{
    isOpen: boolean;
    campaign: Campanha | null;
  }>({ isOpen: false, campaign: null });

  const [newCampaign, setNewCampaign] = useState<
    Omit<NewCampaignData, "formularioId">
  >({
    titulo: "",
    descricao: "",
    canalEnvio: "EMAIL",
    tipoCampanha: "POS_COMPRA",
    segmentoAlvo: "TODOS_CLIENTES",
    dataInicio: new Date().toISOString(),
    dataFim: new Date().toISOString(),
    templateMensagem: "",
  });
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  const uniqueCampaigns = useMemo(() => {
    if (!campaigns) return [];
    return Array.from(new Map(campaigns.map((c) => [c.id, c])).values());
  }, [campaigns]);

  // <<< CORRIGIDO: Adicionada verificação para c.titulo para evitar erros.
  const filteredCampaigns = uniqueCampaigns.filter((c) =>
    (c.titulo || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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

    const payload: NewCampaignData = {
      ...newCampaign,
      formularioId: selectedFormId,
    };

    const created = await addCampaign(payload);
    if (created) {
      setIsCreateDialogOpen(false);
      setNewCampaign({
        titulo: "",
        descricao: "",
        tipoCampanha: "POS_COMPRA",
        canalEnvio: "EMAIL",
        segmentoAlvo: "TODOS_CLIENTES",
        dataInicio: new Date().toISOString(),
        dataFim: new Date().toISOString(),
        templateMensagem: "",
      });
      setSelectedFormId(null);
    }
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;
    await updateCampaign(editingCampaign.id, editingCampaign);
    setEditingCampaign(null);
  };

  const handleToggleCampaignStatus = async (campaign: Campanha) => {
    await updateCampaign(campaign.id, { ativo: !campaign.ativo });
  };

  const handleDeleteCampaign = async (id: string) => {
    if (window.confirm("Tem certeza que deseja desativar esta campanha?")) {
      await deleteCampaign(id);
    }
  };

  const getStatusBadge = (ativo: boolean) => {
    return ativo ? (
      <Badge className="bg-green-500 text-white hover:bg-green-600">
        Ativa
      </Badge>
    ) : (
      <Badge variant="secondary">Inativa</Badge>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
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
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {campaign.titulo}
                        </h3>
                        {getStatusBadge(campaign.ativo)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {campaign.descricao}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Tipo: {campaign.tipoCampanha}</span>
                        <span>Segmento: {campaign.segmentoAlvo}</span>
                        <span>
                          Período:{" "}
                          {format(new Date(campaign.dataInicio), "dd/MM/yy")} -{" "}
                          {format(new Date(campaign.dataFim), "dd/MM/yy")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
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
                          onClick={() => handleToggleCampaignStatus(campaign)}
                        >
                          <Pause className="w-3 h-3 mr-1" />
                          Pausar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleToggleCampaignStatus(campaign)}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Iniciar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCampaign(campaign)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
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

      {/* Modal de Criação */}
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
              <Select onValueChange={setSelectedFormId}>
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
                      Clientes Regulares
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
                <Label>Data de Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(new Date(newCampaign.dataInicio), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(newCampaign.dataInicio)}
                      onSelect={(date) =>
                        date &&
                        setNewCampaign({
                          ...newCampaign,
                          dataInicio: date.toISOString(),
                        })
                      }
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
                      {format(new Date(newCampaign.dataFim), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
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
              <div className="col-span-2">
                <Label htmlFor="channel">Canal de Envio</Label>
                <Select
                  value={newCampaign.canalEnvio}
                  onValueChange={(v) =>
                    setNewCampaign({ ...newCampaign, canalEnvio: v })
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
            </div>
            <div className="flex justify-end gap-2">
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

      {/* Modal de Edição */}
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
                <Label>Nome da Campanha</Label>
                <Input
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
                <Label>Descrição</Label>
                <Textarea
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
                <Label>Formulário</Label>
                <Select
                  value={editingCampaign.formularioId}
                  onValueChange={(formId) =>
                    setEditingCampaign({
                      ...editingCampaign,
                      formularioId: formId,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
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
                  <Label>Tipo</Label>
                  <Select
                    value={editingCampaign.tipoCampanha}
                    onValueChange={(v) =>
                      setEditingCampaign({
                        ...editingCampaign,
                        tipoCampanha: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POS_COMPRA">Pós-Compra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Segmento</Label>
                  <Select
                    value={editingCampaign.segmentoAlvo}
                    onValueChange={(v) =>
                      setEditingCampaign({
                        ...editingCampaign,
                        segmentoAlvo: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS_CLIENTES">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(
                          new Date(editingCampaign.dataInicio),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(editingCampaign.dataInicio)}
                        onSelect={(date) =>
                          date &&
                          setEditingCampaign({
                            ...editingCampaign,
                            dataInicio: date.toISOString(),
                          })
                        }
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Data de Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(
                          new Date(editingCampaign.dataFim),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(editingCampaign.dataFim)}
                        onSelect={(date) =>
                          date &&
                          setEditingCampaign({
                            ...editingCampaign,
                            dataFim: date.toISOString(),
                          })
                        }
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <Label>Template da Mensagem</Label>
                <Textarea
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
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingCampaign(null)}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateCampaign}>Salvar Alterações</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
