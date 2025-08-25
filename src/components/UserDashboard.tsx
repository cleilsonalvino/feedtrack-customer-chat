import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { DollarSign, Users, Cylinder, MessageSquare, FolderKanban } from "lucide-react";

export const UserDashboard = () => {
  const navigate = useNavigate();

  const cards = [
    { name: "Vendas", description: "Acesso à tela de vendas.", href: "/sales", icon: DollarSign },
    { name: "Editor de Formulário", description: "Acesso ao editor de formulário.", href: "/form-builder", icon: FolderKanban },
    { name: "Produtos", description: "Gerencie os produtos da sua empresa.", href: "/products", icon: Cylinder },
    { name: "Campanhas", description: "Visualize e crie campanhas.", href: "/campaigns", icon: MessageSquare },
    { name: "Clientes", description: "Gerencie seus clientes.", href: "/customers", icon: Users },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 mt-10">Dashboard do Usuário</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card
            key={card.name}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(card.href)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <card.icon size={20} /> {card.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
