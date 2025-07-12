'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { User, ShoppingCart, Bell, Package, LogOut, AlertTriangle, Search, Filter, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { productService, subscriptionService, cartService, authService } from '@/services/api';
import socketService from '@/services/socket';
import { useNotifications } from '@/context/NotificationContext';
import ProductCard from './components/ProductCard';
import NotificationCenter from '@/components/NotificationCenter';

const CustomerDashboard: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'subscriptions' | 'alerts' | 'lessStock' | 'cart'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [showFilters, setShowFilters] = useState(false);
  
  const [products, setProducts] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [loading, setLoading] = useState<boolean>(true);
  
  const { addNotification } = useNotifications();

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts();
      if (response.success) {
        setProducts(response.data.map((product: any) => ({
          ...product,
          subscribed: subscriptions.some(sub => sub.product._id === product._id)
        })));
        
        // Extract categories
        const cats = Array.from(new Set(response.data.map((p: any) => p.category)));
        setCategories(['all', ...cats]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      addNotification('Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    try {
      const response = await subscriptionService.getUserSubscriptions();
      if (response.success) {
        setSubscriptions(response.data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };
  
  // Fetch cart
  const fetchCart = async () => {
    try {
      const response = await cartService.getCart();
      if (response.success) {
        setCart(response.data.items || []);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };
  
  // Initialize data
  useEffect(() => {
    const initData = async () => {
      await fetchSubscriptions();
      await fetchProducts();
      await fetchCart();
    };
    
    initData();
    
    // Connect to socket
    socketService.connect();
    
    // Listen for product updates
    socketService.on('product_update', (data) => {
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === data.productId ? { ...product, ...data.updates } : product
        )
      );
    });
    
    return () => {
      // Clean up
      socketService.off('product_update', () => {});
    };
  }, []);
  
  // Filtered products based on search, category, and sorting
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'stock':
          return b.stock - a.stock;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy]);
  
  // Products with low stock
  const lessStockItems = useMemo(() => {
    return products.filter(p => p.stock > 0 && p.stock <= 5);
  }, [products]);
  
  // Handle add to cart
  const handleAddToCart = async (productId: string, quantity: number) => {
    try {
      const response = await cartService.addToCart(productId, quantity);
      if (response.success) {
        // Update product stock
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product._id === productId 
              ? { ...product, stock: product.stock - quantity }
              : product
          )
        );
        
        // Update cart
        await fetchCart();
        
        // Notify stockers and admins about potential stock issues
        const product = products.find(p => p._id === productId);
        const newStock = product.stock - quantity;
        
        if (newStock <= product.lowStockThreshold && newStock > 0) {
          socketService.sendLowStockAlert({
            productId,
            productName: product.name,
            currentStock: newStock,
            threshold: product.lowStockThreshold
          });
        } else if (newStock === 0) {
          socketService.sendOutOfStockAlert({
            productId,
            productName: product.name
          });
        }
        
        // Notify about product update
        socketService.notifyProductUpdate({
          productId,
          updates: { stock: newStock }
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };
  
  // Handle toggle favorite
  const handleToggleFavorite = async (productId: string) => {
    // Update UI immediately for better UX
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product._id === productId 
          ? { ...product, isFavorite: !product.isFavorite }
          : product
      )
    );
    
    // In a real app, you would call an API endpoint to update the favorite status
    // For now, we'll just simulate the API call
    await new Promise(resolve => setTimeout(resolve, 300));
  };
  
  // Handle toggle subscription
  const handleToggleSubscribe = async (productId: string, subscribe: boolean) => {
    try {
      if (subscribe) {
        const response = await subscriptionService.subscribe(productId);
        if (response.success) {
          setProducts(prevProducts => 
            prevProducts.map(product => 
              product._id === productId 
                ? { ...product, subscribed: true }
                : product
            )
          );
          await fetchSubscriptions();
        }
      } else {
        // Find subscription ID
        const subscription = subscriptions.find(sub => sub.product._id === productId);
        if (subscription) {
          const response = await subscriptionService.unsubscribe(subscription._id);
          if (response.success) {
            setProducts(prevProducts => 
              prevProducts.map(product => 
                product._id === productId 
                  ? { ...product, subscribed: false }
                  : product
              )
            );
            await fetchSubscriptions();
          }
        }
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      throw error;
    }
  };
  
  // Handle remove from cart
  const handleRemoveFromCart = async (productId: string) => {
    try {
      const response = await cartService.removeCartItem(productId);
      if (response.success) {
        // Get item from cart to know quantity
        const cartItem = cart.find(item => item.product._id === productId);
        const quantity = cartItem ? cartItem.quantity : 0;
        
        // Update product stock
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product._id === productId 
              ? { ...product, stock: product.stock + quantity }
              : product
          )
        );
        
        // Update cart
        await fetchCart();
        
        // Notify about product update
        const product = products.find(p => p._id === productId);
        socketService.notifyProductUpdate({
          productId,
          updates: { stock: product.stock + quantity }
        });
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      addNotification('Failed to remove item from cart', 'error');
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    // Disconnect socket
    socketService.disconnect();
    
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to signin page
    router.push('/signin');
  };

  // Calculate cart total
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  }, [cart]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Stock Alert Pro</span>
          </div>
          <div className="flex items-center space-x-3">
            <NotificationCenter />
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-700" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="text-sm font-medium text-gray-900 mb-3">Dashboard</div>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'products'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Package className="h-5 w-5" />
                  <span>Browse Products</span>
                </button>
                <button
                  onClick={() => setActiveTab('subscriptions')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'subscriptions'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Bell className="h-5 w-5" />
                  <span>My Subscriptions ({subscriptions.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('cart')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'cart'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Shopping Cart ({cart.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('lessStock')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'lessStock'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                  <span>Low Stock ({lessStockItems.length})</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Products</h2>
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                      >
                        <Filter className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Filters */}
                  {showFilters && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4 flex flex-wrap gap-3 items-center">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sort By
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="name">Name</option>
                          <option value="price">Price (Low to High)</option>
                          <option value="stock">Stock (High to Low)</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedCategory('all');
                          setSortBy('name');
                          setShowFilters(false);
                        }}
                        className="ml-auto bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm flex items-center"
                      >
                        <X className="h-4 w-4 mr-1" /> Clear Filters
                      </button>
                    </div>
                  )}

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
                      <p className="mt-3 text-gray-600">Loading products...</p>
                    </div>
                  ) : (
                    <>
                      {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {filteredProducts.map((product) => (
                            <ProductCard
                              key={product._id}
                              product={product}
                              onAddToCart={handleAddToCart}
                              onToggleFavorite={handleToggleFavorite}
                              onToggleSubscribe={handleToggleSubscribe}
                              refreshProducts={fetchProducts}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No products found matching your criteria.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">My Subscriptions</h2>
                {subscriptions.length > 0 ? (
                  <div className="space-y-3">
                    {subscriptions.map((subscription) => (
                      <div key={subscription._id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                              {subscription.product.image || '📦'}
                            </div>
                            <div>
                              <h3 className="font-medium">{subscription.product.name}</h3>
                              <p className="text-sm text-gray-500">{subscription.product.category}</p>
                              <div className="flex items-center mt-1">
                                <p className="text-sm mr-3">
                                  <span className="font-medium">Stock:</span>{' '}
                                  <span className={`${subscription.product.stock <= 5 ? 'text-red-500 font-bold' : ''}`}>
                                    {subscription.product.stock}
                                  </span>
                                </p>
                                <p className="text-sm">
                                  <span className="font-medium">Alert at:</span> {subscription.notifyAt}
                                </p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleSubscribe(subscription.product._id, false)}
                            className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm hover:bg-red-200"
                          >
                            Unsubscribe
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">You haven't subscribed to any products yet.</p>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                    >
                      Browse Products
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cart Tab */}
            {activeTab === 'cart' && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shopping Cart</h2>
                {cart.length > 0 ? (
                  <div>
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.product._id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                                {item.product.image || '📦'}
                              </div>
                              <div>
                                <h3 className="font-medium">{item.product.name}</h3>
                                <div className="flex items-center mt-1">
                                  <p className="text-sm font-medium">${item.product.price} x {item.quantity}</p>
                                  <p className="text-sm font-bold ml-3">
                                    ${(item.product.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCart(item.product._id)}
                              className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm hover:bg-red-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
                      </div>
                      <button
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 w-full"
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Your cart is empty.</p>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                    >
                      Browse Products
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Low Stock Items Tab */}
            {activeTab === 'lessStock' && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Items</h2>
                {lessStockItems.length > 0 ? (
                  <div className="space-y-3">
                    {lessStockItems.map((product) => (
                      <div key={product._id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                              {product.image || '📦'}
                            </div>
                            <div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-gray-500">{product.category}</p>
                              <div className="flex items-center mt-1">
                                <p className="text-sm">
                                  <span className="font-medium">Stock:</span>{' '}
                                  <span className="text-red-500 font-bold">{product.stock}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleToggleSubscribe(product._id, !product.subscribed)}
                              className={`px-3 py-1 rounded-lg text-sm ${
                                product.subscribed
                                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {product.subscribed ? 'Subscribed' : 'Subscribe'}
                            </button>
                            <button
                              onClick={() => handleAddToCart(product._id, 1)}
                              className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
                              disabled={product.stock === 0}
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No low stock items found.</p>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                    >
                      Browse Products
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;