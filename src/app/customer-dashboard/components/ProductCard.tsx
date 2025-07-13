'use client';

import React, { useState } from 'react';
import { Heart, Star, ShoppingCart, Bell, BellOff, Package } from 'lucide-react';
import { productService, subscriptionService, orderService } from '@/services/api';
import socketService from '@/services/socket';
import { useNotifications } from '@/context/NotificationContext';
import OrderTracking from './OrderTracking';
import AddressForm from './AddressForm';

interface ProductCardProps {
  product: any;
  onAddToCart: (productId: string, quantity: number) => void;
  onToggleFavorite: (productId: string) => void;
  onToggleSubscribe: (productId: string, subscribed: boolean) => void;
  refreshProducts: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleFavorite,
  onToggleSubscribe,
  refreshProducts
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showOrderTracking, setShowOrderTracking] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const { addNotification } = useNotifications();
  
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value);
    if (newQuantity > 0 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };
  
  const handleAddToCart = async () => {
    if (isOutOfStock || quantity > product.stock) return;
    
    setIsAdding(true);
    try {
      await onAddToCart(product._id, quantity);
      
      // Reset quantity
      setQuantity(1);
      
      // Refresh products to get updated stock
      refreshProducts();
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleToggleFavorite = async () => {
    try {
      await onToggleFavorite(product._id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };
  
  const handleToggleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      await onToggleSubscribe(product._id, !product.subscribed);
      // Note: Notifications are handled in the parent component now
    } catch (error) {
      console.error('Error toggling subscription:', error);
      // The parent component will handle the notification
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleOrderNowClick = () => {
    if (isOutOfStock || quantity > product.stock) return;
    setShowAddressForm(true);
  };

  const handleOrderSubmit = async (deliveryAddress, phoneNumber) => {
    setIsOrdering(true);
    try {
      // In a real app, this would call the API to create an order
      // For now, we'll use a mock order that includes the form data
      const orderNumber = `${new Date().getFullYear().toString().substr(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      const mockOrder = {
        orderNumber,
        totalAmount: product.price * quantity,
        estimatedDelivery: new Date(new Date().getTime() + 15 * 60000).toISOString(),
        statusHistory: [
          {
            status: 'Order Placed',
            timestamp: new Date().toISOString(),
            note: 'We have received your order.'
          },
          {
            status: 'Payment Confirmed',
            timestamp: new Date(new Date().getTime() - 60000).toISOString(),
            note: 'Awaiting confirmation.'
          },
          {
            status: 'Order Processed',
            timestamp: new Date(new Date().getTime() - 120000).toISOString(),
            note: 'We are preparing your order.'
          },
          {
            status: 'Ready to Pickup',
            timestamp: new Date(new Date().getTime() - 180000).toISOString(),
            note: `Order#${orderNumber} from Tasty Food.`
          }
        ],
        currentStatus: 'Ready to Pickup',
        deliveryAddress,
        phoneNumber,
        items: [
          {
            product: {
              _id: product._id,
              name: product.name,
              image: product.image,
            },
            quantity,
            price: product.price
          }
        ]
      };
      
      // In a real app, you would call the API:
      // const response = await orderService.createOrder({
      //   items: [{ product: product._id, quantity }],
      //   deliveryAddress,
      //   phoneNumber
      // });
      
      setOrderData(mockOrder);
      setShowAddressForm(false);
      setShowOrderTracking(true);
      
      // Add notification
      addNotification(`Order placed successfully! Order #${mockOrder.orderNumber}`, 'success');
      
      // Reset quantity
      setQuantity(1);
    } catch (error) {
      console.error('Error creating order:', error);
      addNotification('Failed to create order. Please try again.', 'error');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleCancelOrder = () => {
    setShowAddressForm(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4 flex flex-col h-full relative">
        {/* Favorite button */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"
          aria-label={product.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart 
            className={`h-5 w-5 ${product.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
          />
        </button>
        
        {/* Product image */}
        <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-4xl relative">
          {product.image || '📦'}
          
          {isLowStock && (
            <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
              Low Stock
            </div>
          )}
          
          {isOutOfStock && (
            <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              Out of Stock
            </div>
          )}
        </div>
        
        {/* Product details */}
        <h3 className="font-semibold text-gray-800 mb-1">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-2">{product.category}</p>
        
        {/* Product rating */}
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${
                  star <= Math.floor(product.rating || 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
        </div>
        
        {/* Product price */}
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-lg">${product.price}</p>
          <p className="text-sm text-gray-600">Stock: {product.stock}</p>
        </div>
        
        {/* Subscribe button */}
        <button
          onClick={handleToggleSubscribe}
          className={`mb-3 py-1 px-2 rounded-lg text-sm flex items-center justify-center ${
            product.subscribed
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${isSubscribing ? 'opacity-75 cursor-wait' : ''}`}
          disabled={isAdding || isSubscribing || isOrdering}
        >
          {isSubscribing ? (
            'Processing...'
          ) : product.subscribed ? (
            <>
              <BellOff className="h-4 w-4 mr-1" />
              Unsubscribe
            </>
          ) : (
            <>
              <Bell className="h-4 w-4 mr-1" />
              Get Stock Alerts
            </>
          )}
        </button>
        
        {/* Action buttons */}
        <div className="mt-auto grid grid-cols-2 gap-2">
          {/* Add to cart section */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={handleQuantityChange}
              className="w-12 border border-gray-300 rounded-md px-1 py-1 text-sm"
              disabled={isOutOfStock || isAdding || isSubscribing || isOrdering}
            />
            <button
              onClick={handleAddToCart}
              className={`flex-1 py-1 px-3 rounded-lg text-white text-sm flex items-center justify-center ${
                isOutOfStock || isAdding || isSubscribing || isOrdering
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={isOutOfStock || isAdding || isSubscribing || isOrdering}
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              {isAdding ? 'Adding...' : 'Cart'}
            </button>
          </div>

          {/* Order now button */}
          <button
            onClick={handleOrderNowClick}
            className={`py-1 px-3 rounded-lg text-sm flex items-center justify-center ${
              isOutOfStock || isAdding || isSubscribing || isOrdering
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            disabled={isOutOfStock || isAdding || isSubscribing || isOrdering}
          >
            <Package className="h-4 w-4 mr-1" />
            {isOrdering ? 'Ordering...' : 'Order Now'}
          </button>
        </div>
      </div>

      {/* Address form modal */}
      {showAddressForm && (
        <AddressForm
          onSubmit={handleOrderSubmit}
          onCancel={handleCancelOrder}
          isSubmitting={isOrdering}
        />
      )}

      {/* Order tracking modal */}
      {showOrderTracking && orderData && (
        <OrderTracking
          orderNumber={orderData.orderNumber}
          totalAmount={orderData.totalAmount}
          estimatedDelivery={orderData.estimatedDelivery}
          statusHistory={orderData.statusHistory}
          currentStatus={orderData.currentStatus}
          phoneNumber={orderData.phoneNumber}
          deliveryAddress={orderData.deliveryAddress}
          onClose={() => setShowOrderTracking(false)}
        />
      )}
    </>
  );
};

export default ProductCard; 