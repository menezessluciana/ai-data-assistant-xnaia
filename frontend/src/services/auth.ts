import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Also add API key if configured
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  
  return config;
});

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Backend response format
interface BackendAuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
  };
  error?: string;
  message?: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post<BackendAuthResponse>('/auth/login', { email, password });
      const data = response.data;
      
      if (data.success && data.data) {
        return {
          success: true,
          user: data.data.user,
          token: data.data.token
        };
      }
      
      return { 
        success: false, 
        error: data.error || 'Credenciais inválidas' 
      };
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.data) {
        return { 
          success: false, 
          error: error.response.data.error || 'Credenciais inválidas' 
        };
      }
      return { success: false, error: 'Erro de conexão com o servidor' };
    }
  },

  register: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    try {
      const response = await api.post<BackendAuthResponse>('/auth/register', { email, password, name });
      const data = response.data;
      
      if (data.success && data.data) {
        return {
          success: true,
          user: data.data.user,
          token: data.data.token
        };
      }
      
      return { 
        success: false, 
        error: data.error || 'Erro ao criar conta' 
      };
    } catch (error: any) {
      if (error.response?.data) {
        return { 
          success: false, 
          error: error.response.data.error || 'Erro ao criar conta' 
        };
      }
      return { success: false, error: 'Erro de conexão com o servidor' };
    }
  },

  me: async (): Promise<AuthResponse> => {
    try {
      const response = await api.get<BackendAuthResponse>('/auth/me');
      const data = response.data;
      
      if (data.success && data.data) {
        return {
          success: true,
          user: data.data.user
        };
      }
      
      return { 
        success: false, 
        error: data.error || 'Erro ao verificar sessão' 
      };
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return { success: false, error: 'Erro ao verificar sessão' };
    }
  }
};
