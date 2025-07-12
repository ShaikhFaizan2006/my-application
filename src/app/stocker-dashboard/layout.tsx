'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';

export default function StockerDashboardLayout({
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
    
    if (user.role !== 'stocker') {
      // Redirect based on role
      switch (user.role) {
        case 'customer':
          router.push('/customer-dashboard');
          break;
        case 'admin':
          router.push('/admin-dashboard');
          break;
        default:
          router.push('/signin');
      }
    }
  }, [router]);

  return <>{children}</>;
} 