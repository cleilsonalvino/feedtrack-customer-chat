import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Importa o contexto com register

export const Register = () => {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [alerta, setAlerta] = useState<{
    tipo: "success" | "danger";
    mensagem: string;
  } | null>(null);

  const navigate = useNavigate();
  const { register } = useAuth(); // Pega a função de registro do contexto

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlerta(null);

    // Validações básicas
    if (!nomeCompleto.trim()) {
      setAlerta({ tipo: "danger", mensagem: "O campo Nome Completo é obrigatório." });
      return;
    }
    if (!email.trim()) {
      setAlerta({ tipo: "danger", mensagem: "O campo Email é obrigatório." });
      return;
    }
    if (!usuario.trim()) {
      setAlerta({ tipo: "danger", mensagem: "O campo Usuário é obrigatório." });
      return;
    }
    if (password.length < 6) {
      setAlerta({ tipo: "danger", mensagem: "A Senha deve ter no mínimo 6 caracteres." });
      return;
    }
    if (password !== confirmPassword) {
      setAlerta({ tipo: "danger", mensagem: "As senhas não coincidem." });
      return;
    }

    try {
      // Usa a função register do contexto para chamar a API real
      await register({
        nomeUsuario: usuario,
        senha: password,
        nomeEmpresa: nomeCompleto,
        email
      });

      setAlerta({ tipo: "success", mensagem: "Cadastro realizado com sucesso! Redirecionando..." });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (error: any) {
      setAlerta({ tipo: "danger", mensagem: error.message || "Erro ao cadastrar. Tente novamente." });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-xl p-6 md:flex md:gap-8">
        {/* Imagem */}
        <div className="hidden md:flex items-center justify-center">
          <img
            src="./login.jpg"
            alt="Cadastro"
            className="w-[300px] h-[300px] object-cover rounded-md"
          />
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 justify-center gap-4">
          <h1 className="text-2xl font-bold text-center text-blue-800">
            Crie sua conta no FeedTrack
          </h1>

          {alerta && (
            <div
              className={`rounded-md px-4 py-3 text-sm font-medium flex justify-between items-center ${
                alerta.tipo === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              <span>{alerta.mensagem}</span>
              <button type="button" onClick={() => setAlerta(null)} className="text-xl font-bold ml-2">
                ×
              </button>
            </div>
          )}

          {/* Campos */}
          <div>
            <label htmlFor="nomeUsuario" className="block text-sm font-medium text-gray-700">
              Nome de Usuario
            </label>
            <input
              id="nomeUsuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700">
              Nome da Empresa
            </label>
            <input
              id="nomeCompleto"
              type="text"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition"
          >
            Cadastrar
          </button>

          <p className="text-center text-sm text-gray-500 mt-3">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Faça login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
