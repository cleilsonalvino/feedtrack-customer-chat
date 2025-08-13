import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { useProduct } from "@/contexts/ProductContext";
import { useForm } from "@/contexts/FormContext";
import { useNavigate } from "react-router-dom";


const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState("free");
  const [productName, setProductName] = useState("");
  const [productValue, setProductValue] = useState(0);
  const [productDescription, setProductDescription] = useState("");

  const navigate = useNavigate();

  const { addProduct } = useProduct();
  const { addForm } = useForm();

  const handleNextStep = async () => {
    if (step === 1) {
      if (!plan) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um plano.",
          variant: "destructive",
        });
        return;
      }
      setStep(step + 1);
    } else if (step === 2) {
      if (!productName) {
        toast({
          title: "Erro",
          description: "Por favor, insira o nome do produto.",
          variant: "destructive",
        });
        return;
      }
      try {
        await addProduct({
          nome: productName,
          descricao: productDescription,
          valor: productValue,
        });
        toast({
          title: "Sucesso",
          description: "Produto cadastrado com sucesso!",
        });
        setStep(step + 1);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível cadastrar o produto.",
          variant: "destructive",
        });
      }
    }

    navigate("/home"); // Redireciona para a página inicial após o onboarding

  };

  return (
    <div className="container mx-auto flex h-screen flex-col items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {step === 1 && "Escolha seu Plano"}
            {step === 2 && "Cadastre seu primeiro produto"}
            {step === 3 && "Finalização do Onboarding"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <RadioGroup defaultValue="free" onValueChange={setPlan}>
              <div className="mb-4 flex items-center space-x-2">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free">Plano Gratuito</Label>
              </div>
              <div className="mb-4 flex items-center space-x-2">
                <RadioGroupItem value="basic" id="basic" />
                <Label htmlFor="basic">Plano Básico - R$49/mês</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pro" id="pro" />
                <Label htmlFor="pro">Plano Pro - R$99/mês</Label>
              </div>
            </RadioGroup>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <Label htmlFor="productName">Nome do Produto</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
              <Label htmlFor="productValue">Valor do Produto (R$)</Label>
              <Input
                id="productValue"
                type="number"
                step="0.01"
                value={productValue}
                onChange={(e) => setProductValue(Number(e.target.value))}
              />
              <Label htmlFor="productDescricao">Descrição do Produto</Label>
              <Input
                id="productDescricao"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
              />
            </div>
          )}
          <Button onClick={handleNextStep} className="mt-6 w-full">
            {step < 3 ? "Próximo" : "Finalizar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingPage;
