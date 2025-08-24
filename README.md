# E-commerce Backend API

A production-ready TypeScript Node.js + Express e-commerce backend with PostgreSQL, Prisma ORM, and comprehensive validation using Zod.

## 🚀 Features

- **Catalog Management**: Products with variants, SKUs, and inventory tracking
- **Guest Cart System**: Opaque cart tokens with cookie/header support
- **Promo Code Engine**: Percentage and fixed discounts with validation
- **Checkout Process**: Idempotent order creation with cart conversion
- **Comprehensive Validation**: Zod schemas for all inputs
- **Error Handling**: Centralized error management with consistent JSON responses
- **API Documentation**: OpenAPI 3 with Swagger UI
- **Testing**: Jest + Supertest with comprehensive test coverage
- **Logging**: Winston-based request logging with cart token tracking
- **Security**: Helmet, CORS, rate limiting, and input validation

## 🛠️ Tech Stack

- **Runtime**: Node.js LTS
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **Logging**: Winston
- **Documentation**: OpenAPI 3 + Swagger UI
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js 18+ (LTS)
- PostgreSQL 12+
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd ecommerce-backend
npm install
```

### 2. Environment Setup

Copy the environment example and configure your database:

```bash
cp env.example .env
```

Edit `.env` with your PostgreSQL connection:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db"
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

Interactive API documentation is available at `/docs` when the server is running.

### Key Endpoints

#### Catalog
- `GET /api/products` - List products with pagination and filters
- `GET /api/products/:slug` - Get product by slug
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### Cart
- `GET /api/carts` - Get current cart (creates new if none exists)
- `POST /api/carts/items` - Add item to cart
- `PUT /api/carts/items/:sku` - Update item quantity
- `DELETE /api/carts/items/:sku` - Remove item from cart
- `POST /api/carts/apply-promo` - Apply promo code
- `DELETE /api/carts/promo` - Remove promo code

#### Promos
- `GET /api/promos` - List promos with pagination
- `GET /api/promos/:id` - Get promo by ID
- `POST /api/promos` - Create new promo
- `PUT /api/promos/:id` - Update promo
- `DELETE /api/promos/:id` - Delete promo

#### Orders
- `GET /api/orders` - List orders with pagination
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order (checkout)
- `PUT /api/orders/:id/status` - Update order status

## 🔧 Cart Token Management

The API uses opaque cart tokens for guest cart management. Tokens can be provided via:

1. **Header**: `X-Cart-Token: <token>`
2. **Cookie**: `cartToken=<token>`

If no token is provided, a new cart is automatically created and the token is returned in the response.

## 💰 Promo Code System

### Types
- **Percentage**: Discount as percentage of subtotal (0-100%)
- **Fixed**: Fixed amount discount in minor units (cents)

### Rules
- Only one promo per cart
- Promos must be active and within date range
- Discounts are capped at subtotal (never negative)
- Percent discounts are rounded to nearest cent

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Categories
- **Cart Flow**: Cart creation, item management, validation
- **Promo Math**: Discount calculations, validation, edge cases
- **Checkout Idempotency**: Order creation, duplicate prevention

## 📊 Database Schema

### Core Models

```sql
-- Products with variants
Product (id, title, slug, description, images[], status, timestamps)
Variant (id, sku, options, price, currency, stock, productId)

-- Promo codes
Promo (id, code, type, value, startsAt, endsAt, active)

-- Cart system
Cart (id, token, promoCode, timestamps)
CartItem (id, sku, title, unitPrice, currency, qty, cartId)

-- Orders
Order (id, cartId, promoCode, subtotal, discount, grandTotal, status, timestamps)
OrderItem (id, sku, title, unitPrice, currency, qty, lineTotal, orderId)
```

## 🔍 Example API Usage

### 1. Browse Products

```bash
# Get all active products
curl "http://localhost:3000/api/products?status=active&page=1&limit=10"

# Get product by slug
curl "http://localhost:3000/api/products/premium-wireless-headphones"
```

### 2. Cart Operations

```bash
# Create/get cart
curl "http://localhost:3000/api/carts" \
  -H "X-Cart-Token: your-cart-token"

# Add item to cart
curl -X POST "http://localhost:3000/api/carts/items" \
  -H "X-Cart-Token: your-cart-token" \
  -H "Content-Type: application/json" \
  -d '{"sku": "HP-BLK-001", "qty": 2}'

# Apply promo code
curl -X POST "http://localhost:3000/api/carts/apply-promo" \
  -H "X-Cart-Token: your-cart-token" \
  -H "Content-Type: application/json" \
  -d '{"code": "WELCOME10"}'
```

### 3. Checkout

```bash
# Create order from cart
curl -X POST "http://localhost:3000/api/orders" \
  -H "Content-Type: application/json" \
  -d '{"cartId": "cart-uuid"}'
```

## 🛡️ Error Handling

All errors follow a consistent JSON format:

```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "path": "body.qty",
        "issue": "Must be >= 1"
      }
    ]
  }
}
```

### Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (e.g., insufficient stock)
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Access denied
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push     # Push schema to database
npm run db:migrate  # Run migrations
npm run db:seed     # Seed with demo data
npm run db:studio   # Open Prisma Studio

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### Project Structure

```
src/
├── config/         # Database and app configuration
├── controllers/    # Request handlers
├── middlewares/    # Express middlewares
├── routes/         # API route definitions
├── schemas/        # Zod validation schemas
├── services/       # Business logic
├── utils/          # Utilities and helpers
├── docs/           # OpenAPI documentation
├── seed/           # Database seeder
├── tests/          # Test files
└── index.ts        # Application entry point
```

## 🚀 Production Deployment

### Environment Variables

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Build and Deploy

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📞 Support

For questions and support, please open an issue on GitHub or contact the development team.

"# E-commerce-backend" 
"# E-commerce-backend" 
