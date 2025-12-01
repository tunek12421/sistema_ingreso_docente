import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (username, password) =>
    api.post('/login', { username, password }),
};

export const docenteService = {
  getAll: () => api.get('/docentes'),
  getById: (id) => api.get(`/docentes/${id}`),
  getByCI: (ci) => api.get(`/docentes/ci/${ci}`),
  create: (docente) => api.post('/docentes', docente),
  update: (id, docente) => api.put(`/docentes/${id}`, docente),
  delete: (id) => api.delete(`/docentes/${id}`),
};

export const registroService = {
  registrarIngreso: (data) => api.post('/registros/ingreso', data),
  registrarSalida: (data) => api.post('/registros/salida', data),
  getByFecha: (fecha) => api.get(`/registros?fecha=${fecha}`),
  getRegistrosHoy: () => api.get('/registros/hoy'),
  getLlaveActual: (docenteId) => api.get(`/registros/llave-actual?docente_id=${docenteId}`),
};

export const turnoService = {
  getAll: () => api.get('/turnos'),
  getById: (id) => api.get(`/turnos/${id}`),
  create: (turno) => api.post('/turnos', turno),
  update: (id, turno) => api.put(`/turnos/${id}`, turno),
  delete: (id) => api.delete(`/turnos/${id}`),
};

export const llaveService = {
  getAll: () => api.get('/llaves'),
  getById: (id) => api.get(`/llaves/${id}`),
  getByCodigo: (codigo) => api.get(`/llaves/codigo/${codigo}`),
  getByAulaCodigo: (aulaCodigo) => api.get(`/llaves/aula/${aulaCodigo}`),
  create: (llave) => api.post('/llaves', llave),
  update: (id, llave) => api.put(`/llaves/${id}`, llave),
  updateEstado: (id, estado) => api.patch(`/llaves/${id}/estado`, { estado }),
  delete: (id) => api.delete(`/llaves/${id}`),
};

export default api;
