'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const user = authService.getCurrentUser();
    
    if (!user) {
      router.push('/signin');
      return;
    }
    
    if (user.role !== 'admin') {
      // Redirect based on role
      switch (user.role) {
        case 'customer':
          router.push('/customer-dashboard');
          break;
        case 'stocker':
          router.push('/stocker-dashboard');
          break;
        default:
          router.push('/signin');
      }
    }
  }, [router]);

  return <>{children}</>;
} 