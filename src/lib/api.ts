import axios from "axios";

//"https://server.feedtrack.site/api/v1"
//"http://localhost:3006/api/v1"


const api = axios.create({
  baseURL: "https://server.feedtrack.site/api/v1", // ou sua URL de produção
});

// Sempre que recarregar a página, adiciona o token do localStorage
const token = localStorage.getItem("authToken");
if (token) {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

export default api;
