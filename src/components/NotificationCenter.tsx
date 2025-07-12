'use client';

import React, { useState } from 'react';
import { Bell, X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNotifications, NotificationType } from '@/context/NotificationContext';

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'messages'>('all');
  
  const {
    notifications,
    stockAlerts,
    messages,
    unreadCount,
    markNotificationAsRead,
    markStockAlertAsRead,
    markMessageAsRead
  } = useNotifications();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getDisplayItems = () => {
    switch (activeTab) {
      case 'alerts':
        return stockAlerts.map(alert => (
          <div 
            key={`${alert.productId}-${alert.timestamp}`}
            className={`p-3 border-b ${alert.read ? 'bg-gray-50' : 'bg-blue-50'}`}
            onClick={() => markStockAlertAsRead(alert.productId)}
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-2 items-start">
                {alert.type === 'low_stock' 
                  ? <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  : <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                }
                <div>
                  <p className="text-sm font-medium">
                    {alert.type === 'low_stock' 
                      ? `Low Stock: ${alert.productName}` 
                      : `Out of Stock: ${alert.productName}`
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    {alert.type === 'low_stock' 
                      ? `Current: ${alert.currentStock}, Threshold: ${alert.threshold}` 
                      : 'Stock depleted'
                    }
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{formatTime(alert.timestamp)}</span>
            </div>
          </div>
        ));
        
      case 'messages':
        return messages.map(message => (
          <div 
            key={message.id}
            className={`p-3 border-b ${message.read ? 'bg-gray-50' : 'bg-blue-50'}`}
            onClick={() => markMessageAsRead(message.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-2 items-start">
                <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">From: {message.senderName}</p>
                  <p className="text-xs">{message.message}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
            </div>
          </div>
        ));
        
      case 'all':
      default:
        return notifications.map(notification => (
          <div 
            key={notification.id}
            className={`p-3 border-b ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}
            onClick={() => markNotificationAsRead(notification.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-2 items-start">
                {getIcon(notification.type)}
                <p className="text-sm">{notification.message}</p>
              </div>
              <span className="text-xs text-gray-400">{formatTime(notification.timestamp)}</span>
            </div>
          </div>
        ));
    }
  };

  const displayItems = getDisplayItems();
  
  return (
    <div className="relative">
      <button 
        className="relative p-2 rounded-full hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center transform translate-x-1 -translate-y-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 w-80 z-50">
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-medium">Notifications</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 p-2 text-sm font-medium ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 p-2 text-sm font-medium ${activeTab === 'alerts' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            >
              Alerts {stockAlerts.filter(a => !a.read).length > 0 && `(${stockAlerts.filter(a => !a.read).length})`}
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 p-2 text-sm font-medium ${activeTab === 'messages' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            >
              Messages {messages.filter(m => !m.read).length > 0 && `(${messages.filter(m => !m.read).length})`}
            </button>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {displayItems.length > 0 ? (
              displayItems
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No {activeTab === 'all' ? 'notifications' : activeTab} to display
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter; 