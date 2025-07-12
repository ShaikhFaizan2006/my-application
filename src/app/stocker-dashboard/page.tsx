'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  Package,
  TrendingUp,
  BarChart3,
  LogOut,
  Download,
  Plus,
  Edit,
  Trash2,
  Phone,
  MessageSquare,
  MapPin,
  Users,
  ShoppingCart,
  AlertTriangle,
  Menu,
  X,
  User,
  ChevronRight,
  Info,
} from 'lucide-react';
import { productService } from '@/services/api';
import socketService from '@/services/socket';
import { useNotifications } from '@/context/NotificationContext';

const StockAlertPro = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [criticalStockItems, setCriticalStockItems] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'inventory', label: 'Manage Inventory', icon: Package },
    { id: 'tracking', label: 'Real-Time Tracking', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics and Reports', icon: BarChart3 },
    { id: 'logout', label: 'Logout', icon: LogOut },
  ];

  // Fetch products and critical stock items on component mount
  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        const response = await productService.getAllProducts();
        if (response.success) {
          const allProducts = response.data;
          setProducts(allProducts);
          
          // Filter critical stock items (stock <= 5)
          const criticalItems = allProducts.filter(product => product.stock <= 5);
          setCriticalStockItems(criticalItems);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        addNotification('Failed to fetch products', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();

    // Connect to socket for real-time updates
    socketService.connect();
    
    // Listen for product updates
    socketService.on('product_update', (data) => {
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product._id === data.productId ? { ...product, ...data.updates } : product
        )
      );
      
      // Update critical stock items
      setCriticalStockItems(prevItems => {
        const updatedItems = prevItems.map(item => 
          item._id === data.productId ? { ...item, ...data.updates } : item
        );
        
        // Re-filter based on updated stock
        return updatedItems.filter(item => item.stock <= 5);
      });
    });

    // Listen for restock request responses from admin
    socketService.on('restock_response', (data) => {
      const { productId, approved, message } = data;
      
      // Update restock requests list
      setRestockRequests(prev => prev.filter(req => req.productId !== productId));
      
      // Notify stocker about the response
      addNotification(
        approved 
          ? `Restock request for ${data.productName} was approved!` 
          : `Restock request for ${data.productName} was denied: ${message}`,
        approved ? 'success' : 'error'
      );
    });
    
    return () => {
      // Cleanup socket listeners
      socketService.off('product_update', () => {});
      socketService.off('restock_response', () => {});
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const router = useRouter();

  const handleLogout = () => {
     // Clear authentication data
     localStorage.removeItem('token');
     localStorage.removeItem('user');
     // Redirect to signin page
     router.push("/signin");
  };

  // Handle restock request
  const handleRestockRequest = (product) => {
    // Add to pending requests
    setRestockRequests(prev => [...prev, {
      productId: product._id,
      productName: product.name,
      currentStock: product.stock,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    }]);
    
    // Send restock request to admin via socket
    socketService.emit('restock_request', {
      productId: product._id,
      productName: product.name,
      category: product.category,
      currentStock: product.stock,
      requestedBy: {
        id: localStorage.getItem('userId'),
        name: localStorage.getItem('userName') || 'Stocker'
      }
    });
    
    // Show notification
    addNotification(`Restock request sent for ${product.name}`, 'info');
  };

  // Handle opening edit product modal
  const openEditProductModal = (product) => {
    setEditingProduct({
      ...product,
      price: product.price.toString(),
      stock: product.stock.toString(),
      lowStockThreshold: (product.lowStockThreshold || 5).toString()
    });
    setShowEditProductModal(true);
  };

  // Handle updating a product
  const handleUpdateProduct = async () => {
    // Validate form
    if (!editingProduct.name || !editingProduct.category || !editingProduct.price || !editingProduct.stock) {
      addNotification('Failed to update: Missing required fields', 'error');
      return;
    }
    
    try {
      const productData = {
        ...editingProduct,
        price: parseFloat(editingProduct.price),
        stock: parseInt(editingProduct.stock),
        lowStockThreshold: parseInt(editingProduct.lowStockThreshold)
      };
      
      const response = await productService.updateProduct(editingProduct._id, productData);
      
      if (response.success) {
        // Update product in state
        setProducts(prev => 
          prev.map(p => p._id === editingProduct._id ? response.data : p)
        );
        
        // Update critical stock items if needed
        setCriticalStockItems(prev => {
          const wasInList = prev.some(p => p._id === editingProduct._id);
          const shouldBeInList = productData.stock <= 5;
          
          if (wasInList && !shouldBeInList) {
            return prev.filter(p => p._id !== editingProduct._id);
          } else if (!wasInList && shouldBeInList) {
            return [...prev, response.data];
          } else if (wasInList && shouldBeInList) {
            return prev.map(p => p._id === editingProduct._id ? response.data : p);
          }
          
          return prev;
        });
        
        // Notify all clients about product update
        socketService.notifyProductUpdate({
          productId: editingProduct._id,
          updates: response.data
        });
        
        // Show success notification
        addNotification(`Product "${productData.name}" updated successfully`, 'success');
        
        // Close modal
        setShowEditProductModal(false);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      addNotification('Failed to update product', 'error');
    }
  };

  // Header component for the top navigation bar
  const Header = ({ onMenuClick }: { onMenuClick: () => void }) => (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
            {/* Left side: Hamburger (mobile) and Logo */}
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Package className="text-white" size={16} />
                    </div>
                    <span className="text-xl font-bold text-gray-900">Stock Alert Pro</span>
                </div>
            </div>

            {/* Right side: User Icon */}
            <div className="flex items-center gap-4">
                <button className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-100">
                    <User size={20} className="text-gray-600" />
                </button>
            </div>
        </div>
    </header>
  );

  // Sidebar component for navigation links
  const Sidebar = () => (
    <aside className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out`}>
    <div className="p-4">
      <div className="flex items-center justify-between mb-6 lg:hidden">
        <span className="text-lg font-semibold text-gray-800">Menu</span>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'logout') {
                  handleLogout();
                } else {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  </aside>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Home className="text-blue-600" size={20} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <select className="px-4 py-2 border rounded-lg bg-white text-gray-700">
            <option>July</option>
          </select>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
            <Download size={16} />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      <div className="bg-blue-600 rounded-2xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg"><ShoppingCart size={20} className="text-blue-600"/></div>
              <span className="text-sm text-gray-600">Total Products</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">100</div>
            <div className="text-sm text-green-500 font-medium">+12%</div>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg"><AlertTriangle size={20} className="text-orange-600"/></div>
              <span className="text-sm text-gray-600">Low Stock Items</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">16</div>
            <div className="text-sm text-red-500 font-medium">+25%</div>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg"><Users size={20} className="text-green-600"/></div>
              <span className="text-sm text-gray-600">Active Stockers</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">8</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-xl p-6 text-gray-900">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-semibold">Total Value</h3>
                    <p className="text-4xl font-bold text-gray-900 mt-2">$202K</p>
                </div>
                <select className="bg-gray-100 px-3 py-1 rounded-lg text-gray-700 text-sm border">
                    <option>July</option>
                </select>
            </div>
            <div className="h-40 flex items-end gap-2">
              {[40, 55, 45, 60, 50, 65, 70, 60, 75, 80, 70, 85].map((height, i) => (
                <div key={i} className="bg-green-400 rounded-t w-full" style={{ height: `${height}%` }}></div>
              ))}
            </div>
             <button className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-semibold mt-4 flex items-center gap-1">
                More Insights <ChevronRight size={16} />
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl p-6 text-gray-900">
              <h3 className="text-lg font-semibold mb-2">Need more stats?</h3>
              <p className="text-sm text-gray-600 mb-4">Upgrade to pro for added benefits</p>
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors w-full text-center">
                Go Pro Now
              </button>
            </div>
            <div className="bg-white rounded-xl p-6 text-gray-900">
              <h3 className="text-lg font-semibold mb-4">Sales breakdown</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Electronics 50%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Accessories 35%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Fashion 15%</span>
                  </div>
                </div>
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-yellow-500" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" strokeDasharray="15, 100" />
                    <path className="text-green-500" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" strokeDasharray="35, 100" strokeDashoffset="-15" />
                    <path className="text-blue-500" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" strokeDasharray="50, 100" strokeDashoffset="-50" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="text-blue-600" size={20} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Overview</h1>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Restock Requests Section */}
      {restockRequests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <Info className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-blue-800">Pending Restock Requests</h3>
          </div>
          <div className="space-y-3">
            {restockRequests.map((request) => (
              <div key={request.productId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white p-3 rounded-lg shadow-sm">
                <div>
                  <h4 className="font-semibold text-gray-800">{request.productName}</h4>
                  <p className="text-sm text-gray-600">Requested at: {new Date(request.requestedAt).toLocaleTimeString()}</p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  Pending approval
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-red-100 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-600" size={24} />
          <h3 className="text-lg font-semibold text-red-800">Critical Stock Alerts</h3>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">Loading stock alerts...</p>
            </div>
          ) : criticalStockItems.length > 0 ? (
            criticalStockItems.map((product) => (
              <div key={product._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white p-3 rounded-lg shadow-sm">
                <div>
                  <h4 className="font-semibold text-gray-800">{product.name}</h4>
                  <p className="text-sm text-gray-600">{product.category} - Stock: {product.stock}</p>
                </div>
                <button 
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  onClick={() => handleRestockRequest(product)}
                  disabled={restockRequests.some(req => req.productId === product._id)}
                >
                  {restockRequests.some(req => req.productId === product._id) ? 'Request Sent' : 'Restock Now'}
                </button>
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-sm text-gray-500">No critical stock items at the moment</p>
          )}
        </div>
      </div>

      <div className="bg-blue-600 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-1">All Products</h3>
        <p className="text-blue-200 mb-6">Manage your entire product inventory</p>
        
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 bg-white rounded-xl">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : (
            products.map((product) => (
              <div key={product._id} className="bg-white rounded-xl p-4 text-gray-900">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">{product.name}</h4>
                    <p className="text-gray-600 text-sm">{product.category} - ${product.price}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                      product.stock > 10 ? 'bg-green-500' :
                      product.stock > 5 ? 'bg-yellow-500' :
                      product.stock > 0 ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}>
                      {product.stock > 10 ? 'In Stock' :
                       product.stock > 5 ? 'Low Stock' :
                       product.stock > 0 ? 'Critical' :
                       'Out of Stock'}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        onClick={() => openEditProductModal(product)}
                      >
                        <Edit size={16} />
                      </button>
                      {product.stock <= 5 && !restockRequests.some(req => req.productId === product._id) && (
                        <button 
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          onClick={() => handleRestockRequest(product)}
                        >
                          <Plus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderTracking = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <TrendingUp className="text-blue-600" size={20} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Real-Time Tracking</h1>
      </div>

      <div className="bg-blue-600 rounded-2xl p-6 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 text-gray-900">
                <h3 className="text-xl font-bold mb-2">Add New Package</h3>
                <p className="text-gray-600 mb-4 text-sm">Fill out the form and create a new package</p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter Tracking Number"
                    className="w-full px-4 py-3 rounded-lg bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 text-gray-900">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-600 text-sm">Tracking number</h4>
                    <p className="text-lg font-bold">KG346B37IP89VB3</p>
                  </div>
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">In Transit</span>
                </div>
                <div className="relative flex justify-between items-center my-6">
                    <div className="absolute w-full h-0.5 bg-gray-200"></div>
                    <div className="absolute w-1/2 h-0.5 bg-blue-500"></div>
                    <div className="relative w-4 h-4 bg-blue-500 rounded-full"></div>
                    <div className="relative w-4 h-4 bg-blue-500 rounded-full"></div>
                    <div className="relative w-4 h-4 bg-gray-200 rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Departure</p>
                    <p className="font-semibold">10.07.25, 16:40 PM</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Arrival</p>
                    <p className="font-semibold">12.07.25, 12:40 PM</p>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4 grid grid-cols-3 gap-4 text-sm">
                   <div>
                     <p className="text-gray-500">Delivery Person</p>
                     <p className="font-semibold">John Green</p>
                   </div>
                   <div>
                     <p className="text-gray-500">Description</p>
                     <p className="font-semibold">Electronics</p>
                   </div>
                   <div>
                     <p className="text-gray-500">Weight</p>
                     <p className="font-semibold">25.4kg</p>
                   </div>
                </div>
                <div className="flex items-center gap-4 mt-4 border-t border-gray-200 pt-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-blue-600">JG</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">John Green</p>
                    <p className="text-xs text-gray-500">Delivery Person</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Phone size={16} />
                    </button>
                    <button className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </div>
              </div>
          </div>
          <div className="bg-white rounded-xl p-2 h-full min-h-[300px] lg:min-h-0">
            {/* Placeholder for map */}
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <MapPin size={40} className="mx-auto mb-2" />
                    <p className="font-semibold">Map View</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="text-blue-600" size={20} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics and Reports</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <select className="px-4 py-2 border rounded-lg bg-white text-gray-700">
            <option>July</option>
          </select>
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
            <Download size={16} />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      <div className="bg-blue-600 rounded-2xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg"><ShoppingCart size={20} className="text-blue-600"/></div>
                <span className="text-sm text-gray-600">Total Products</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">100</div>
                <div className="text-sm text-green-500 font-medium">+12%</div>
            </div>
            <div className="bg-white rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg"><AlertTriangle size={20} className="text-orange-600"/></div>
                <span className="text-sm text-gray-600">Low Stock Items</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">16</div>
                <div className="text-sm text-red-500 font-medium">+25%</div>
            </div>
            <div className="bg-white rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg"><Users size={20} className="text-green-600"/></div>
                <span className="text-sm text-gray-600">Active Stockers</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">8</div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Category Analytics</h3>
            {[
              { name: 'Electronics', products: 45, lowStock: 5, outOfStock: 2, value: '$128,000', health: 78 },
              { name: 'Fashion', products: 32, lowStock: 3, outOfStock: 1, value: '$45,000', health: 88 },
              { name: 'Accessories', products: 28, lowStock: 5, outOfStock: 0, value: '$32,000', health: 82 },
            ].map((category, index) => (
              <div key={index} className="bg-white rounded-xl p-4 text-gray-900">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold">{category.name}</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
                      <div><p className="text-gray-500">Total Products</p><p className="font-bold">{category.products}</p></div>
                      <div><p className="text-gray-500">Low Stock</p><p className="font-bold text-yellow-600">{category.lowStock}</p></div>
                      <div><p className="text-gray-500">Out of Stock</p><p className="font-bold text-red-600">{category.outOfStock}</p></div>
                      <div><p className="text-gray-500">Total Value</p><p className="font-bold text-green-600">{category.value}</p></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="relative w-20 h-20">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path className="text-gray-200" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className={`${category.health >= 85 ? 'text-green-500' : category.health >= 75 ? 'text-blue-500' : 'text-yellow-500'}`} strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" strokeDasharray={`${category.health}, 100`} transform="rotate(-90 18 18)" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">{category.health}%</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-semibold">Healthy Stock</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-6 text-gray-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Customer Growth</h3>
              <select className="bg-gray-100 px-3 py-1 rounded-lg text-gray-700 text-sm border">
                <option>2024</option>
              </select>
            </div>
            <div className="space-y-3">
              {[
                { month: 'Jan', men: 200, women: 150, new: 50 },
                { month: 'Feb', men: 180, women: 170, new: 60 },
                { month: 'Mar', men: 220, women: 190, new: 70 },
                { month: 'Apr', men: 240, women: 200, new: 80 },
                { month: 'May', men: 260, women: 220, new: 90 },
                { month: 'Jun', men: 280, women: 240, new: 100 },
              ].map((data, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 text-xs text-gray-600 font-medium">{data.month}</div>
                  <div className="flex-1 flex h-4 rounded-full overflow-hidden bg-gray-200">
                    <div className="bg-blue-500" style={{ width: `${(data.men / 540) * 100}%` }}></div>
                    <div className="bg-cyan-400" style={{ width: `${(data.women / 540) * 100}%` }}></div>
                    <div className="bg-gray-400" style={{ width: `${(data.new / 540) * 100}%` }}></div>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs pt-4 border-t border-gray-200 mt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div><span>Men</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-cyan-400 rounded-full"></div><span>Women</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-400 rounded-full"></div><span>New Customer</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'inventory': return renderInventory();
      case 'tracking': return renderTracking();
      case 'analytics': return renderAnalytics();
      case 'logout' : handleLogout();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <Header onMenuClick={toggleMobileMenu} />
      <div className="flex flex-1 overflow-hidden">
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-20 bg-black bg-opacity-50" onClick={toggleMobileMenu} />
        )}
        <Sidebar />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      
      {/* Edit Product Modal */}
      {showEditProductModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Edit Product</h3>
              <button 
                onClick={() => setShowEditProductModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={editingProduct.name}
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Contact admin to change product name</p>
              </div>
              
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  id="category"
                  value={editingProduct.category}
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                  disabled
                />
              </div>
              
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  id="price"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  step="0.01"
                />
              </div>
              
              {/* Stock */}
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Stock *
                </label>
                <input
                  type="number"
                  id="stock"
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
              
              {/* Low Stock Threshold */}
              <div>
                <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-1">
                  Low Stock Threshold *
                </label>
                <input
                  type="number"
                  id="threshold"
                  value={editingProduct.lowStockThreshold}
                  onChange={(e) => setEditingProduct({...editingProduct, lowStockThreshold: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Alerts will be sent when stock falls below this level</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setShowEditProductModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                Update Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlertPro;