import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
// CORREÇÃO: Alterado o caminho de importação para relativo para resolver o erro.
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
// CORREÇÃO: Alterado o caminho de importação para relativo para resolver o erro.
import api from "../lib/api";
import {
  Settings,
  Users,
  Bell,
  Plus,
  Edit,
  Trash2,
  Save,
  TriangleAlert,
} from "lucide-react";

// Definição de tipo para um usuário existente
type User = {
  id: number;
  nomeUsuario: string;
  email?: string;
  tipo: string;
  status: "ATIVO" | "INATIVO";
  lastLogin: string;
};

// Definição de tipo para um novo usuário a ser criado
type NewUser = {
  nomeUsuario: string;
  tipo: "USER" | "ADMIN";
  senhaHash: string;
  empresaId: string;
};

export const SettingsPage = () => {
  // --- HOOKS ---
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [autoSendFeedback, setAutoSendFeedback] = useState(false);
  const [feedbackDelay, setFeedbackDelay] = useState("24");
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    nomeUsuario: "",
    tipo: "USER",
    senhaHash: "",
    empresaId: user?.empresaId || "",
  });

  // --- EFEITOS ---
  useEffect(() => {
    if (!user?.empresaId) return;

    // Carregar dados da empresa do localStorage
    try {
      const companyDataString = localStorage.getItem("userEmpresa");
      if (companyDataString) {
        const companyData = JSON.parse(companyDataString);
        setCompanyName(companyData.props.nome || "");
        setCompanyEmail(companyData.props.email || "");
      } else {
        toast({
          title: "Aviso",
          description: "Dados da empresa não encontrados localmente.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error(
        "Erro ao carregar dados da empresa do localStorage:",
        error
      );
      toast({
        title: "Erro de Carregamento",
        description: "Não foi possível ler os dados da empresa localmente.",
        variant: "destructive",
      });
    }

    // Busca utilizadores (com otimização de localStorage)
    fetchUsers();
  }, [user?.empresaId, toast]);

  // --- FUNÇÕES DE API ---
  const handleSaveSettings = async () => {
    if (!user?.empresaId) {
      toast({
        title: "Erro",
        description: "ID da empresa não encontrado.",
        variant: "destructive",
      });
      return;
    }
    try {
      await api.patch(`/empresa/${user.empresaId}`, {
        nome: companyName,
        email: companyEmail,
      });

      // Atualiza o localStorage após o sucesso
      const companyDataString = localStorage.getItem("userEmpresa");
      if (companyDataString) {
        const companyData = JSON.parse(companyDataString);
        companyData.props.nome = companyName;
        companyData.props.email = companyEmail;
        localStorage.setItem("userEmpresa", JSON.stringify(companyData));
      }

      toast({
        title: "Configurações guardadas",
        description: "As informações da empresa foram atualizadas com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao guardar configurações:", error);
      toast({
        title: "Erro ao guardar",
        description: "Não foi possível atualizar as informações da empresa.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCompany = async () => {
    if (!user?.empresaId) return;
    try {
      await api.delete(`/empresa/${user.empresaId}`);
      toast({
        title: "Empresa eliminada",
        description:
          "A sua empresa e todos os dados associados foram removidos.",
      });

      localStorage.removeItem("userEmpresa");
      localStorage.removeItem("companyUsers");
      logout();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao eliminar empresa:", error);
      toast({
        title: "Erro ao eliminar",
        description: "Não foi possível remover a empresa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    if (!user?.empresaId) return;

    try {
      const usersDataString = localStorage.getItem("companyUsers");
      if (usersDataString) {
        const usersData = JSON.parse(usersDataString);
        setUsers(usersData);
        return;
      }
    } catch (error) {
      console.error("Erro ao ler utilizadores do localStorage:", error);
    }

    try {
      const response = await api.get(`/usuarios?empresaId=${user.empresaId}`);
      setUsers(response.data);
      localStorage.setItem("companyUsers", JSON.stringify(response.data));
    } catch (error) {
      console.error("Erro ao buscar utilizadores:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os utilizadores.",
        variant: "destructive",
      });
    }
  };

  const handleAddUser = async () => {
    if (!newUser.nomeUsuario || !newUser.senhaHash) {
      toast({
        title: "Erro",
        description: "Nome e senha são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    if (!user?.empresaId) {
      toast({
        title: "Erro",
        description: "Empresa não identificada. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }
    try {
      await api.post(`/usuario/${user.empresaId}`, newUser);
      toast({
        title: "Utilizador adicionado",
        description: "Novo utilizador foi criado com sucesso!",
      });
      setNewUser({
        nomeUsuario: "",
        tipo: "USER",
        senhaHash: "",
        empresaId: user.empresaId,
      });
      setIsAddUserDialogOpen(false);
      localStorage.removeItem("companyUsers");
      fetchUsers();
    } catch (error) {
      console.error("Erro ao adicionar utilizador:", error);
      toast({
        title: "Erro ao adicionar utilizador",
        description: "Ocorreu um erro ao criar o utilizador.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!user?.empresaId) return;
    try {
      await api.delete(`/usuarios/${id}?empresaId=${user.empresaId}`);
      toast({
        title: "Utilizador removido",
        description: "O utilizador foi removido do sistema.",
      });
      localStorage.removeItem("companyUsers");
      fetchUsers();
    } catch (error) {
      console.error("Erro ao remover utilizador:", error);
      toast({
        title: "Erro ao remover utilizador",
        description: "Ocorreu um erro ao remover o utilizador.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            Admin
          </Badge>
        );
      case "USER":
        return <Badge variant="secondary">User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6 mt-16 p-4">
      <div>
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
        <p className="text-muted-foreground">
          Faça a gestão de utilizadores, integrações e configurações da empresa
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" /> Geral
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" /> Utilizadores
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" /> Notificações
          </TabsTrigger>
        </TabsList>

        {/* Separador Geral */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail">Email de Contacto</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações de Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 blur">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Envio Automático de Feedback</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar automaticamente pedidos de feedback após compras
                  </p>
                </div>
                <Switch
                  checked={autoSendFeedback}
                  onCheckedChange={setAutoSendFeedback}
                />
              </div>
              <div>
                <Label>Atraso para Envio (horas)</Label>
                <Select value={feedbackDelay} onValueChange={setFeedbackDelay}
                disabled={true}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hora</SelectItem>
                    <SelectItem value="6">6 horas</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="48">48 horas</SelectItem>
                    <SelectItem value="72">72 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings}>
              <Save className="w-4 h-4 mr-2" /> Guardar Configurações
            </Button>
          </div>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg">
                <div>
                  <h3 className="font-semibold">Eliminar Empresa</h3>
                  <p className="text-sm text-muted-foreground">
                    Esta ação é irreversível e removerá todos os dados da sua
                    empresa.
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <TriangleAlert className="text-destructive" /> Tem a
                        certeza absoluta?
                      </DialogTitle>
                      <DialogDescription className="pt-2">
                        Esta ação não pode ser desfeita. Irá eliminar
                        permanentemente a sua empresa, juntamente com todos os
                        dados associados.
                        <br />
                        <br />
                        Digite o nome da sua empresa (<b>{companyName}</b>) para
                        confirmar.
                      </DialogDescription>
                    </DialogHeader>
                    <Input
                      onChange={(e) => {
                        const confirmButton =
                          document.getElementById("confirmDeleteBtn");
                        if (confirmButton) {
                          confirmButton.toggleAttribute(
                            "disabled",
                            e.target.value !== companyName
                          );
                        }
                      }}
                      placeholder="Digite o nome da empresa"
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button
                        id="confirmDeleteBtn"
                        variant="destructive"
                        onClick={handleDeleteCompany}
                        disabled
                      >
                        Eu compreendo, eliminar a minha empresa
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Separador Utilizadores */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Gestão de Utilizadores</h3>
              <p className="text-sm text-muted-foreground">
                Faça a gestão de permissões e acesso ao sistema
              </p>
            </div>
            <Dialog
              open={isAddUserDialogOpen}
              onOpenChange={setIsAddUserDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Novo Utilizador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Utilizador</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome de utilizador</Label>
                    <Input
                      value={newUser.nomeUsuario}
                      onChange={(e) =>
                        setNewUser({ ...newUser, nomeUsuario: e.target.value })
                      }
                      placeholder="Nome de utilizador"
                    />
                  </div>
                  <div>
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      value={newUser.senhaHash}
                      onChange={(e) =>
                        setNewUser({ ...newUser, senhaHash: e.target.value })
                      }
                      placeholder="Senha forte"
                    />
                  </div>
                  <div>
                    <Label>Função</Label>
                    <Select
                      value={newUser.tipo}
                      onValueChange={(value: "USER" | "ADMIN") =>
                        setNewUser({ ...newUser, tipo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">USER</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddUser} className="flex-1">
                      Adicionar Utilizador
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddUserDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className={`p-4 flex items-center justify-between hover:bg-muted/50 ${
                    index !== users.length - 1 ? "border-b" : ""
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{user.nomeUsuario}</h4>
                      {getRoleBadge(user.tipo)}
                      <Badge
                        variant={
                          user.status === "ATIVO" ? "default" : "secondary"
                        }
                      >
                        {user.status === "ATIVO" ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Último login:{" "}
                      {user.lastLogin === "Nunca"
                        ? "Nunca"
                        : new Date(user.lastLogin).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3" />
                    </Button>
                    {user.tipo !== "ADMIN" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Separador Notificações */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 blur">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber alertas sobre novas avaliações e relatórios
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  disabled={true}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações em tempo real no navegador
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                  disabled={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
