'use client';

import React from 'react';
import { format } from 'date-fns';
import { MapPin, Home, Clock } from 'lucide-react';

interface OrderStatus {
  status: string;
  timestamp: string;
  note?: string;
}

interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface OrderTrackingProps {
  orderNumber: string;
  totalAmount: number;
  estimatedDelivery: string;
  statusHistory: OrderStatus[];
  currentStatus: string;
  phoneNumber?: string;
  deliveryAddress?: DeliveryAddress;
  onClose: () => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({
  orderNumber,
  totalAmount,
  estimatedDelivery,
  statusHistory = [], // Provide default empty array
  currentStatus,
  phoneNumber,
  deliveryAddress,
  onClose
}) => {
  // Sort status history by timestamp (newest first) with null check
  const sortedStatusHistory = statusHistory ? [...statusHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ) : [];

  // Calculate progress for the progress bar
  const getProgressPercentage = () => {
    const statusSteps = [
      'Order Placed',
      'Payment Confirmed',
      'Order Processed',
      'Ready to Pickup',
      'In Transit',
      'Delivered'
    ];
    
    if (currentStatus === 'Cancelled') return 0;
    
    const currentIndex = statusSteps.indexOf(currentStatus);
    if (currentIndex === -1) return 0;
    
    return Math.min(100, (currentIndex / (statusSteps.length - 1)) * 100);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEE, dd MMM');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm');
    } catch (error) {
      return '';
    }
  };
  
  // Get the full address as a string with safety checks
  const getFullAddress = () => {
    if (!deliveryAddress) return 'No delivery address provided';
    
    const { street = '', city = '', state = '', zipCode = '', country = '' } = deliveryAddress;
    return `${street}, ${city}, ${state} ${zipCode}, ${country}`.replace(/,\s+,/g, ',').replace(/,\s+$/g, '');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-800">Track Order</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          </div>
          
          {/* Order Info */}
          <div className="mb-6">
            <p className="text-sm text-gray-500">
              {formatDate(sortedStatusHistory[0]?.timestamp || '')}
            </p>
            <div className="flex justify-between mt-1">
              <p className="text-sm">
                Order ID: <span className="font-medium">{orderNumber}</span>
              </p>
              <p className="text-sm">
                Amt: <span className="font-medium">${totalAmount.toFixed(2)}</span>
              </p>
            </div>
            
            <div className="flex items-center mt-2">
              <Clock className="w-4 h-4 text-gray-500 mr-1" />
              <p className="text-sm">
                ETA: <span className="font-medium">
                  {estimatedDelivery ? '15 Min' : 'Calculating...'}
                </span>
              </p>
            </div>
          </div>
          
          {/* Status Timeline */}
          <div className="mb-6">
            <div className="relative">
              {/* Progress Bar */}
              <div className="absolute h-full w-0.5 bg-gray-200 left-[10px] top-0"></div>
              <div 
                className="absolute h-full w-0.5 bg-green-500 left-[10px] top-0"
                style={{ height: `${getProgressPercentage()}%` }}
              ></div>
              
              {/* Status Steps */}
              {sortedStatusHistory.map((status, index) => (
                <div key={index} className="flex mb-5 relative">
                  <div className={`w-5 h-5 rounded-full ${
                    status.status === currentStatus 
                      ? 'bg-green-500' 
                      : 'bg-gray-200'
                  } flex-shrink-0 z-10`}>
                  </div>
                  <div className="ml-4">
                    <div className="flex justify-between">
                      <p className={`font-medium ${
                        status.status === currentStatus ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {status.status}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTime(status.timestamp)}
                      </p>
                    </div>
                    {status.note && (
                      <p className="text-sm text-gray-500 mt-0.5">{status.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Delivery Address and Contact */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-start">
              <Home className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-gray-700">Delivery Address</p>
                <p className="text-sm text-gray-600 mt-1">{getFullAddress()}</p>
                {phoneNumber && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Phone:</span> {phoneNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking; 