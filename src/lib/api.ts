// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  // ATENÇÃO: Substitua pela URL real do seu backend.
  // Se o seu backend roda na porta 3001, por exemplo, seria 'http://localhost:3001/api'
  baseURL: 'http://localhost:3006/api/v1', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
