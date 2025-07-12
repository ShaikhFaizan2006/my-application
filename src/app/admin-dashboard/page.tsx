"use client";

import React, { useState, useEffect } from 'react';
import {
  Home,
  Package,
  Users,
  BarChart3,
  LogOut,
  ShoppingCart,
  AlertCircle,
  UserPlus,
  Download,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  Menu,
  X,
  User,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import socketService from '@/services/socket';
import { productService, userService } from '@/services/api';
import { useNotifications } from '@/context/NotificationContext';
import { authService } from '@/services/api';

const StockAlertPro = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('July');
  const [products, setProducts] = useState([]);
  const [criticalStockItems, setCriticalStockItems] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState(10);
  const { addNotification } = useNotifications();
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Electronics',
    price: '',
    stock: '',
    description: '',
    lowStockThreshold: '5',
  });
  const [showStockerModal, setShowStockerModal] = useState(false);
  const [newStocker, setNewStocker] = useState({
    name: '',
    email: '',
    password: '',
    category: 'Electronics',
    active: true
  });
  const [dashboardData, setDashboardData] = useState({
    monthlyValues: [150000, 165000, 155000, 175000, 190000, 202000], // Last 6 months values
    totalValue: 202000,
    salesData: [
      { category: 'Electronics', percentage: 50, color: 'blue' },
      { category: 'Home', percentage: 25, color: 'green' }, 
      { category: 'Fashion', percentage: 15, color: 'yellow' },
      { category: 'Accessories', percentage: 10, color: 'red' }
    ]
  });
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [stockers, setStockers] = useState([]);
  const [showDeleteStockerConfirmation, setShowDeleteStockerConfirmation] = useState(false);
  const [stockerToDelete, setStockerToDelete] = useState(null);

  const dashboardStats = {
    totalProducts: 100,
    lowStockItems: 16,
    activeStockers: 8,
    totalValue: 202000
  };

  const salesBreakdown = [
    { category: 'Electronics', percentage: 50, color: 'blue' },
    { category: 'Home', percentage: 25, color: 'green' }, 
    { category: 'Fashion', percentage: 15, color: 'yellow' },
    { category: 'Accessories', percentage: 10, color: 'red' }
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'inventory', label: 'Manage Inventory', icon: Package },
    { id: 'stockers', label: 'Manage Stockers', icon: Users },
    { id: 'analytics', label: 'Analytics and Reports', icon: BarChart3 },
    { id: 'logout', label: 'Logout', icon: LogOut }
  ];

  // Fetch products and restock requests on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch products
        const response = await productService.getAllProducts();
        if (response.success) {
          const allProducts = response.data;
          setProducts(allProducts);
          
          // Filter critical stock items (stock <= 5)
          const criticalItems = allProducts.filter(product => product.stock <= 5);
          setCriticalStockItems(criticalItems);
          
          // Update dashboard stats
          dashboardStats.totalProducts = allProducts.length;
          dashboardStats.lowStockItems = criticalItems.length;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        addNotification('Failed to fetch data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Connect to socket for real-time updates
    socketService.connect();
    
    // Listen for restock requests from stockers
    socketService.on('restock_request', (data) => {
      setRestockRequests(prev => [
        { 
          ...data, 
          requestedAt: new Date().toISOString(),
          status: 'pending'
        }, 
        ...prev
      ]);
      
      // Show notification
      addNotification(`New restock request for ${data.productName}`, 'info');
    });
    
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
    
    return () => {
      // Cleanup socket listeners
      socketService.off('restock_request', () => {});
      socketService.off('product_update', () => {});
    };
  }, []);

  // Update dashboardData whenever products change
  useEffect(() => {
    if (products.length > 0) {
      // Calculate total value
      const totalValue = products.reduce((sum, product) => {
        return sum + (product.price * product.stock);
      }, 0);
      
      // Calculate category percentages
      const categoryTotals = {};
      let overallTotal = 0;
      
      products.forEach(product => {
        const categoryValue = product.price * product.stock;
        overallTotal += categoryValue;
        
        if (categoryTotals[product.category]) {
          categoryTotals[product.category] += categoryValue;
        } else {
          categoryTotals[product.category] = categoryValue;
        }
      });
      
      const salesData = Object.keys(categoryTotals).map((category, index) => {
        const percentage = Math.round((categoryTotals[category] / overallTotal) * 100);
        const colors = ['blue', 'green', 'yellow', 'red', 'purple', 'indigo'];
        return {
          category,
          percentage,
          color: colors[index % colors.length]
        };
      }).sort((a, b) => b.percentage - a.percentage); // Sort by highest percentage first
      
      // Update dashboard data
      setDashboardData(prev => ({
        ...prev,
        totalValue,
        salesData
      }));
      
      // Update dashboard stats
      dashboardStats.totalValue = totalValue;
    }
  }, [products]);

  // Add a useEffect to fetch stockers
  useEffect(() => {
    const fetchStockers = async () => {
      try {
        setLoading(true);
        const response = await userService.getStockers();
        if (response.success) {
          setStockers(response.data);
          dashboardStats.activeStockers = response.data.filter(s => s.active).length;
        }
      } catch (error) {
        console.error('Error fetching stockers:', error);
        addNotification('Failed to fetch stockers', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStockers();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to signin page
    router.push('/signin');
  };
  
  // Handle restock approval
  const handleApproveRestock = async () => {
    if (!activeRequest) return;
    
    try {
      // Update product stock in database
      const response = await productService.updateProductStock(
        activeRequest.productId, 
        restockQuantity
      );
      
      if (response.success) {
        // Send approval notification to stocker
        socketService.approveRestockRequest(activeRequest.productId, restockQuantity);
        
        // Update product in state
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product._id === activeRequest.productId 
              ? { ...product, stock: product.stock + restockQuantity }
              : product
          )
        );
        
        // Remove from critical stock if no longer critical
        setCriticalStockItems(prev => 
          prev.filter(item => {
            if (item._id === activeRequest.productId) {
              return (item.stock + restockQuantity) <= 5;
            }
            return true;
          })
        );
        
        // Remove from pending requests
        setRestockRequests(prev => 
          prev.filter(req => req.productId !== activeRequest.productId)
        );
        
        // Notify admin about successful restock
        addNotification(
          `Approved restock of ${restockQuantity} units for ${activeRequest.productName}`,
          'success'
        );
        
        // Notify all clients about product update
        socketService.notifyProductUpdate({
          productId: activeRequest.productId,
          updates: { 
            stock: products.find(p => p._id === activeRequest.productId).stock + restockQuantity 
          }
        });
        
        // Close modal
        setShowRestockModal(false);
      }
    } catch (error) {
      console.error('Error approving restock:', error);
      addNotification('Failed to approve restock request', 'error');
    }
  };
  
  // Handle restock denial
  const handleDenyRestock = () => {
    if (!activeRequest) return;
    
    // Send denial notification to stocker
    socketService.denyRestockRequest(
      activeRequest.productId, 
      'Request denied by admin'
    );
    
    // Remove from pending requests
    setRestockRequests(prev => 
      prev.filter(req => req.productId !== activeRequest.productId)
    );
    
    // Notify admin
    addNotification(
      `Denied restock request for ${activeRequest.productName}`,
      'info'
    );
    
    // Close modal
    setShowRestockModal(false);
  };

  // Handle opening restock modal
  const openRestockModal = (request) => {
    setActiveRequest(request);
    setRestockQuantity(10); // Default restock amount
    setShowRestockModal(true);
  };

  // Handle adding a new product
  const handleAddProduct = async () => {
    // Validate form
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.stock) {
      addNotification('Please fill all required fields', 'error');
      return;
    }
    
    try {
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        lowStockThreshold: parseInt(newProduct.lowStockThreshold)
      };
      
      const response = await productService.createProduct(productData);
      
      if (response.success) {
        // Add new product to state
        setProducts(prev => [response.data, ...prev]);
        
        // Check if it's a critical stock item
        if (productData.stock <= 5) {
          setCriticalStockItems(prev => [response.data, ...prev]);
        }
        
        // Update dashboard stats
        dashboardStats.totalProducts += 1;
        if (productData.stock <= 5) {
          dashboardStats.lowStockItems += 1;
        }
        
        // Notify all clients about new product
        socketService.emit('new_product', response.data);
        
        // Show success notification
        addNotification(`Product "${productData.name}" added successfully`, 'success');
        
        // Reset form and close modal
        setNewProduct({
          name: '',
          category: 'Electronics',
          price: '',
          stock: '',
          description: '',
          lowStockThreshold: '5',
        });
        setShowProductModal(false);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      addNotification('Failed to add product', 'error');
    }
  };

  // Handle adding a new stocker
  const handleAddStocker = async () => {
    // Validate form
    if (!newStocker.name || !newStocker.email || !newStocker.password) {
      addNotification('Please fill all required fields', 'error');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStocker.email)) {
      addNotification('Please enter a valid email address', 'error');
      return;
    }
    
    try {
      // Create new user with stocker role
      const response = await authService.register({
        ...newStocker,
        role: 'stocker'
      });
      
      if (response.success) {
        // Show success notification
        addNotification(`Stocker ${newStocker.name} added successfully`, 'success');
        
        // Update dashboard stats
        dashboardStats.activeStockers += 1;
        
        // Reset form and close modal
        setNewStocker({
          name: '',
          email: '',
          password: '',
          category: 'Electronics',
          active: true
        });
        setShowStockerModal(false);
      }
    } catch (error) {
      console.error('Error adding stocker:', error);
      addNotification('Failed to add stocker', 'error');
    }
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
      addNotification('Please fill all required fields', 'error');
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

  // Handle opening delete confirmation modal
  const openDeleteConfirmation = (product) => {
    setProductToDelete(product);
    setShowDeleteConfirmation(true);
  };

  // Handle deleting a product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      const response = await productService.deleteProduct(productToDelete._id);
      
      if (response.success) {
        // Remove product from state
        setProducts(prev => prev.filter(p => p._id !== productToDelete._id));
        
        // Remove from critical stock items if present
        setCriticalStockItems(prev => prev.filter(p => p._id !== productToDelete._id));
        
        // Update dashboard stats
        dashboardStats.totalProducts -= 1;
        if (productToDelete.stock <= 5) {
          dashboardStats.lowStockItems -= 1;
        }
        
        // Notify all clients about product deletion
        socketService.emit('product_deleted', {
          productId: productToDelete._id,
          productName: productToDelete.name
        });
        
        // Show success notification
        addNotification(`Product "${productToDelete.name}" deleted successfully`, 'success');
        
        // Close modal
        setShowDeleteConfirmation(false);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      addNotification('Failed to delete product', 'error');
    }
  };

  // Handle opening delete stocker confirmation modal
  const openDeleteStockerConfirmation = (stocker) => {
    setStockerToDelete(stocker);
    setShowDeleteStockerConfirmation(true);
  };

  // Handle deleting a stocker
  const handleDeleteStocker = async () => {
    if (!stockerToDelete) return;
    
    try {
      const response = await userService.deleteUser(stockerToDelete._id);
      
      if (response.success) {
        // Remove stocker from state
        setStockers(prev => prev.filter(s => s._id !== stockerToDelete._id));
        
        // Update dashboard stats if stocker was active
        if (stockerToDelete.active) {
          dashboardStats.activeStockers -= 1;
        }
        
        // Show success notification
        addNotification(`Stocker "${stockerToDelete.name}" deleted successfully`, 'success');
        
        // Close modal
        setShowDeleteStockerConfirmation(false);
      }
    } catch (error) {
      console.error('Error deleting stocker:', error);
      addNotification('Failed to delete stocker', 'error');
    }
  };

  const renderDashboard = () => (
    <div className="p-4 lg:p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Home className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8">
              <option>July</option>
              <option>June</option>
              <option>May</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>

      {/* Restock Requests Section */}
      {restockRequests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-blue-800">Pending Restock Requests</h2>
          </div>
          <div className="space-y-3">
            {restockRequests.map((request, index) => (
              <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white p-3 rounded-lg shadow-sm">
                <div>
                  <p className="font-medium">{request.productName}</p>
                  <p className="text-sm text-gray-600">
                    {request.category} - Current Stock: {request.currentStock}
                  </p>
                  <p className="text-xs text-gray-500">
                    Requested by: {request.requestedBy?.name || 'Stocker'} 
                    {request.requestedAt && ` at ${new Date(request.requestedAt).toLocaleTimeString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openRestockModal(request)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold">{dashboardStats.totalProducts}</p>
              <p className="text-xs text-green-600">+12%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 p-2 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold">{dashboardStats.lowStockItems}</p>
              <p className="text-xs text-red-600">4-25%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Stockers</p>
              <p className="text-2xl font-bold">{dashboardStats.activeStockers}</p>
              <p className="text-xs text-green-600"></p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">Total Value</h3>
            <p className="text-sm text-gray-600">Current inventory value</p>
            <p className="text-3xl font-bold mt-2">${(dashboardData.totalValue / 1000).toFixed(0)}K</p>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-600">Value over time</p>
              <div className="relative">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-6">
                  <option>July</option>
                  <option>June</option>
                  <option>May</option>
                </select>
                <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              </div>
            </div>
            <div className="h-20 flex items-end justify-center">
              <svg width="100%" height="80" viewBox="0 0 400 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Generate dynamic path based on dashboardData.monthlyValues */}
                <path 
                  d={`M0 ${80 - (dashboardData.monthlyValues[0]/200000*80)} 
                     C ${400/dashboardData.monthlyValues.length/3} ${80 - (dashboardData.monthlyValues[0]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length/3*2} ${80 - (dashboardData.monthlyValues[1]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length} ${80 - (dashboardData.monthlyValues[1]/200000*80)} 
                     C ${400/dashboardData.monthlyValues.length + 400/dashboardData.monthlyValues.length/3} ${80 - (dashboardData.monthlyValues[1]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length + 400/dashboardData.monthlyValues.length/3*2} ${80 - (dashboardData.monthlyValues[2]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*2} ${80 - (dashboardData.monthlyValues[2]/200000*80)}
                     C ${400/dashboardData.monthlyValues.length*2 + 400/dashboardData.monthlyValues.length/3} ${80 - (dashboardData.monthlyValues[2]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*2 + 400/dashboardData.monthlyValues.length/3*2} ${80 - (dashboardData.monthlyValues[3]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*3} ${80 - (dashboardData.monthlyValues[3]/200000*80)}
                     C ${400/dashboardData.monthlyValues.length*3 + 400/dashboardData.monthlyValues.length/3} ${80 - (dashboardData.monthlyValues[3]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*3 + 400/dashboardData.monthlyValues.length/3*2} ${80 - (dashboardData.monthlyValues[4]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*4} ${80 - (dashboardData.monthlyValues[4]/200000*80)}
                     C ${400/dashboardData.monthlyValues.length*4 + 400/dashboardData.monthlyValues.length/3} ${80 - (dashboardData.monthlyValues[4]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*4 + 400/dashboardData.monthlyValues.length/3*2} ${80 - (dashboardData.monthlyValues[5]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*5} ${80 - (dashboardData.monthlyValues[5]/200000*80)}`} 
                  stroke="#10B981" 
                  strokeWidth="2" 
                  fill="none"
                />
                <path 
                  d={`M0 ${80 - (dashboardData.monthlyValues[0]/200000*80)} 
                     C ${400/dashboardData.monthlyValues.length/3} ${80 - (dashboardData.monthlyValues[0]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length/3*2} ${80 - (dashboardData.monthlyValues[1]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length} ${80 - (dashboardData.monthlyValues[1]/200000*80)} 
                     C ${400/dashboardData.monthlyValues.length + 400/dashboardData.monthlyValues.length/3} ${80 - (dashboardData.monthlyValues[1]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length + 400/dashboardData.monthlyValues.length/3*2} ${80 - (dashboardData.monthlyValues[2]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*2} ${80 - (dashboardData.monthlyValues[2]/200000*80)}
                     C ${400/dashboardData.monthlyValues.length*2 + 400/dashboardData.monthlyValues.length/3} ${80 - (dashboardData.monthlyValues[2]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*2 + 400/dashboardData.monthlyValues.length/3*2} ${80 - (dashboardData.monthlyValues[3]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*3} ${80 - (dashboardData.monthlyValues[3]/200000*80)}
                     C ${400/dashboardData.monthlyValues.length*3 + 400/dashboardData.monthlyValues.length/3} ${80 - (dashboardData.monthlyValues[3]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*3 + 400/dashboardData.monthlyValues.length/3*2} ${80 - (dashboardData.monthlyValues[4]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*4} ${80 - (dashboardData.monthlyValues[4]/200000*80)}
                     C ${400/dashboardData.monthlyValues.length*4 + 400/dashboardData.monthlyValues.length/3} ${80 - (dashboardData.monthlyValues[4]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*4 + 400/dashboardData.monthlyValues.length/3*2} ${80 - (dashboardData.monthlyValues[5]/200000*80)}, 
                     ${400/dashboardData.monthlyValues.length*5} ${80 - (dashboardData.monthlyValues[5]/200000*80)}
                     L ${400/dashboardData.monthlyValues.length*5} 80 L 0 80 Z`} 
                  fill="rgba(16, 185, 129, 0.1)"
                />
              </svg>
            </div>
          </div>
          
          <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
            More Insights →
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-600 rounded-xl p-4 shadow-sm text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Need more stats?</h3>
                <p className="text-blue-100">Upgrade to pro for added benefits</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
                  Go Pro Now
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Sales breakdown by product</h3>
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="w-full sm:w-1/2 space-y-3 mb-4 sm:mb-0">
                {dashboardData.salesData.map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 bg-${category.color}-600 rounded-full`}></div>
                      <span className="text-sm">{category.category}</span>
                    </div>
                    <span className="text-sm font-medium">{category.percentage}%</span>
                  </div>
                ))}
              </div>
              <div className="w-full sm:w-1/2 flex justify-center">
                <div className="w-32 h-32 relative">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="40" fill="#E5E7EB" />

                    {/* Dynamic segments based on dashboardData.salesData */}
                    {dashboardData.salesData.map((category, index) => {
                      const previousPercentages = dashboardData.salesData
                        .slice(0, index)
                        .reduce((sum, item) => sum + item.percentage, 0);
                      
                      return (
                        <circle 
                          key={index}
                          cx="50" 
                          cy="50" 
                          r="40" 
                          fill="transparent" 
                          stroke={`var(--color-${category.color}-600)`} 
                          strokeWidth="20" 
                          strokeDasharray={`${category.percentage * 2.51} ${100 * 2.51}`} 
                          strokeDashoffset={`${-previousPercentages * 2.51}`} 
                          transform="rotate(-90 50 50)" 
                        />
                      );
                    })}
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
    <div className="p-4 lg:p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Inventory Overview</h1>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          onClick={() => setShowProductModal(true)}
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-semibold text-red-800">Critical Stock Alerts</h2>
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
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.category} - Stock: {product.stock}</p>
                </div>
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  onClick={() => openRestockModal({
                    productId: product._id,
                    productName: product.name,
                    category: product.category,
                    currentStock: product.stock
                  })}
                >
                  Restock Now
                </button>
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-sm text-gray-500">No critical stock items at the moment</p>
          )}
        </div>
      </div>

      <div className="bg-blue-600 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">All Products</h2>
            <p className="text-blue-100">Manage your entire product inventory</p>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 bg-white rounded-xl">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : (
            products.map((product) => (
              <div key={product._id} className="bg-white rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.category} - ${product.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`bg-${
                    product.stock > 10 ? 'green' : 
                    product.stock > 5 ? 'yellow' : 
                    product.stock > 0 ? 'red' : 
                    'gray'
                  }-100 text-${
                    product.stock > 10 ? 'green' : 
                    product.stock > 5 ? 'yellow' : 
                    product.stock > 0 ? 'red' : 
                    'gray'
                  }-800 px-3 py-1 rounded-full text-sm`}>
                    {product.stock > 10 ? 'In Stock' : 
                     product.stock > 5 ? 'Low Stock' : 
                     product.stock > 0 ? 'Critical' : 
                     'Out of Stock'}
                  </span>
                  <button 
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                    onClick={() => openEditProductModal(product)}
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button 
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                    onClick={() => openDeleteConfirmation(product)}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderStockers = () => (
    <div className="p-4 lg:p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Manage Stockers</h1>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          onClick={() => setShowStockerModal(true)}
        >
          <UserPlus className="w-4 h-4" />
          Add Stocker
        </button>
      </div>

      <div className="bg-blue-600 rounded-xl p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Active Stockers</h2>
          <p className="text-blue-100">Manage Stocker accounts and permissions</p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 bg-white rounded-xl">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading stockers...</p>
            </div>
          ) : stockers && stockers.length > 0 ? (
            stockers.map((stocker, index) => (
              <div key={stocker?._id || index} className="bg-white rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-blue-600">
                    {stocker?.name ? stocker.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <p className="font-medium">{stocker?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">{stocker?.email || 'No email'}</p>
                    <p className="text-sm text-gray-500">Category: {stocker?.category || 'General'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`${stocker?.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} px-3 py-1 rounded-full text-sm font-medium`}>
                    {stocker?.active ? 'Active' : 'Inactive'}
                  </span>
                  <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button 
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                    onClick={() => stocker && openDeleteStockerConfirmation(stocker)}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-white rounded-xl">
              <p className="text-gray-600">No stockers found. Add a stocker to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="p-4 lg:p-6 bg-gray-100 min-h-screen">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Analytics and Reports</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <select className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8">
              <option>July</option>
              <option>June</option>
              <option>May</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold">100</p>
              <p className="text-xs text-green-600">+4%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 p-2 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold">16</p>
              <p className="text-xs text-red-600">+23%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Stockers</p>
              <p className="text-2xl font-bold">8</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Category Analytics</h3>
          {dashboardData.salesData.slice(0, 3).map((category, index) => {
            const categoryProducts = products.filter(p => p.category === category.category);
            const lowStockCount = categoryProducts.filter(p => p.stock > 0 && p.stock <= 5).length;
            const outOfStockCount = categoryProducts.filter(p => p.stock === 0).length;
            const categoryValue = categoryProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
            const healthPercentage = Math.round(((categoryProducts.length - lowStockCount - outOfStockCount) / categoryProducts.length) * 100) || 0;
            
            return (
              <div key={index} className="bg-white rounded-xl p-4 text-gray-900">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold">{category.category}</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 text-sm">
                      <div><p className="text-gray-500">Total Products</p><p className="font-bold">{categoryProducts.length}</p></div>
                      <div><p className="text-gray-500">Low Stock</p><p className="font-bold text-yellow-600">{lowStockCount}</p></div>
                      <div><p className="text-gray-500">Out of Stock</p><p className="font-bold text-red-600">{outOfStockCount}</p></div>
                      <div><p className="text-gray-500">Total Value</p><p className="font-bold text-green-600">${categoryValue.toLocaleString()}</p></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="relative w-20 h-20">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path className="text-gray-200" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className={`${healthPercentage >= 85 ? 'text-green-500' : healthPercentage >= 75 ? 'text-blue-500' : 'text-yellow-500'}`} strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" strokeDasharray={`${healthPercentage}, 100`} transform="rotate(-90 18 18)" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">{healthPercentage}%</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-semibold">Healthy Stock</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Growth</h2>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Customer Growth</h3>
              <div className="relative">
                <select className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8">
                  <option>2024</option>
                  <option>2023</option>
                  <option>2022</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-4">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-8">{month}</span>
                  <div className="flex-1 mx-4 flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.random() * 80 + 20}%` }}
                      ></div>
                    </div>
                    <div className="flex-1 bg-blue-300 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.random() * 60 + 10}%` }}
                      ></div>
                    </div>
                    <div className="flex-1 bg-gray-300 rounded-full h-2">
                      <div 
                        className="bg-gray-600 h-2 rounded-full" 
                        style={{ width: `${Math.random() * 40 + 5}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{Math.floor(Math.random() * 500 + 100)}</div>
                    <div className="text-xs text-gray-500">customers</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">June 2024</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">341</span>
                    <span className="text-gray-600">New Customers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">224</span>
                    <span className="text-gray-600">Women</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">329</span>
                    <span className="text-gray-600">Men</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>Men</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
                <span>Women</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                <span>New Customer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'inventory':
        return renderInventory();
      case 'stockers':
        return renderStockers();
      case 'analytics':
        return renderAnalytics();
      case 'logout':
        handleLogout();
        return null;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">Stock Alert Pro</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-200">
              <User className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
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
              {menuItems.map((item) => {
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

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={toggleMobileMenu}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-screen">
          {renderContent()}
        </main>
      </div>

      {/* Restock Modal */}
      {showRestockModal && activeRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Restock {activeRequest.productName}</h3>
            <p className="text-sm text-gray-600 mb-4">
              Current stock: <span className="font-semibold">{activeRequest.currentStock}</span>
            </p>
            
            <div className="mb-4">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Restock Quantity
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 1)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setShowRestockModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleDenyRestock}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Deny
              </button>
              <button 
                onClick={handleApproveRestock}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Product</h3>
              <button 
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. iPhone 15 Pro"
                />
              </div>
              
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home">Home</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
              
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
                </label>
                <input
                  type="number"
                  id="price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 999"
                  min="0"
                  step="0.01"
                />
              </div>
              
              {/* Stock */}
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Stock *
                </label>
                <input
                  type="number"
                  id="stock"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 50"
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
                  value={newProduct.lowStockThreshold}
                  onChange={(e) => setNewProduct({...newProduct, lowStockThreshold: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. 5"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Alerts will be sent when stock falls below this level</p>
              </div>
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Product description (optional)"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stocker Modal */}
      {showStockerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Stocker</h3>
              <button 
                onClick={() => setShowStockerModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Stocker Name */}
              <div>
                <label htmlFor="stockerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="stockerName"
                  value={newStocker.name}
                  onChange={(e) => setNewStocker({...newStocker, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. John Smith"
                />
              </div>
              
              {/* Email */}
              <div>
                <label htmlFor="stockerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="stockerEmail"
                  value={newStocker.email}
                  onChange={(e) => setNewStocker({...newStocker, email: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. john@company.com"
                />
              </div>
              
              {/* Password */}
              <div>
                <label htmlFor="stockerPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  id="stockerPassword"
                  value={newStocker.password}
                  onChange={(e) => setNewStocker({...newStocker, password: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Create a password"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              
              {/* Category */}
              <div>
                <label htmlFor="stockerCategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Category
                </label>
                <select
                  id="stockerCategory"
                  value={newStocker.category}
                  onChange={(e) => setNewStocker({...newStocker, category: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home">Home</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
              
              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="stockerActive"
                  checked={newStocker.active}
                  onChange={(e) => setNewStocker({...newStocker, active: e.target.checked})}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="stockerActive" className="text-sm font-medium text-gray-700">
                  Active Status
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setShowStockerModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddStocker}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
              >
                <UserPlus className="w-4 h-4" />
                Add Stocker
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home">Home</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
              
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
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
              
              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                />
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex flex-col items-center mb-4">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-center">Delete Product</h3>
              <p className="text-gray-600 text-center mt-2">
                Are you sure you want to delete "{productToDelete.name}"? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-center gap-3 mt-6">
              <button 
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteProduct}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Stocker Confirmation Modal */}
      {showDeleteStockerConfirmation && stockerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex flex-col items-center mb-4">
              <div className="bg-red-100 p-3 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-center">Delete Stocker</h3>
              <p className="text-gray-600 text-center mt-2">
                Are you sure you want to delete stocker "{stockerToDelete.name}"? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-center gap-3 mt-6">
              <button 
                onClick={() => setShowDeleteStockerConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteStocker}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlertPro;
                