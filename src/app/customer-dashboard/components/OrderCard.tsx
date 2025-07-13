'use client';

import React from 'react';
import { Package, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

// Update the OrderCard interface to properly handle product details
interface OrderCardProps {
  order: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    items: {
      product: {
        _id: string;
        name: string;
        image?: string;
        category?: string;
      };
      quantity: number;
      price: number;
    }[];
    currentStatus: string;
    statusHistory: {
      status: string;
      timestamp: string;
      note?: string;
    }[];
    createdAt: string;
    estimatedDelivery: string;
    phoneNumber?: string;
    deliveryAddress?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  onViewDetails: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onViewDetails }) => {
  // Get the latest status update
  const latestStatus = order.statusHistory?.length > 0 
    ? order.statusHistory.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0]
    : null;

  // Calculate total items
  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Order Placed':
        return 'bg-blue-100 text-blue-800';
      case 'Payment Confirmed':
        return 'bg-purple-100 text-purple-800';
      case 'Order Processed':
        return 'bg-yellow-100 text-yellow-800';
      case 'Ready to Pickup':
        return 'bg-green-100 text-green-800';
      case 'In Transit':
        return 'bg-indigo-100 text-indigo-800';
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  console.log('Order in OrderCard:', order); // For debugging

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center">
              <h3 className="font-medium text-gray-900">Order #{order.orderNumber}</h3>
              <span className={`ml-3 px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.currentStatus)}`}>
                {order.currentStatus}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Placed on {formatDate(order.createdAt)}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
              <p className="text-sm">
                <span className="font-medium">Items:</span> {totalItems}
              </p>
              <p className="text-sm">
                <span className="font-medium">Total:</span> ${order.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => onViewDetails(order._id)}
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
        >
          Details <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Preview of ordered items */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center">
          <p className="text-sm font-medium">Items:</p>
          <div className="flex ml-2 overflow-hidden">
            {order.items && order.items.slice(0, 3).map((item, index) => (
              <div 
                key={`${item.product?._id || index}-${index}`}
                className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-sm -ml-1 first:ml-0 border border-white"
                title={item.product?.name || 'Product'}
              >
                {item.product?.image || '📦'}
              </div>
            ))}
            {order.items && order.items.length > 3 && (
              <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-xs font-medium -ml-1 border border-white">
                +{order.items.length - 3}
              </div>
            )}
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">
              {latestStatus ? `${latestStatus.status} • ${format(new Date(latestStatus.timestamp), 'h:mm a')}` : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard; 