'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';

export default function SigninLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const user = authService.getCurrentUser();
    
    if (user) {
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
    }
  }, [router]);

  return <>{children}</>;
} 