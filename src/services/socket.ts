import { io, Socket } from 'socket.io-client';
import { authService } from './api';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  // Initialize socket connection
  connect() {
    if (this.socket) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';
    this.socket = io(SOCKET_URL);

    this.socket.on('connect', () => {
      console.log('Socket connected');
      
      // Authenticate the socket connection
      const user = authService.getCurrentUser();
      if (user) {
        this.socket?.emit('authenticate', {
          userId: user.id,
          role: user.role
        });
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Set up default listeners
    this.setupDefaultListeners();
  }

  // Set up default event listeners
  private setupDefaultListeners() {
    // Listen for product updates
    this.socket?.on('product_update', (data) => {
      this.notifyListeners('product_update', data);
    });

    // Listen for stock alerts
    this.socket?.on('stock_alert', (data) => {
      this.notifyListeners('stock_alert', data);
    });

    // Listen for direct messages
    this.socket?.on('message', (data) => {
      this.notifyListeners('message', data);
    });

    // Listen for user status changes
    this.socket?.on('user_status', (data) => {
      this.notifyListeners('user_status', data);
    });
    
    // Listen for restock responses
    this.socket?.on('restock_response', (data) => {
      this.notifyListeners('restock_response', data);
    });
  }

  // Send low stock alert
  sendLowStockAlert(productData: any) {
    if (!this.socket) {
      console.error('Socket not connected. Reconnecting...');
      this.connect();
    }
    
    try {
      this.socket?.emit('low_stock_alert', {
        ...productData,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error sending low stock alert:', error);
      return false;
    }
  }

  // Send out of stock alert
  sendOutOfStockAlert(productData: any) {
    if (!this.socket) {
      console.error('Socket not connected. Reconnecting...');
      this.connect();
    }
    
    try {
      this.socket?.emit('out_of_stock_alert', {
        ...productData,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error sending out of stock alert:', error);
      return false;
    }
  }

  // Send restock request
  sendRestockRequest(requestData: any) {
    if (!this.socket) return;
    this.socket.emit('restock_request', requestData);
  }
  
  // Approve restock request
  approveRestockRequest(productId: string, quantity: number) {
    if (!this.socket) return;
    this.socket.emit('approve_restock', {
      productId,
      quantity,
      approved: true
    });
  }
  
  // Deny restock request
  denyRestockRequest(productId: string, reason: string) {
    if (!this.socket) return;
    this.socket.emit('approve_restock', {
      productId,
      approved: false,
      message: reason
    });
  }

  // Notify about product updates
  notifyProductUpdate(productData: any) {
    if (!this.socket) return;
    this.socket.emit('product_updated', productData);
  }

  // Send direct message
  sendDirectMessage(recipientId: string, message: string, senderName: string) {
    if (!this.socket) return;
    this.socket.emit('direct_message', {
      recipientId,
      message,
      senderName
    });
  }
  
  // Generic emit method
  emit(event: string, data: any) {
    if (!this.socket) return;
    this.socket.emit(event, data);
  }

  // Add event listener
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  // Remove event listener
  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.delete(callback);
    }
  }

  // Notify all listeners of an event
  private notifyListeners(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket listener for ${event}:`, error);
        }
      });
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService; 