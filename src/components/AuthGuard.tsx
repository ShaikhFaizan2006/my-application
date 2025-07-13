'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/services/api';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const publicPaths = ['/', '/signin'];

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Check if we're on a public path
    if (publicPaths.includes(pathname)) {
      setIsLoading(false);
      return;
    }

    const checkAuth = () => {
      // For client-side only code
      if (typeof window !== 'undefined') {
        try {
          console.log('AuthGuard: Checking authentication status');
          const user = authService.getCurrentUser();
          
          // Debug log the current user
          console.log('AuthGuard: Current user:', user);
          
          // If no user is found, redirect to login
          if (!user) {
            console.log('AuthGuard: No user found, redirecting to signin');
            // Clear any potential corrupted tokens
            authService.logout();
            setAuthError('Authentication required. Please sign in.');
            router.push('/signin');
            return;
          }
          
          // If specific roles are required, check if user has one
          if (allowedRoles && !allowedRoles.includes(user.role)) {
            console.log(`AuthGuard: User role ${user.role} not in allowed roles:`, allowedRoles);
            setAuthError(`Access denied. Your role (${user.role}) does not have permission for this resource.`);
            
            // Redirect based on role if not authorized
            switch (user.role) {
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
                router.push('/signin');
            }
            return;
          }
          
          console.log('AuthGuard: Authentication successful');
          setIsAuthenticated(true);
          setAuthError(null);
        } catch (error) {
          console.error('AuthGuard: Error checking authentication:', error);
          setAuthError('An error occurred while checking authentication. Please try signing in again.');
          authService.logout();
          router.push('/signin');
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router, allowedRoles]);

  // Handle server-side rendering
  if (!mounted) {
    return null;
  }

  // Show nothing while loading
  if (isLoading && !publicPaths.includes(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-blue-600 animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Display error message if authentication failed
  if (authError && !publicPaths.includes(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-center h-12 w-12 mx-auto bg-red-100 text-red-600 rounded-full">
            ⚠️
          </div>
          <h3 className="mt-3 text-lg font-semibold text-gray-900">Authentication Error</h3>
          <p className="mt-2 text-gray-600">{authError}</p>
          <button 
            onClick={() => router.push('/signin')}
            className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show children for public paths or when authenticated
  return isAuthenticated || publicPaths.includes(pathname) ? <>{children}</> : null;
} 