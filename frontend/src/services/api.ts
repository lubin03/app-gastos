import { notifyDataSync, SyncDomain } from './dataSync';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function inferDomainsFromEndpoint(endpoint: string): SyncDomain[] {
  const clean = endpoint.toLowerCase();
  if (clean.includes('/transactions')) {
    return ['transactions', 'accounts', 'creditCards'];
  }
  if (clean.includes('/accounts')) {
    return ['accounts', 'transactions', 'creditCards'];
  }
  if (clean.includes('/credit-cards')) {
    return ['creditCards', 'accounts', 'transactions'];
  }
  if (clean.includes('/budgets')) {
    return ['budgets', 'transactions'];
  }
  if (clean.includes('/goals')) {
    return ['goals', 'accounts'];
  }
  if (clean.includes('/categories')) {
    return ['categories', 'transactions', 'budgets'];
  }
  return ['all'];
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
    if (response.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }

    let message = 'API Error';
    try {
      const errorData = await response.json();
      message = errorData.error || message;
    } catch (e) {
      // Ignored
    }
    throw new ApiError(message, response.status);
  }

  // Auto-broadcast data sync on successful mutations
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const domains = inferDomainsFromEndpoint(endpoint);
    notifyDataSync(domains);
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
  
  patch: (endpoint: string, data?: any, options?: RequestInit) => 
    fetchWithAuth(endpoint, { ...options, method: 'PATCH', body: data !== undefined ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined }),
  
  delete: (endpoint: string, options?: RequestInit) => 
    fetchWithAuth(endpoint, { ...options, method: 'DELETE' }),
};

export { notifyDataSync, useDataSync } from './dataSync';

