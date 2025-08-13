// import { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Switch } from "@/components/ui/switch";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { Textarea } from "@/components/ui/textarea";
// import { useAuth } from "@/contexts/AuthContext";
// import { useNavigate } from "react-router-dom";
// import { 
//   Settings, Users, Database, Bell, Mail, 
//   Key, Shield, Plus, Edit, Trash2, 
//   Link, Save, RefreshCw, Lock
// } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";



// export const SettingsPage = () => {
//   const { toast } = useToast();
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   const {user} = useAuth()
  
//   // Estados para configurações
//   const [emailNotifications, setEmailNotifications] = useState(true);
//   const [pushNotifications, setPushNotifications] = useState(true);
//   const [autoSendFeedback, setAutoSendFeedback] = useState(false);
//   const [feedbackDelay, setFeedbackDelay] = useState("24");
//   const [companyName, setCompanyName] = useState("Minha Empresa");
//   const [companyEmail, setCompanyEmail] = useState("contato@minhaempresa.com");

  
//   // Estados para usuários
//   const [users, setUsers] = useState<User[]>([
//     {
//       id: 1,
//       name: "João Silva",
//       email: "joao@empresa.com",
//       role: "admin",
//       status: "active",
//       lastLogin: "2024-11-15"
//     },
//     {
//       id: 2,
//       name: "Maria Santos",
//       email: "maria@empresa.com", 
//       role: "manager",
//       status: "active",
//       lastLogin: "2024-11-14"
//     }
//   ]);


//   const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
//   const [newUser, setNewUser] = useState({
//     name: "",
//     email: "",
//     role: "analyst"
//   });

//   const handleSaveSettings = () => {
//     toast({
//       title: "Configurações salvas",
//       description: "As configurações foram atualizadas com sucesso!"
//     });
//   };

//   const handleAddUser = () => {
//     if (!newUser.name || !newUser.email) {
//       toast({
//         title: "Erro",
//         description: "Nome e email são obrigatórios",
//         variant: "destructive"
//       });
//       return;
//     }

//     const user: User = {
//       id: Math.max(...users.map(u => u.id)) + 1,
//       ...newUser,
//       role: newUser.role as "admin" | "manager" | "analyst",
//       status: "active",
//       lastLogin: "Nunca"
//     };

//     setUsers([...users, user]);
//     setNewUser({ name: "", email: "", role: "analyst" });
//     setIsAddUserDialogOpen(false);
    
//     toast({
//       title: "Usuário adicionado",
//       description: "Novo usuário foi criado com sucesso!"
//     });
//   };

//   const handleDeleteUser = (id: number) => {
//     setUsers(users.filter(u => u.id !== id));
//     toast({
//       title: "Usuário removido",
//       description: "Usuário foi removido do sistema"
//     });
//   };

//   const getRoleBadge = (role: string) => {
//     switch (role) {
//       case 'admin':
//         return <Badge className="bg-destructive text-destructive-foreground">Admin</Badge>;
//       case 'manager':
//         return <Badge className="bg-warning text-warning-foreground">Gerente</Badge>;
//       case 'analyst':
//         return <Badge variant="secondary">Analista</Badge>;
//       default:
//         return <Badge variant="outline">{role}</Badge>;
//     }
//   };

//   const getIntegrationBadge = (status: string) => {
//     return status === 'connected' 
//       ? <Badge className="bg-success text-success-foreground">Conectado</Badge>
//       : <Badge variant="outline">Desconectado</Badge>;
//   };

//   if (!isAdmin && user?.role !== "master") {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center">
//         <Card className="w-full max-w-md">
//           <CardHeader className="text-center">
//             <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
//             <CardTitle>Acesso Restrito</CardTitle>
//             <p className="text-muted-foreground">
//               Esta página é exclusiva para administradores
//             </p>
//           </CardHeader>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 mt-16 p-2">
//       <div>
//         <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
//         <p className="text-muted-foreground">
//           Gerencie usuários, integrações e configurações do FeedTrack
//         </p>
//       </div>

//       <Tabs defaultValue="general" className="space-y-6 ">
//         <TabsList className="justify-around flex">
//           <TabsTrigger value="general" className="flex items-center gap-2">
//             <Settings className="w-4 h-4" />
//             Geral
//           </TabsTrigger>
//           <TabsTrigger value="users" className="flex items-center gap-2">
//             <Users className="w-4 h-4" />
//             Usuários
//           </TabsTrigger>
//           <TabsTrigger value="notifications" className="flex items-center gap-2">
//             <Bell className="w-4 h-4" />
//             Notificações
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="general" className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Informações da Empresa</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <Label htmlFor="company-name">Nome da Empresa</Label>
//                   <Input
//                     id="company-name"
//                     value={companyName}
//                     onChange={(e) => setCompanyName(e.target.value)}
//                   />
//                 </div>
//                 <div>
//                   <Label htmlFor="company-email">Email da Empresa</Label>
//                   <Input
//                     id="company-email"
//                     type="email"
//                     value={companyEmail}
//                     onChange={(e) => setCompanyEmail(e.target.value)}
//                   />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card>
//             <CardHeader>
//               <CardTitle>Configurações de Feedback</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div className="flex items-center justify-between">
//                 <div className="space-y-0.5">
//                   <Label>Envio Automático de Feedback</Label>
//                   <p className="text-sm text-muted-foreground">
//                     Enviar automaticamente solicitações de feedback após compras
//                   </p>
//                 </div>
//                 <Switch
//                   checked={autoSendFeedback}
//                   onCheckedChange={setAutoSendFeedback}
//                 />
//               </div>
              
//               <div>
//                 <Label htmlFor="feedback-delay">Delay para Envio (horas)</Label>
//                 <Select value={feedbackDelay} onValueChange={setFeedbackDelay}>
//                   <SelectTrigger className="w-32">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="1">1 hora</SelectItem>
//                     <SelectItem value="6">6 horas</SelectItem>
//                     <SelectItem value="24">24 horas</SelectItem>
//                     <SelectItem value="48">48 horas</SelectItem>
//                     <SelectItem value="72">72 horas</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </CardContent>
//           </Card>

//           <div className="flex justify-end">
//             <Button onClick={handleSaveSettings}>
//               <Save className="w-4 h-4 mr-2" />
//               Salvar Configurações
//             </Button>
//           </div>
//         </TabsContent>

//         <TabsContent value="users" className="space-y-6">
//           <div className="flex justify-between items-center">
//             <div>
//               <h3 className="text-lg font-semibold">Gerenciamento de Usuários</h3>
//               <p className="text-sm text-muted-foreground">
//                 Gerencie permissões e acesso ao sistema
//               </p>
//             </div>
            
//             <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
//               <DialogTrigger asChild>
//                 <Button>
//                   <Plus className="w-4 h-4 mr-2" />
//                   Novo Usuário
//                 </Button>
//               </DialogTrigger>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle>Adicionar Novo Usuário</DialogTitle>
//                 </DialogHeader>
//                 <div className="space-y-4">
//                   <div>
//                     <Label htmlFor="user-name">Nome</Label>
//                     <Input
//                       id="user-name"
//                       value={newUser.name}
//                       onChange={(e) => setNewUser({...newUser, name: e.target.value})}
//                       placeholder="Nome completo"
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="user-email">Email</Label>
//                     <Input
//                       id="user-email"
//                       type="email"
//                       value={newUser.email}
//                       onChange={(e) => setNewUser({...newUser, email: e.target.value})}
//                       placeholder="email@empresa.com"
//                     />
//                   </div>
//                   <div>
//                     <Label htmlFor="user-role">Função</Label>
//                     <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="analyst">Analista</SelectItem>
//                         <SelectItem value="manager">Gerente</SelectItem>
//                         <SelectItem value="admin">Administrador</SelectItem>
//                       </SelectContent>
//                     </Select>
//                     <p className="text-xs text-muted-foreground mt-1">
//                       Analista: visualizar dados • Gerente: gerenciar campanhas • Admin: todas as permissões
//                     </p>
//                   </div>
//                   <div className="flex gap-2">
//                     <Button onClick={handleAddUser} className="flex-1">
//                       Adicionar Usuário
//                     </Button>
//                     <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
//                       Cancelar
//                     </Button>
//                   </div>
//                 </div>
//               </DialogContent>
//             </Dialog>
//           </div>

//           <Card>
//             <CardContent className="p-0">
//               <div className="space-y-0">
//                 {users.map((user, index) => (
//                   <div
//                     key={user.id}
//                     className={`p-4 flex items-center justify-between hover:bg-muted/50 ${
//                       index !== users.length - 1 ? 'border-b' : ''
//                     }`}
//                   >
//                     <div className="flex-1">
//                       <div className="flex items-center gap-2 mb-1">
//                         <h4 className="font-medium">{user.name}</h4>
//                         {getRoleBadge(user.role)}
//                         <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
//                           {user.status === 'active' ? 'Ativo' : 'Inativo'}
//                         </Badge>
//                       </div>
//                       <p className="text-sm text-muted-foreground">{user.email}</p>
//                       <p className="text-xs text-muted-foreground">
//                         Último login: {user.lastLogin === 'Nunca' ? 'Nunca' : new Date(user.lastLogin).toLocaleDateString('pt-BR')}
//                       </p>
//                     </div>
                    
//                     <div className="flex gap-2">
//                       <Button variant="outline" size="sm">
//                         <Edit className="w-3 h-3" />
//                       </Button>
//                       {user.role !== 'admin' && (
//                         <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)}>
//                           <Trash2 className="w-3 h-3" />
//                         </Button>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="notifications" className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Preferências de Notificação</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div className="flex items-center justify-between">
//                 <div className="space-y-0.5">
//                   <Label>Notificações por Email</Label>
//                   <p className="text-sm text-muted-foreground">
//                     Receber alertas sobre novas avaliações e relatórios
//                   </p>
//                 </div>
//                 <Switch
//                   checked={emailNotifications}
//                   onCheckedChange={setEmailNotifications}
//                 />
//               </div>
              
//               <div className="flex items-center justify-between">
//                 <div className="space-y-0.5">
//                   <Label>Notificações Push</Label>
//                   <p className="text-sm text-muted-foreground">
//                     Receber notificações em tempo real no navegador
//                   </p>
//                 </div>
//                 <Switch
//                   checked={pushNotifications}
//                   onCheckedChange={setPushNotifications}
//                 />
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// };