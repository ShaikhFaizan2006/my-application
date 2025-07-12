import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }
};

// Product services
export const productService = {
  getAllProducts: async () => {
    const response = await api.get('/products');
    return response.data;
  },
  
  getProduct: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  getLowStockProducts: async () => {
    const response = await api.get('/products/lowstock');
    return response.data;
  },
  
  getOutOfStockProducts: async () => {
    const response = await api.get('/products/outofstock');
    return response.data;
  },
  
  createProduct: async (productData: any) => {
    const response = await api.post('/products', productData);
    return response.data;
  },
  
  updateProduct: async (id: string, productData: any) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },
  
  deleteProduct: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  }
};

// Subscription services
export const subscriptionService = {
  getUserSubscriptions: async () => {
    const response = await api.get('/subscriptions');
    return response.data;
  },
  
  getSubscriptionAlerts: async () => {
    const response = await api.get('/subscriptions/alerts');
    return response.data;
  },
  
  subscribe: async (productId: string, notifyAt: number = 5) => {
    const response = await api.post('/subscriptions', { productId, notifyAt });
    return response.data;
  },
  
  updateSubscription: async (id: string, notifyAt: number) => {
    const response = await api.put(`/subscriptions/${id}`, { notifyAt });
    return response.data;
  },
  
  unsubscribe: async (id: string) => {
    const response = await api.delete(`/subscriptions/${id}`);
    return response.data;
  }
};

// Cart services
export const cartService = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },
  
  addToCart: async (productId: string, quantity: number = 1) => {
    const response = await api.post('/cart', { productId, quantity });
    return response.data;
  },
  
  updateCartItem: async (productId: string, quantity: number) => {
    const response = await api.put(`/cart/${productId}`, { quantity });
    return response.data;
  },
  
  removeCartItem: async (productId: string) => {
    const response = await api.delete(`/cart/${productId}`);
    return response.data;
  },
  
  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  }
};

// User services
export const userService = {
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  getStockers: async () => {
    const response = await api.get('/users/stockers');
    return response.data;
  },
  
  getCustomers: async () => {
    const response = await api.get('/users/customers');
    return response.data;
  },
  
  updateUserRole: async (userId: string, role: 'customer' | 'stocker' | 'admin') => {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data;
  },
  
  deleteUser: async (userId: string) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
};

export default api; 