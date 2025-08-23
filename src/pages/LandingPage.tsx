import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  Star, 
  CheckCircle,
  ArrowRight,
  Target,
  TrendingUp,
  Shield,
  Clock,
  Globe,
  Mail,
  Smartphone,
  Zap,
  Award,
  Heart
} from "lucide-react";

export const LandingPage = () => {
  const features = [
    {
      icon: <MessageSquare className="w-6 h-6 text-primary" />,
      title: "Campanhas Automatizadas",
      description: "Envie convites de feedback automaticamente após cada venda"
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-primary" />,
      title: "Analytics Avançados",
      description: "Relatórios detalhados com insights sobre satisfação dos clientes"
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "Gestão de Clientes",
      description: "Centralize informações e histórico de todos os seus clientes"
    },
    {
      icon: <Star className="w-6 h-6 text-primary" />,
      title: "Sistema de Avaliações",
      description: "Colete e gerencie avaliações com sistema de estrelas"
    },
    {
      icon: <Target className="w-6 h-6 text-primary" />,
      title: "Segmentação Inteligente",
      description: "Campanhas personalizadas por categoria de produto"
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "Controle de Acesso",
      description: "Níveis de permissão para equipes e administradores"
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "R$ 99",
      period: "/mês",
      description: "Ideal para pequenas empresas",
      features: [
        "Até 500 clientes",
        "2 campanhas ativas",
        "Relatórios básicos",
        "Suporte por email",
        "1 usuário"
      ],
      popular: false,
      buttonText: "Começar Grátis"
    },
    {
      name: "Professional",
      price: "R$ 199",
      period: "/mês",
      description: "Para empresas em crescimento",
      features: [
        "Até 2.000 clientes",
        "Campanhas ilimitadas",
        "Relatórios avançados",
        "Suporte prioritário",
        "5 usuários",
      ],
      popular: true,
      buttonText: "Assinar Agora"
    },
    {
      name: "Enterprise",
      price: "R$ 399",
      period: "/mês",
      description: "Para grandes operações",
      features: [
        "Clientes ilimitados",
        "Campanhas ilimitadas",
        "Relatórios avançados",
        "Suporte 24/7",
        "Usuários ilimitados",
      ],
      popular: false,
      buttonText: "Falar com Vendas"
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Gerente de CX",
      company: "TechShop",
      content: "O FeedTrack revolucionou nossa gestão pós-venda. Aumentamos em 40% nossa taxa de resposta dos clientes.",
      rating: 5
    },
    {
      name: "João Santos",
      role: "CEO",
      company: "MegaStore",
      content: "Ferramenta indispensável para qualquer empresa que se preocupa com a experiência do cliente.",
      rating: 5
    },
    {
      name: "Ana Costa",
      role: "Coordenadora de Marketing",
      company: "EletroPlus",
      content: "Os insights gerados pelo sistema nos ajudaram a melhorar significativamente nossos produtos.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              FeedTrack
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Depoimentos
            </a>
            <Link to="/login">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link to={"/register"}><Button>Começar Grátis</Button></Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20">
            <Zap className="w-4 h-4 mr-1" />
            Sistema de Gestão Pós-Venda
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto">
            Transforme o feedback dos seus{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              clientes em crescimento
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automatize campanhas de feedback, analise a satisfação dos clientes e melhore 
            continuamente seus produtos e serviços com nossa plataforma completa.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => window.location.href = "/login"}>
              Começar Grátis por 14 dias
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              Sem cartão de crédito
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              Setup em 5 minutos
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              Suporte especializado
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa em uma plataforma
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simplifique sua gestão pós-venda com ferramentas poderosas e intuitivas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <p className="text-muted-foreground">Taxa de entrega</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">+65%</div>
              <p className="text-muted-foreground">Aumento em respostas</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10k+</div>
              <p className="text-muted-foreground">Empresas ativas</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">4.9⭐</div>
              <p className="text-muted-foreground">Nota dos usuários</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos que se adaptam ao seu negócio
            </h2>
            <p className="text-xl text-muted-foreground">
              Escolha o plano ideal para o tamanho da sua empresa
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative hover:shadow-xl transition-all duration-300 ${
                  plan.popular ? 'border-primary scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                  >
                    {plan.buttonText}
                  </Button>
                  
                  <Separator />
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Precisa de algo personalizado?
            </p>
            <Button variant="outline" size="lg">
              <Mail className="w-4 h-4 mr-2" />
              Falar com Especialista
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-muted-foreground">
              Empresas de todos os tamanhos confiam no FeedTrack
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-warning fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-muted-foreground mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role} • {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para transformar seu pós-venda?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se a milhares de empresas que já melhoraram a satisfação dos clientes com o FeedTrack
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 py-6"
            >
              Começar Grátis Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          <p className="text-sm mt-6 opacity-75">
            Sem compromisso • Cancelamento a qualquer momento
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                FeedTrack
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Termos</a>
              <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
              <Link to="/login" className="hover:text-foreground transition-colors">
                Acessar Sistema
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2024 FeedTrack. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};