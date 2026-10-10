/**
 * api.js – Cliente HTTP centralizado para comunicación con el backend FastAPI.
 * Usa axios con interceptores para manejo global de errores y base URL configurable.
 */
import axios from 'axios';

const isProd = import.meta.env.PROD;
const DEFAULT_URL = isProd
  ? 'https://lextrack-back-9ew1.onrender.com'
  : ''; // En dev, usar URL relativa para que el proxy de Vite maneje el routing

const BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de respuesta para manejo global de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const mensaje = error.response?.data?.detail || error.message || 'Error desconocido';
    console.error('[API Error]', error.response?.status, mensaje);
    return Promise.reject({ status: error.response?.status, mensaje });
  }
);

// ---------------------------------------------------------------------------
// Casos
// ---------------------------------------------------------------------------
export const getCasos = async () => {
  const { data } = await apiClient.get('/api/v1/casos');
  return data; // { total, casos: CasoDB[] }
};

export const getCasoPorId = async (idCaso) => {
  const { data } = await apiClient.get(`/api/v1/casos/${idCaso}`);
  return data;
};

export const crearCaso = async (caso) => {
  const { data } = await apiClient.post('/api/v1/casos', caso);
  return data;
};

export const actualizarEstadoCaso = async (idCaso, nuevoEstado) => {
  const { data } = await apiClient.patch(
    `/api/v1/casos/${idCaso}/estado`,
    null,
    { params: { nuevo_estado: nuevoEstado } }
  );
  return data;
};

// ---------------------------------------------------------------------------
// Ingesta
// ---------------------------------------------------------------------------
export const crearIngesta = async (ingesta) => {
  const { data } = await apiClient.post('/api/v1/ingesta', ingesta);
  return data;
};

// ---------------------------------------------------------------------------
// Chats (n8n + MongoDB)
// ---------------------------------------------------------------------------
export const getChats = async () => {
  const { data } = await apiClient.get('/api/chats');
  return data; // { total, chats: ChatSessionSummary[] }
};

export const getChatSession = async (sessionId) => {
  const { data } = await apiClient.get(`/api/chats/${encodeURIComponent(sessionId)}`);
  return data; // { sessionId, total, messages: ChatMessage[] }
};

export default apiClient;

