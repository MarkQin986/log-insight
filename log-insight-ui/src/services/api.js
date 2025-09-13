import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
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

export const logService = {
  // Get logs with pagination and search
  getLogs: async (logType, page = 1, limit = 50, search = '', startDate = '', endDate = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
    });
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const url = `/logs/${logType}?${params.toString()}`;
    const response = await api.get(url);
    return response.data;
  },

  // Delete logs
  deleteLogs: async (logType, conditions) => {
    const response = await api.delete(`/logs/${logType}`, { data: conditions });
    return response.data;
  },

  // Get log statistics
  getLogStats: async () => {
    const response = await api.get('/logs-stats');
    return response.data;
  },

  // Submit general log (public endpoint)
  submitGeneralLog: async (level, message, data = {}) => {
    const response = await axios.post(`${API_BASE_URL}/logs/general`, {
      level,
      message,
      data,
    });
    return response.data;
  },

  // Submit token usage log (public endpoint)
  submitTokenLog: async (tokenData) => {
    const response = await axios.post(`${API_BASE_URL}/logs/tokens`, tokenData);
    return response.data;
  },
};

export const authService = {
  login: async (username, password) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username,
      password,
    });
    return response.data;
  },
};

export default api;
