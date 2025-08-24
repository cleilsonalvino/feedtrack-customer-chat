import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3006/api/v1", // ou sua URL de produção
});

// Sempre que recarregar a página, adiciona o token do localStorage
const token = localStorage.getItem("authToken");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export default api;
