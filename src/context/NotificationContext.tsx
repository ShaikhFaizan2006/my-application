'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import socketService from '@/services/socket';
import { authService } from '@/services/api';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  read: boolean;
  details?: any;
}

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  threshold?: number;
  type: 'low_stock' | 'out_of_stock';
  timestamp: number;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  stockAlerts: StockAlert[];
  addNotification: (message: string, type: NotificationType, details?: any) => void;
  addStockAlert: (alert: Omit<StockAlert, 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markStockAlertAsRead: (id: string) => void;
  clearNotifications: () => void;
  clearStockAlerts: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  const unreadCount = 
    notifications.filter(n => !n.read).length + 
    stockAlerts.filter(a => !a.read).length;

  useEffect(() => {
    // Connect to socket service
    socketService.connect();

    // Listen for stock alerts
    socketService.on('stock_alert', (data: any) => {
      const stockAlert: StockAlert = {
        ...data,
        timestamp: Date.now(),
        read: false,
      };
      
      // Add to stock alerts
      addStockAlert({
        productId: data.productId,
        productName: data.productName,
        currentStock: data.currentStock,
        threshold: data.threshold,
        type: data.type
      });
    });

    // Clean up on unmount
    return () => {
      socketService.off('stock_alert', () => {});
    };
  }, []);

  const addNotification = (message: string, type: NotificationType = 'info', details?: any) => {
    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: Date.now(),
      read: false,
      details
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const addStockAlert = (alert: Omit<StockAlert, 'timestamp' | 'read'>) => {
    const newAlert: StockAlert = {
      ...alert,
      timestamp: Date.now(),
      read: false
    };

    // Check if we already have this alert to avoid duplicates
    const exists = stockAlerts.some(a => 
      a.productId === alert.productId && 
      a.type === alert.type &&
      a.currentStock === alert.currentStock
    );

    if (!exists) {
      setStockAlerts(prev => [newAlert, ...prev]);
      
      // Also add as a notification
      addNotification(
        alert.type === 'low_stock' 
          ? `Low stock alert: ${alert.productName} (${alert.currentStock}/${alert.threshold})`
          : `Out of stock: ${alert.productName}`,
        'warning',
        alert
      );
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markStockAlertAsRead = (productId: string) => {
    setStockAlerts(prev => 
      prev.map(alert => 
        alert.productId === productId ? { ...alert, read: true } : alert
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const clearStockAlerts = () => {
    setStockAlerts([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        stockAlerts,
        addNotification,
        addStockAlert,
        markNotificationAsRead,
        markStockAlertAsRead,
        clearNotifications,
        clearStockAlerts,
        unreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 