import api from "@/lib/api";
import React, { useState } from "react";
import { Link } from "react-router-dom";

export const RecuperarSenhaUnificado = () => {
  // Etapas: "solicitar" ou "resetar"
  const [etapa, setEtapa] = useState<"solicitar" | "resetar">("solicitar");
  
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoNovaSenha, setConfirmacaoNovaSenha] = useState("");
  
  const [alerta, setAlerta] = useState<{ tipo: "success" | "danger"; mensagem: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Solicita token de recuperação
  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlerta(null);

    if (!email.trim()) {
      setAlerta({ tipo: "danger", mensagem: "O campo e-mail é obrigatório." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAlerta({ tipo: "danger", mensagem: "Digite um e-mail válido." });
      return;
    }

    setLoading(true);
    try {
      await api.post("/recuperacao/solicitar", { email });
      console.log("E-mail enviado com sucesso!");

      setAlerta({
        tipo: "success",
        mensagem: "E-mail enviado! Verifique sua caixa de entrada e insira o token abaixo.",
      });

      setEtapa("resetar");
    } catch (err) {
      setAlerta({ tipo: "danger", mensagem: "Erro ao enviar e-mail. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  // Redefine a senha usando o token
  const handleResetar = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlerta(null);

    if (!token || !novaSenha || !confirmacaoNovaSenha) {
      setAlerta({ tipo: "danger", mensagem: "Preencha todos os campos." });
      return;
    }

    if (novaSenha !== confirmacaoNovaSenha) {
      setAlerta({ tipo: "danger", mensagem: "As senhas não conferem." });
      return;
    }

    setLoading(true);
    try {
      await api.post("/recuperacao/confirmar", { token, novaSenha, confirmacaoNovaSenha });

      setAlerta({
        tipo: "success",
        mensagem: "Senha alterada com sucesso! Você pode fazer login agora.",
      });

      // Limpa campos
      setEmail("");
      setToken("");
      setNovaSenha("");
      setConfirmacaoNovaSenha("");
      setEtapa("solicitar");
    } catch (err) {
      setAlerta({ tipo: "danger", mensagem: "Erro ao alterar senha. Verifique o token." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-6">
        <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">
          {etapa === "solicitar" ? "Recuperar Senha" : "Redefinir Senha"}
        </h1>

        {alerta && (
          <div
            className={`rounded-md px-4 py-3 text-sm font-medium mb-4 ${
              alerta.tipo === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {alerta.mensagem}
          </div>
        )}

        {etapa === "solicitar" ? (
          <form onSubmit={handleSolicitar} className="flex flex-col gap-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-mail cadastrado
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                         focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
              placeholder="seuemail@exemplo.com"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2 rounded-md
                         hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar e-mail de recuperação"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetar} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Token recebido por e-mail"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="input-field"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Nova senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="input-field"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Confirme a nova senha"
              value={confirmacaoNovaSenha}
              onChange={(e) => setConfirmacaoNovaSenha(e.target.value)}
              className="input-field"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-2 rounded-md
                         hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Alterando..." : "Alterar senha"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Lembrou a senha?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
};
