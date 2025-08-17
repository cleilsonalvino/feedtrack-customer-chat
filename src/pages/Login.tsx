import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const Login = () => {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [alerta, setAlerta] = useState<{ tipo: "success" | "danger"; mensagem: string } | null>(null);
  const [verSenha, setVerSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUsuario(parsedUser.nomeUsuario || "");
      setSenha(parsedUser.senha || "");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlerta(null);

    if (!usuario.trim()) {
      setAlerta({ tipo: "danger", mensagem: "O campo Usuário é obrigatório." });
      return;
    }
    if (!senha.trim()) {
      setAlerta({ tipo: "danger", mensagem: "A Senha é obrigatória." });
      return;
    }

    try {
      setLoading(true);
      const user = await login(usuario, senha);
      setAlerta({ tipo: "success", mensagem: "Login realizado com sucesso! Redirecionando..." });
      if (user.tipo === 'SUPER_ADMIN') {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (error) {
      setAlerta({ tipo: "danger", mensagem: "Credenciais inválidas. Verifique seu usuário e senha." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-xl p-6 md:flex md:gap-8">
        <div className="hidden md:flex items-center justify-center">
          <img src="./login.jpg" alt="Login" className="w-[300px] h-[300px] object-cover rounded-md" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 justify-center gap-4">
          <h1 className="text-2xl font-bold text-center text-blue-800">FeedTrack - Software</h1>

          {alerta && (
            <div
              className={`rounded-md px-4 py-3 text-sm font-medium flex justify-between items-center ${
                alerta.tipo === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              <span>{alerta.mensagem}</span>
              <button type="button" onClick={() => setAlerta(null)} className="text-xl leading-none font-bold ml-2">×</button>
            </div>
          )}

          <div>
            <label htmlFor="usuario" className="block text-sm font-medium text-gray-700">Usuário</label>
            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
            <div className="relative">
              <input
                id="password"
                type={verSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 px-3 py-2"
              />
              <button
                type="button"
                onClick={() => setVerSenha(!verSenha)}
                className="absolute inset-y-0 right-3 top-1/2 transform -translate-y-1/2 text-sm text-blue-600"
              >
                {verSenha ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link to="/recuperar-senha" className="text-sm text-blue-600 hover:underline">
              Esqueceu a senha?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4A8 8 0 104 12z"
                  ></path>
                </svg>
                Entrando...
              </span>
            ) : (
              "Login"
            )}
          </button>

          <p>
            Não tem uma conta?{" "}
            <Link to="/register" className="underline text-blue-500">
              Cadastre-se
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
