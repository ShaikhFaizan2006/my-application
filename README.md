# Stock Alert Pro

A comprehensive inventory management system with stock alerts.

## Features

- Role-based access (Admin, Stocker, Customer)
- Real-time stock level tracking
- Product subscriptions for low-stock alerts
- Inventory management for stockers/admins
- Customer dashboard for product browsing and alerts

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Express.js, Node.js, MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local instance or MongoDB Atlas)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Create a `.env` file in the root directory with:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/stockalertpro
   JWT_SECRET=stock-alert-pro-secret-key
   JWT_EXPIRES_IN=7d
   ```

### Running the Application

1. Start the backend server:
   ```
   npm run server
   ```

2. In a separate terminal, seed the database:
   ```
   npm run seed
   ```

3. Start the frontend development server:
   ```
   npm run dev
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Default User Credentials

- **Admin**:
  - Email: admin@example.com
  - Password: password123

- **Stocker**:
  - Email: stocker@example.com
  - Password: password123

- **Customer**:
  - Email: customer@example.com
  - Password: password123

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires authentication)

### Products Endpoints

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/lowstock` - Get low stock products (admin/stocker only)
- `GET /api/products/outofstock` - Get out of stock products (admin/stocker only)
- `POST /api/products` - Create new product (admin/stocker only)
- `PUT /api/products/:id` - Update product (admin/stocker only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Subscriptions Endpoints

- `GET /api/subscriptions` - Get all subscriptions for current user
- `GET /api/subscriptions/alerts` - Get subscription alerts for current user
- `POST /api/subscriptions` - Subscribe to a product
- `PUT /api/subscriptions/:id` - Update subscription notification threshold
- `DELETE /api/subscriptions/:id` - Delete subscription

### Cart Endpoints

- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:productId` - Update cart item quantity
- `DELETE /api/cart/:productId` - Remove item from cart
- `DELETE /api/cart` - Clear cart

### Users Endpoints

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/stockers` - Get all stockers (admin only)
- `GET /api/users/customers` - Get all customers (admin only)
- `PUT /api/users/:id/role` - Update user role (admin only)
