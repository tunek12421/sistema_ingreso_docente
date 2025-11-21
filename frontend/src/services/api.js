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
};

export const turnoService = {
  getAll: () => api.get('/turnos'),
  getById: (id) => api.get(`/turnos/${id}`),
  create: (turno) => api.post('/turnos', turno),
  update: (id, turno) => api.put(`/turnos/${id}`, turno),
  delete: (id) => api.delete(`/turnos/${id}`),
};

export const ambienteService = {
  getAll: () => api.get('/ambientes'),
  getById: (id) => api.get(`/ambientes/${id}`),
  getByCodigo: (codigo) => api.get(`/ambientes/codigo/${codigo}`),
  create: (ambiente) => api.post('/ambientes', ambiente),
  update: (id, ambiente) => api.put(`/ambientes/${id}`, ambiente),
  delete: (id) => api.delete(`/ambientes/${id}`),
};

export const llaveService = {
  getAll: () => api.get('/llaves'),
  getById: (id) => api.get(`/llaves/${id}`),
  getByCodigo: (codigo) => api.get(`/llaves/codigo/${codigo}`),
  getByAmbiente: (ambienteId) => api.get(`/llaves/ambiente/${ambienteId}`),
  create: (llave) => api.post('/llaves', llave),
  update: (id, llave) => api.put(`/llaves/${id}`, llave),
  updateEstado: (id, estado) => api.patch(`/llaves/${id}/estado`, { estado }),
  delete: (id) => api.delete(`/llaves/${id}`),
};

export const asignacionService = {
  getAll: () => api.get('/asignaciones'),
  getById: (id) => api.get(`/asignaciones/${id}`),
  getByDocente: (docenteId) => api.get(`/asignaciones/docente/${docenteId}`),
  getByDocenteYFecha: (docenteId, fecha) => api.get(`/asignaciones/docente/${docenteId}/fecha?fecha=${fecha}`),
  create: (asignacion) => api.post('/asignaciones', asignacion),
  update: (id, asignacion) => api.put(`/asignaciones/${id}`, asignacion),
  delete: (id) => api.delete(`/asignaciones/${id}`),
};

export default api;
