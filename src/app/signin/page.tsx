"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Mail, Lock, User, ArrowLeft, ChevronDown } from 'lucide-react';
import { authService } from '@/services/api';

const TERMS_OF_SERVICE_URL = '/terms-of-service';
const PRIVACY_POLICY_URL = '/privacy-policy';

const StockAlertProAuth = () => {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Customer');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'Customer - Browse and Buy Products',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const accountTypes = [
    'Customer - Browse and Buy Products',
  ];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Sign Up specific validations
    if (isSignUp) {
      // Full name validation
      if (!formData.fullName) {
        newErrors.fullName = 'Full name is required';
      }

      // Confirm password validation
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      // Terms agreement validation
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'You must agree to the terms';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setFormData(prev => ({
      ...prev,
      accountType: role === 'Customer' ? 'Customer - Browse and Buy Products' 
                  : role === 'Stocker' ? 'Stocker - Manage Inventory'
                  : 'Admin - Full System Access'
    }));
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        if (isSignUp) {
          const userData = {
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            role: selectedRole.toLowerCase()
          };
          
          // Use authService instead of direct fetch
          const data = await authService.register(userData);
          
          if (data.success) {
            alert('Account created successfully!');
            
            // Navigate based on role
            switch(data.user.role) {
              case 'customer':
                router.push('/customer-dashboard');
                break;
              case 'stocker':
                router.push('/stocker-dashboard');
                break;
              case 'admin':
                router.push('/admin-dashboard');
                break;
            }
          } else {
            setErrors(prev => ({ ...prev, general: data.message || 'Registration failed' }));
          }
        } else {
          // Use authService instead of direct fetch
          setErrors(prev => ({ ...prev, general: 'Authenticating...' }));
          
          // Log to console before the API call
          console.log(`Attempting login with email: ${formData.email}`);
          
          const data = await authService.login(formData.email, formData.password);
          
          if (data.success) {
            // Log to console after a successful API call
            console.log('Login successful:', data);
            
            // Check if user role matches selected role
            if (data.user.role !== selectedRole.toLowerCase()) {
              setErrors(prev => ({ ...prev, general: `You are not a ${selectedRole}. Please select the correct role.` }));
              return;
            }
            
            // Clear the error before navigation
            setErrors({});
            
            // Navigate based on selected role
            switch(selectedRole.toLowerCase()) {
              case 'customer':
                router.push('/customer-dashboard');
                break;
              case 'stocker':
                router.push('/stocker-dashboard');
                break;
              case 'admin':
                router.push('/admin-dashboard');
                break;
            }
          } else {
            // Enhanced error handling
            let errorMessage = data.message || 'Authentication failed';
            
            // Check for specific error patterns
            if (errorMessage.includes('Network error') || errorMessage.includes('Failed to fetch')) {
              errorMessage = 'Server connection error. Please ensure the backend server is running.';
            } else if (errorMessage.includes('timeout')) {
              errorMessage = 'Connection timed out. Please try again.';
            } else if (errorMessage === 'Invalid credentials') {
              errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            }
            
            setErrors(prev => ({ ...prev, general: errorMessage }));
            
            // Log to console when authentication fails
            console.error('Authentication failed:', data.message);
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
        
        // Handle different error scenarios
        let errorMessage = 'Authentication failed. Please try again.';
        
        if (error.message && error.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection and server status.';
        } else if (error.message && error.message.includes('Failed to fetch')) {
          errorMessage = 'Server connection error. Please ensure the backend server is running.';
        }
        
        setErrors(prev => ({ ...prev, general: errorMessage }));
      }
    }
  };

  const goBackToHome = () => {
    router.push('/');
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    // Reset form and errors when switching modes
    setFormData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      accountType: 'Customer - Browse and Buy Products',
      agreeToTerms: false
    });
    setErrors({});
  };

  const handleTermsClick = (type: 'terms' | 'privacy') => {
    try {
      router.push(type === 'terms' ? TERMS_OF_SERVICE_URL : PRIVACY_POLICY_URL);
    } catch (error) {
      console.error('Navigation error:', error);
      alert(`Unable to navigate to ${type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex flex-col items-center justify-center p-4 pt-20 pb-20">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-2xl font-bold text-white">Stock Alert Pro</span>
        </div>
        <p className="text-blue-100 text-sm">
          {isSignUp ? 'Create your account' : 'Sign In to your account'}
        </p>
      </div>

      {/* Auth Mode Toggle */}
      <div className="text-center mb-4">
        <p className="text-white text-sm">
          {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
          <button 
            onClick={toggleAuthMode}
            className="ml-2 text-white-600 hover:text-white-700 font-medium"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-md flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 mx-4 w-full">
          {/* Form Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-blue-600 mb-2">
              {isSignUp ? 'Join Stock Alert Pro' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 text-xs md:text-sm">
              {isSignUp 
                ? 'Get Started with smart inventory notifications' 
                : 'Choose your Account Type to Continue'
              }
            </p>
          </div>

          {/* Role Selection (Sign In Only) */}
          {!isSignUp && (
            <div className="mb-6">
              <div className="flex bg-gray-100 rounded-full p-1">
                {['Customer', 'Stocker', 'Admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className={`flex-1 py-2 px-2 md:px-4 rounded-full text-xs md:text-sm font-medium transition-all ${
                      selectedRole === role
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Full Name (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your password"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}

            {/* Account Type Dropdown (Sign Up Only) */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white flex items-center justify-between"
                  >
                    <span className="text-gray-700 text-sm truncate pr-2">{formData.accountType}</span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                      {accountTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, accountType: type }));
                            setIsDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 transition-colors text-sm"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terms Agreement (Sign Up Only) */}
            {isSignUp && (
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                />
                <label className="text-sm text-gray-600 leading-relaxed">
                  I agree to the{' '}
                  <button onClick={() => handleTermsClick('terms')} className="text-blue-600 hover:text-blue-700 underline">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button onClick={() => handleTermsClick('privacy')} className="text-blue-600 hover:text-blue-700 underline">
                    Privacy Policy
                  </button>
                </label>
                {errors.agreeToTerms && <p className="text-red-500 text-xs mt-1">{errors.agreeToTerms}</p>}
              </div>
            )}

            {/* General Error Message */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {errors.general}
              </div>
            )}

          {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-400 text-white py-3 rounded-lg font-medium hover:bg-blue-500 transition-colors shadow-lg text-sm md:text-base"
            >
              {isSignUp ? '👤 Create My Account' : `👤 Sign In as ${selectedRole}`}
            </button>

            {/* Role Description (Sign In Only) */}
            {!isSignUp && (
              <p className="text-center text-xs md:text-sm text-gray-500 mt-3 px-2">
                {selectedRole === 'Customer' && 'Browse products and manage your stock alerts'}
                {selectedRole === 'Stocker' && 'Manage inventory and stock levels'}
                {selectedRole === 'Admin' && 'Full administrative access and control'}
              </p>
            )}
          </div>

          {/* Toggle Sign Up/Sign In */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-xs md:text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {isSignUp ? 'Sign In here' : 'Sign up here'}
              </button>
            </p>
          </div>
        </div>

        {/* Back to Home Button */}
        <button
          onClick={goBackToHome}
          className="flex items-center justify-center text-white hover:text-blue-200 transition-colors mt-6 mx-auto space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back To Home</span>
        </button>
      </div>
    </div>
  );
};

export default StockAlertProAuth;