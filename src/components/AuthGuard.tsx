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
        const user = authService.getCurrentUser();
        
        // If no user is found, redirect to login
        if (!user) {
          router.push('/signin');
          return;
        }
        
        // If specific roles are required, check if user has one
        if (allowedRoles && !allowedRoles.includes(user.role)) {
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
        
        setIsAuthenticated(true);
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

  // Show children for public paths or when authenticated
  return isAuthenticated || publicPaths.includes(pathname) ? <>{children}</> : null;
} 