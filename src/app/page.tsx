'use client';
import React, { useEffect } from 'react';
import { ShoppingCart, Bell, TrendingUp, Users, Package, Settings, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';

const StockAlertProLanding = () => {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        // Redirect based on role
        switch(user.role) {
          case 'customer':
            router.push('/customer-dashboard');
            break;
          case 'stocker':
            router.push('/stocker-dashboard');
            break;
          case 'admin':
            router.push('/admin-dashboard');
            break;
          default:
            // If role is invalid, clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
      } catch (error) {
        // If parsing fails, clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [router]);

  const handleSignIn = () => {
    router.push('/signin');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm rounded-b-3xl mx-4 mt-4 lg:mx-8 lg:mt-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Stock Alert Pro</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" onClick={handleSignIn}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl mx-4 mt-8 lg:mx-8 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Never Miss a Product Again!
          </h1>
          <p className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
            From low-stock alerts to smooth restocking —
            manage everything under one smart system.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium" onClick={handleSignIn}>
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive feature set
            </h2>
            <h3 className="text-2xl lg:text-3xl font-bold text-blue-600 mb-8">
              of our inventory system
            </h3>
          </div>
          
          <div className="space-y-6">
            {/* Smart Alerts */}
            <div className="bg-blue-600 text-white p-6 rounded-2xl hover:bg-blue-700 transition-colors">
              <div className="flex items-center mb-3">
                <Bell className="w-6 h-6 mr-3" />
                <h4 className="text-xl font-bold">Smart Alerts</h4>
              </div>
              <p className="text-blue-100">
                Get notified when your favorite or essential
                products are running low. Subscribe to
                items and never miss out again.
              </p>
            </div>

            {/* Real-Time Tracking */}
            <div className="bg-blue-600 text-white p-6 rounded-2xl hover:bg-blue-700 transition-colors">
              <div className="flex items-center mb-3">
                <TrendingUp className="w-6 h-6 mr-3" />
                <h4 className="text-xl font-bold">Real-Time Tracking</h4>
              </div>
              <p className="text-blue-100">
                Monitor stock levels across categories instantly.
                Stay updated with live data to make
                faster decisions.
              </p>
            </div>

            {/* Multi-User System */}
            <div className="bg-blue-600 text-white p-6 rounded-2xl hover:bg-blue-700 transition-colors">
              <div className="flex items-center mb-3">
                <Users className="w-6 h-6 mr-3" />
                <h4 className="text-xl font-bold">Multi-User System</h4>
              </div>
              <p className="text-blue-100">
                Seamlessly manage customers, stockers, and
                administrators with role-based access.
                Personalized tools and access permissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl mx-4 lg:mx-8 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {/* Customer */}
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center mb-3">
                  <ShoppingCart className="w-6 h-6 mr-3 text-blue-600" />
                  <h4 className="text-xl font-bold text-gray-900">Customer</h4>
                </div>
                <p className="text-gray-600">
                  Browse products, subscribe for stock alerts,
                  and get notified when items are running low.
                </p>
              </div>

              {/* Inventory Manager */}
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center mb-3">
                  <Package className="w-6 h-6 mr-3 text-blue-600" />
                  <h4 className="text-xl font-bold text-gray-900">Inventory Manager</h4>
                </div>
                <p className="text-gray-600">
                  Manage inventory levels, receive alerts for low
                  stock, demand products, and request restocks.
                </p>
              </div>

              {/* Admin */}
              <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex items-center mb-3">
                  <Settings className="w-6 h-6 mr-3 text-blue-600" />
                  <h4 className="text-xl font-bold text-gray-900">Admin (Manager)</h4>
                </div>
                <p className="text-gray-600">
                  Get notified when your favorite or essential
                  products are running low. Subscribe to
                  items and never miss out again.
                </p>
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                The system supports three{' '}
                <span className="text-blue-300">user types:</span>
              </h2>
              <h3 className="text-2xl lg:text-3xl font-bold text-white">
                Customer, Stocker, and Admin
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-blue-600 mb-6">
          Ready to get started?
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Choose your role and dive into a smarter, faster way to manage inventory.
          Whether you're a customer browsing products or an admin overseeing operations —
          everything you need is just a click away.
        </p>
        <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center" onClick={handleSignIn}>
          <Play className="w-5 h-5 mr-2" />
          Take a Tour
        </button>
      </section>

      {/* Mobile Menu Toggle (for smaller screens) */}
      <div className="md:hidden fixed bottom-6 right-6">
        <button className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center" onClick={handleSignIn}>
          <Package className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default StockAlertProLanding;