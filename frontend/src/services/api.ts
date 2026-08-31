export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body instanceof FormData) {
    headers.delete('Content-Type');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = 'API Error';
    try {
      const errorData = await response.json();
      message = errorData.error || message;
    } catch (e) {
      // Ignored
    }
    throw new ApiError(message, response.status);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (endpoint: string, options?: RequestInit) => 
    fetchWithAuth(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint: string, data: any, options?: RequestInit) => 
    fetchWithAuth(endpoint, { ...options, method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),
  
  put: (endpoint: string, data: any, options?: RequestInit) => 
    fetchWithAuth(endpoint, { ...options, method: 'PUT', body: data instanceof FormData ? data : JSON.stringify(data) }),
  
  delete: (endpoint: string, options?: RequestInit) => 
    fetchWithAuth(endpoint, { ...options, method: 'DELETE' }),
};
