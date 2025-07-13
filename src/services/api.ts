import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper function to safely access localStorage (avoid SSR issues)
const getLocalStorage = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

const setLocalStorage = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

const removeLocalStorage = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add timeout to prevent hanging requests
  timeout: 10000,
  // Enable credentials for CORS
  withCredentials: true
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = getLocalStorage('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeLocalStorage('token');
      removeLocalStorage('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      const data = response.data;
      if (data.token) {
        setLocalStorage('token', data.token);
        setLocalStorage('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      console.error("Registration error:", error);
      
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          message: 'Connection timeout. Please check your internet connection.'
        };
      }
      
      if (!error.response) {
        return {
          success: false,
          message: 'Network error. Please check if the server is running.'
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  },
  
  login: async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', { email, password: '********' });
      console.log('API URL:', API_URL);
      
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response received:', response.status);
      
      const data = response.data;
      if (data.token) {
        setLocalStorage('token', data.token);
        setLocalStorage('user', JSON.stringify(data.user));
        console.log('User authenticated successfully');
      }
      return data;
    } catch (error) {
      console.error("Login error details:", error);
      
      // Network or connection errors
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          message: 'Connection timeout. Please check your internet connection.'
        };
      }
      
      if (!error.response) {
        return {
          success: false,
          message: 'Network error. Please check if the server is running.'
        };
      }
      
      // Server responded with error
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  },
  
  logout: () => {
    removeLocalStorage('token');
    removeLocalStorage('user');
  },
  
  getCurrentUser: () => {
    const userStr = getLocalStorage('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
        return null;
      }
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
    try {
      const response = await api.post('/subscriptions', { productId, notifyAt });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Subscription error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to subscribe'
      };
    }
  },
  
  updateSubscription: async (id: string, notifyAt: number) => {
    try {
      const response = await api.put(`/subscriptions/${id}`, { notifyAt });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Update subscription error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update subscription'
      };
    }
  },
  
  unsubscribe: async (id: string) => {
    try {
      const response = await api.delete(`/subscriptions/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Unsubscribe error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to unsubscribe'
      };
    }
  }
};

// Cart services
export const cartService = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },
  
  addToCart: async (productId: string, quantity: number = 1) => {
    try {
      // Make sure quantity is a positive integer
      const validQuantity = Math.max(1, Math.floor(Number(quantity)));
      
      const response = await api.post('/cart', { 
        productId, 
        quantity: validQuantity 
      });
      
      return {
        success: true,
        data: response.data.data || response.data,
        stockWarning: response.data.stockWarning || { isLowStock: false, isOutOfStock: false }
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Handle 400 error from server
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to add to cart',
        stockWarning: { isLowStock: false, isOutOfStock: false }
      };
    }
  },
  
  updateCartItem: async (productId: string, quantity: number) => {
    try {
      const response = await api.put(`/cart/${productId}`, { quantity });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating cart:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update cart'
      };
    }
  },
  
  removeFromCart: async (productId: string) => {
    try {
      const response = await api.delete(`/cart/${productId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to remove item from cart'
      };
    }
  },
  
  clearCart: async () => {
    try {
      const response = await api.delete('/cart');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to clear cart'
      };
    }
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

// Order services
export const orderService = {
  getAllOrders: async () => {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch orders'
      };
    }
  },
  
  getOrder: async (id: string) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch order'
      };
    }
  },
  
  createOrder: async (orderData: {
    deliveryAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    phoneNumber: string;
    items?: { product: string; quantity: number }[];
  }) => {
    try {
      const response = await api.post('/orders', orderData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create order'
      };
    }
  },
  
  updateOrderStatus: async (id: string, status: string, note?: string) => {
    try {
      const response = await api.patch(`/orders/${id}/status`, { status, note });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update order status'
      };
    }
  },
  
  deleteOrder: async (id: string) => {
    try {
      const response = await api.delete(`/orders/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error deleting order:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete order'
      };
    }
  }
};

export default api; 