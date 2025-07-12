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
  messages: any[];
  addNotification: (message: string, type: NotificationType, details?: any) => void;
  markNotificationAsRead: (id: string) => void;
  markStockAlertAsRead: (id: string) => void;
  markMessageAsRead: (id: string) => void;
  clearNotifications: () => void;
  clearStockAlerts: () => void;
  clearMessages: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const unreadCount = 
    notifications.filter(n => !n.read).length + 
    stockAlerts.filter(a => !a.read).length + 
    messages.filter(m => !m.read).length;

  useEffect(() => {
    // Connect to socket service
    socketService.connect();

    // Listen for stock alerts
    socketService.on('stock_alert', (data: any) => {
      const stockAlert: StockAlert = {
        ...data,
        read: false,
      };
      
      setStockAlerts(prev => [stockAlert, ...prev]);
      
      // Also add as a notification
      addNotification(
        data.type === 'low_stock' 
          ? `Low stock alert: ${data.productName} (${data.currentStock}/${data.threshold})`
          : `Out of stock: ${data.productName}`,
        'warning',
        data
      );
    });

    // Listen for direct messages
    socketService.on('message', (data: any) => {
      const newMessage = {
        ...data,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        read: false,
      };
      
      setMessages(prev => [newMessage, ...prev]);
      
      // Also add as a notification
      addNotification(
        `New message from ${data.senderName}`,
        'info',
        data
      );
    });

    // Clean up on unmount
    return () => {
      socketService.off('stock_alert', () => {});
      socketService.off('message', () => {});
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

  const markMessageAsRead = (id: string) => {
    setMessages(prev => 
      prev.map(message => 
        message.id === id ? { ...message, read: true } : message
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const clearStockAlerts = () => {
    setStockAlerts([]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        stockAlerts,
        messages,
        addNotification,
        markNotificationAsRead,
        markStockAlertAsRead,
        markMessageAsRead,
        clearNotifications,
        clearStockAlerts,
        clearMessages,
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