import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const Register = () => {
  const [nome, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [plano, setPlano] = useState("FREE"); // exemplo de valor default
  const [alerta, setAlerta] = useState<{
    tipo: "success" | "danger";
    mensagem: string;
  } | null>(null);
    const [loading, setLoading] = useState(false); // NOVO estado

  const navigate = useNavigate();
  const { register } = useAuth();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setAlerta(null);
  setLoading(true); // ✅ ativa o loading

  if (!nome.trim()) {
    setAlerta({
      tipo: "danger",
      mensagem: "O campo Nome da Empresa é obrigatório.",
    });
    setLoading(false); // ❌ desativa o loading se houver erro
    return;
  }

  try {
    await register({
      nome,
      cnpj: cnpj.trim() ? cnpj : undefined,
      email,
      plano,
    });

    setAlerta({
      tipo: "success",
      mensagem: "Empresa cadastrada com sucesso! Redirecionando...",
    });

    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 2000);
  } catch (error: any) {
    setAlerta({
      tipo: "danger",
      mensagem: error.message || "Erro ao cadastrar. Tente novamente.",
    });
  } finally {
    setLoading(false); // ✅ garante que o loading seja desativado
  }
};


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-xl p-6 md:flex md:gap-8">
        <div className="hidden md:flex items-center justify-center">
          <img
            src="./login.jpg"
            alt="Cadastro"
            className="w-[300px] h-[300px] object-cover rounded-md"
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 justify-center gap-4"
        >
          <h1 className="text-2xl font-bold text-center text-blue-800">
            Cadastre sua empresa no FeedTrack
          </h1>

          {alerta && (
            <div
              className={`rounded-md px-4 py-3 text-sm font-medium flex justify-between items-center ${
                alerta.tipo === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <span>{alerta.mensagem}</span>
              <button
                type="button"
                onClick={() => setAlerta(null)}
                className="text-xl font-bold ml-2"
              >
                ×
              </button>
            </div>
          )}

          <div>
            <label
              htmlFor="nomeEmpresa"
              className="block text-sm font-medium text-gray-700"
            >
              Nome da Empresa
            </label>
            <input
              id="nomeEmpresa"
              type="text"
              value={nome}
              onChange={(e) => setNomeEmpresa(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="cnpj"
              className="block text-sm font-medium text-gray-700"
            >
              CNPJ (opcional)
            </label>
            <input
              id="cnpj"
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
            />
          </div>

          {/* NOVO CAMPO EMAIL */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              E-mail
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

          {/* NOVO CAMPO PLANO */}
          <div>
            <label
              htmlFor="plano"
              className="block text-sm font-medium text-gray-700"
            >
              Plano
            </label>
            <select
              id="plano"
              value={plano}
              onChange={(e) => setPlano(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
            >
              <option value="FREE">Free</option>
              <option value="BASIC">Basic</option>
              <option value="PRO">Pro</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading} // bloqueia clique enquanto carrega
            className={`w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition flex justify-center items-center ${
              loading ? "cursor-not-allowed opacity-70" : ""
            }`}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
            ) : (
              "Cadastrar Empresa"
            )}
          </button>


          <div className="flex">
            <p>voltar para</p>
            <Link to="/login" className="underline text-blue-500 ml-1">
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
