import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const Login = () => {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [alerta, setAlerta] = useState<{ tipo: "success" | "danger"; mensagem: string } | null>(null);

  const { login, isAuthenticated, isAdmin, isEmployee, isMaster } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin || isEmployee) {
        navigate("/home", { replace: true });
      } else if (isMaster) {
        navigate("/master", { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, isEmployee, isMaster, navigate]);

  // A função agora é 'async' para poder usar 'await'
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlerta(null);

    if (!usuario.trim()) {
      setAlerta({ tipo: "danger", mensagem: "O campo Usuário é obrigatório." });
      return;
    }
    if (!password.trim()) {
      setAlerta({ tipo: "danger", mensagem: "A Senha é obrigatória." });
      return;
    }

    // Usamos um bloco 'try...catch' para lidar com sucesso e erro da API
    try {
      // 1. 'await' faz com que o código espere a função 'login' terminar
      await login(usuario, password);

      // 2. Se a linha de cima não der erro, o login foi um sucesso!
      setAlerta({ tipo: "success", mensagem: "Login realizado com sucesso! Redirecionando..." });
      // O useEffect acima cuidará do redirecionamento automático.

    } catch (error) {
      // 3. Se 'login' lançar um erro (ex: senha errada), ele é capturado aqui.
      setAlerta({ tipo: "danger", mensagem: "Credenciais inválidas. Verifique seu usuário e senha." });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-xl p-6 md:flex md:gap-8">
        {/* Imagem */}
        <div className="hidden md:flex items-center justify-center">
          <img src="./login.jpg" alt="Login" className="w-[300px] h-[300px] object-cover rounded-md" />
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 justify-center gap-4">
          <h1 className="text-2xl font-bold text-center text-blue-800">FeedTrack - Software</h1>

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
                className="text-xl leading-none font-bold ml-2"
              >
                ×
              </button>
            </div>
          )}

          <div>
            <label htmlFor="usuario" className="block text-sm font-medium text-gray-700">
              Usuário
            </label>
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

          <div className="text-right">
            <Link to="/recuperar-senha" className="text-sm text-blue-600 hover:underline">
              Esqueceu a senha?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition"
          >
            Login
          </button>

          <p className="text-center text-sm text-gray-500 mt-3">
            Teste com: <span className="font-mono">admin/admin123</span> ou{" "}
            <span className="font-mono">funcionario/func123</span>
          </p>
        </form>
      </div>
    </div>
  );
};