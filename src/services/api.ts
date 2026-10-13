/**
 * Central API Client for Outils Réparation GSM Tunisie
 * Performs real asynchronous HTTP requests to Express Backend endpoints
 */

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  user?: any;
  token?: string;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore?: boolean;
  };
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Dual guarantee: If token is stored locally, always send Bearer header
  // in case the browser blocks third-party iframe cookies
  try {
    const localToken = localStorage.getItem('gsm_token');
    if (localToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${localToken}`);
    }
  } catch {
    // localStorage might fail in restricted iframe sandbox
  }

  // دمج رابط الـ Backend تلقائياً بناءً على متغير البيئة في Vercel أو المحلي
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Includes HttpOnly JWT cookie automatically
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Erreur serveur (${response.status})`;
    const err = new Error(errorMsg) as any;
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Products
  products: {
    getAll: (params: Record<string, any> = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const query = searchParams.toString();
      return request<ApiResponse<any[]>>(`/api/products${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => request<ApiResponse<any>>(`/api/products/${id}`),
    getBySlug: (slug: string) => request<ApiResponse<any>>(`/api/products/slug/${slug}`),
    create: (productData: any) =>
      request<ApiResponse<any>>('/api/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      }),
    update: (id: string, productData: any) =>
      request<ApiResponse<any>>(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      }),
    delete: (id: string) =>
      request<ApiResponse<any> & { softDeleted?: boolean; deleted?: boolean }>(`/api/products/${id}`, {
        method: 'DELETE',
      }),
    patchStatus: (id: string, isActive?: boolean) =>
      request<ApiResponse<any>>(`/api/products/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    toggleActive: (id: string, isActive?: boolean) =>
      request<ApiResponse<any>>(`/api/products/${id}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    patchStock: (id: string, stock: number) =>
      request<ApiResponse<any>>(`/api/products/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock }),
      }),
    uploadImage: (id: string, file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return request<ApiResponse<any>>(`/api/products/${id}/images`, {
        method: 'POST',
        body: formData,
      });
    },
    deleteImage: (id: string, imageId: string) =>
      request<ApiResponse<any>>(`/api/products/${id}/images/${encodeURIComponent(imageId)}`, {
        method: 'DELETE',
      }),
  },

  // Store Settings
  settings: {
    get: () => request<ApiResponse<any>>('/api/settings'),
    update: (data: any) =>
      request<ApiResponse<any>>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    uploadLogo: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return request<ApiResponse<any>>('/api/settings/logo', {
        method: 'POST',
        body: formData,
      });
    },
    uploadFavicon: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return request<ApiResponse<any>>('/api/settings/favicon', {
        method: 'POST',
        body: formData,
      });
    },
  },

  // Categories
  categories: {
    getAll: () => request<ApiResponse<any[]>>('/api/categories'),
    create: (data: any) =>
      request<ApiResponse<any>>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<ApiResponse<any>>(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<ApiResponse<any>>(`/api/categories/${id}`, {
        method: 'DELETE',
      }),
  },

  // Orders
  orders: {
    create: (orderData: any) =>
      request<ApiResponse<any>>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      }),
    getById: (id: string) => request<ApiResponse<any>>(`/api/orders/${id}`),
    getByNumber: (orderNumber: string) =>
      request<ApiResponse<any>>(`/api/orders/number/${encodeURIComponent(orderNumber)}`),
    getAdminOrders: (params: Record<string, any> = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const query = searchParams.toString();
      return request<ApiResponse<any[]>>(`/api/orders/admin/all${query ? `?${query}` : ''}`);
    },
    getAdminStats: () => request<ApiResponse<any>>('/api/orders/admin/stats'),
    previewArchive: (fromDate: string, toDate: string) => {
      const searchParams = new URLSearchParams({ fromDate, toDate });
      return request<ApiResponse<{ count: number; fromDate: string; toDate: string }> & { count: number }>(
        `/api/orders/admin/archive/preview?${searchParams.toString()}`,
      );
    },
    exportArchive: async (fromDate: string, toDate: string) => {
      const headers = new Headers({ 'Content-Type': 'application/json' });
      try {
        const localToken = localStorage.getItem('gsm_token');
        if (localToken) headers.set('Authorization', `Bearer ${localToken}`);
      } catch {
        // The HttpOnly cookie remains available when localStorage is restricted.
      }

      const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/orders/admin/archive/export`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ fromDate, toDate }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || `Erreur serveur (${response.status})`);
      }
      return {
        data: await response.json(),
        token: response.headers.get('X-Order-Archive-Token'),
      };
    },
    archiveExported: (token: string, confirmedCount: number) =>
      request<ApiResponse<{ archivedCount: number }>>('/api/orders/admin/archive/apply', {
        method: 'POST',
        body: JSON.stringify({ token, confirmedCount }),
      }),
    getArchived: (params: Record<string, any> = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const query = searchParams.toString();
      return request<ApiResponse<any[]>>(
        `/api/orders/admin/archive/archived${query ? `?${query}` : ''}`,
      );
    },
    restoreArchived: (id: string) =>
      request<ApiResponse<any>>(`/api/orders/admin/archive/${encodeURIComponent(id)}/restore`, {
        method: 'PATCH',
      }),
    updateStatus: (id: string, status: string, paymentStatus?: string) =>
      request<ApiResponse<any>>(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, paymentStatus }),
      }),
    update: (id: string, data: {
      customerName: string;
      customerPhone: string;
      customerEmail?: string | null;
      governorate: string;
      delegation?: string | null;
      address: string;
      notes?: string | null;
      paymentMethod?: 'cod' | 'bank_transfer' | 'online';
    }) =>
      request<ApiResponse<any>>(`/api/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<ApiResponse<any>>(`/api/orders/${id}`, {
        method: 'DELETE',
      }),
  },

  // Authentication
  auth: {
    register: async (userData: any) => {
      const res = await request<ApiResponse<any>>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      if (res?.token) {
        try {
          localStorage.setItem('gsm_token', res.token);
        } catch {}
      }
      return res;
    },
    login: async (credentials: any) => {
      const res = await request<ApiResponse<any>>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (res?.token) {
        try {
          localStorage.setItem('gsm_token', res.token);
        } catch {}
      }
      return res;
    },
    firebase: async (idToken: string) => {
      const res = await request<ApiResponse<any>>('/api/auth/firebase', {
        method: 'POST',
        body: JSON.stringify({ idToken }),
      });
      if (res?.token) {
        try {
          localStorage.setItem('gsm_token', res.token);
        } catch {}
      }
      return res;
    },
    logout: async () => {
      try {
        localStorage.removeItem('gsm_token');
      } catch {}
      return request<ApiResponse<any>>('/api/auth/logout', {
        method: 'POST',
      });
    },
    getMe: () => request<ApiResponse<any>>('/api/auth/me'),
  },

  adminUsers: {
    getAll: (params: { page?: number; limit?: number; search?: string } = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') searchParams.set(key, String(val));
      });
      const query = searchParams.toString();
      return request<ApiResponse<any[]>>(
        `/api/admin/users${query ? `?${query}` : ''}`,
      );
    },
    updateRole: (id: string, role: 'ADMIN' | 'CUSTOMER') =>
      request<ApiResponse<any>>(`/api/admin/users/${encodeURIComponent(id)}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
  },

  // Reviews
  reviews: {
    create: (data: { productId: string; name: string; rating: number; comment: string }) =>
      request<ApiResponse<any>>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Upload
  upload: {
    image: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      return request<{ success: boolean; url: string; filename: string }>('/api/upload', {
        method: 'POST',
        body: formData,
      });
    },
  },

  // Health
  health: {
    check: () => request<{ status: string; database: string; environment: string }>('/api/health'),
  },
};