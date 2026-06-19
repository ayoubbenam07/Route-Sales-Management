# Route Sales Management Backend API Documentation

## Overview

This document describes the backend API for the Route Sales Management application. The backend is built with Express.js and Prisma, and exposes endpoints for authentication, products, supermarkets, deals, payments, and analytics.

Base URL: `http://localhost:<PORT>/api`

> Default port is `5000` unless configured using `PORT` in `.env`.

---

## Authentication

### Authentication mechanism

- `JWT_SECRET` must be defined in environment variables.
- Authentication is enforced using `protectRoute` middleware.
- Clients can send the JWT either:
  - in the `Authorization` header as `Bearer <token>`
  - or as a cookie named `jwt`
- Login and register endpoints set the JWT cookie automatically.

### Common response format

Most endpoints return a JSON body with the following structure:

- `success` (`boolean`)
- `message` (`string`) when present
- `data` (`object` / `array`) when present
- `error` (`string`) on server or validation failures
- `count` (`number`) for list endpoints

### Errors and status codes

- `200 OK` for successful retrieval and updates
- `201 Created` for successful creation
- `400 Bad Request` for validation or malformed request data
- `401 Unauthorized` when token is missing or invalid
- `403 Forbidden` when user role does not permit access
- `404 Not Found` when requested resource does not exist
- `409 Conflict` for duplicate or conflicting resources
- `500 Internal Server Error` for unexpected server failures

---

## Health Check

### GET `/api/health`

Returns server health and port.

Request:
- No body

Response:
```json
{
  "status": "Server is running",
  "port": 5000
}
```

---

## Auth Routes

### POST `/api/auth/register`

Register an admin user. Intended for initial setup.

Request body:
```json
{
  "name": "Admin Name",
  "phone": "0123456789",
  "password": "password123"
}
```

Success response (`201`):
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "id": "uuid",
    "name": "Admin Name",
    "phone": "0123456789",
    "role": "ADMIN"
  }
}
```

Notes:
- Password must be at least 6 characters.
- Phone must be unique.
- Response sets a `jwt` cookie.

Errors:
- `400` when required fields are missing or password is too short.
- `409` when phone is already registered.

---

### POST `/api/auth/login`

Log in an existing user and issue a JWT.

Request body:
```json
{
  "phone": "0123456789",
  "password": "password123"
}
```

Success response (`200`):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "uuid",
    "name": "User Name",
    "phone": "0123456789",
    "role": "ADMIN" | "BUYER"
  }
}
```

Notes:
- Sets the `jwt` cookie on success.
- The JWT expires in 30 days.

Errors:
- `400` when required fields are missing.
- `401` when credentials do not match.

---

### POST `/api/auth/create_buyer`

Create a buyer user. Requires admin privileges.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Request body:
```json
{
  "name": "Buyer Name",
  "phone": "0987654321",
  "password": "secret123"
}
```

Success response (`201`):
```json
{
  "success": true,
  "message": "Buyer created successfully",
  "data": {
    "id": "uuid",
    "name": "Buyer Name",
    "phone": "0987654321",
    "role": "BUYER"
  }
}
```

Errors:
- `400` missing required fields or invalid password length.
- `403` when authenticated user is not an admin.
- `409` when phone number is already registered.

---

### POST `/api/auth/logout`

Logout and clear the JWT cookie.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Success response (`200`):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Products Routes

All product routes are protected by `protectRoute` and require authentication.

### GET `/api/products`

Retrieve all products.

Response (`200`):
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "basePrice": 120.5,
      "stockQty": 100
    }
  ],
  "count": 1
}
```

---

### POST `/api/products`

Create a new product. Requires `ADMIN` role.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Request body:
```json
{
  "name": "New Product",
  "basePrice": 150.0,
  "stockQty": 50
}
```

Success response (`201`):
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "uuid",
    "name": "New Product",
    "basePrice": 150.0,
    "stockQty": 50
  }
}
```

Errors:
- `400` when fields are missing or invalid.
- `403` when user is not admin.

---

### PUT `/api/products/:id`

Update an existing product. Requires `ADMIN`.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Path parameters:
- `id` — product UUID

Request body (one or more fields):
```json
{
  "name": "Updated Name",
  "basePrice": 160.0,
  "stockQty": 75
}
```

Success response (`200`):
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "basePrice": 160.0,
    "stockQty": 75
  }
}
```

Errors:
- `400` when no update fields are provided or validation fails.
- `404` when the product is not found.

---

### DELETE `/api/products/:id`

Delete a product. Requires `ADMIN`.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Path parameters:
- `id` — product UUID

Success response (`200`):
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    "id": "uuid"
  }
}
```

Errors:
- `404` when product is not found.
- `400` when the product is linked to deals and cannot be deleted.

---

## Supermarkets Routes

All supermarket routes are protected by `protectRoute` and require authentication.

### GET `/api/supermarkets`

Retrieve all supermarkets.

Response (`200`):
```json
{
  "success": true,
  "message": "Supermarkets retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "name": "Market Name",
      "phone": "0123456789",
      "address": "123 Street",
      "totalDebt": 12000.0
    }
  ],
  "count": 1
}
```

---

### GET `/api/supermarkets/:id`

Retrieve one supermarket with its deals and payments history.

Path parameters:
- `id` — supermarket UUID

Response (`200`):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Market Name",
    "phone": "0123456789",
    "address": "123 Street",
    "totalDebt": 12000.0,
    "deals": [
      {
        "id": "uuid",
        "totalAmount": 5000.0,
        "status": "PARTIAL",
        "buyer": { "id": "uuid", "name": "Buyer", "phone": "0987654321" },
        "items": [
          {
            "id": "uuid",
            "quantity": 10,
            "unitPrice": 450,
            "product": { "id": "uuid", "name": "Product" }
          }
        ],
        "payments": [
          {
            "id": "uuid",
            "amount": 2000,
            "paymentDate": "2026-06-19T...Z",
            "method": "CASH"
          }
        ]
      }
    ]
  }
}
```

Errors:
- `404` when the supermarket is not found.

---

### POST `/api/supermarkets`

Create a supermarket. Accessible to both `ADMIN` and `BUYER`.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Request body:
```json
{
  "name": "New Market",
  "phone": "0123456789",
  "address": "123 Market Street"
}
```

Success response (`201`):
```json
{
  "success": true,
  "message": "Supermarket created",
  "data": {
    "id": "uuid",
    "name": "New Market",
    "phone": "0123456789",
    "address": "123 Market Street",
    "totalDebt": 0
  }
}
```

Errors:
- `400` when required fields are missing.
- `409` when a supermarket with the same phone already exists.

---

### PUT `/api/supermarkets/:id`

Update a supermarket. Accessible to both `ADMIN` and `BUYER`.

Path parameters:
- `id` — supermarket UUID

Request body (one or more fields):
```json
{
  "name": "Updated Market",
  "phone": "0987654321",
  "address": "Updated address"
}
```

Success response (`200`):
```json
{
  "success": true,
  "message": "Supermarket updated",
  "data": {
    "id": "uuid",
    "name": "Updated Market",
    "phone": "0987654321",
    "address": "Updated address",
    "totalDebt": 0
  }
}
```

Errors:
- `400` when no update fields are provided.
- `404` when the supermarket is not found.

---

### DELETE `/api/supermarkets/:id`

Delete a supermarket. Accessible to both `ADMIN` and `BUYER`.

Path parameters:
- `id` — supermarket UUID

Success response (`200`):
```json
{
  "success": true,
  "message": "Supermarket deleted",
  "data": {
    "id": "uuid"
  }
}
```

Errors:
- `404` when supermarket is not found.
- `400` when the supermarket cannot be deleted due to related deals or payments.

---

## Deals Routes

All deal routes are protected and require authentication.

### POST `/api/deals`

Create a new deal (sale transaction). Accessible to both `BUYER` and `ADMIN` when acting as buyer.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Request body:
```json
{
  "supermarketId": "uuid",
  "items": [
    { "productId": "uuid", "quantity": 100, "unitPrice": 450 },
    { "productId": "uuid", "quantity": 50, "unitPrice": 600 }
  ],
  "initialPayment": 20000
}
```

Success response (`201`):
```json
{
  "success": true,
  "message": "Deal created successfully",
  "data": {
    "id": "uuid",
    "totalAmount": 65000,
    "status": "PARTIAL",
    "buyerId": "uuid",
    "supermarketId": "uuid",
    "items": [ ... ],
    "payments": [ ... ],
    "buyer": { ... },
    "supermarket": { ... }
  }
}
```

Business rules:
- Each item must include `productId`, `quantity`, and `unitPrice`.
- `quantity` must be positive.
- `unitPrice` must be zero or greater.
- The system verifies product stock and decrements stock quantities.
- Supermarket `totalDebt` is incremented by `totalAmount - initialPayment`.

Errors:
- `400` for invalid request data.
- `404` when supermarket or product is not found.

---

### GET `/api/deals`

Retrieve deals.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Query parameters:
- `status` (optional): one of `UNPAID`, `PARTIAL`, `PAID`

Behavior:
- `ADMIN` users receive all deals.
- `BUYER` users receive only their own deals.

Success response (`200`):
```json
{
  "success": true,
  "message": "Deals retrieved successfully",
  "data": [ ... ],
  "count": 3
}
```

---

### GET `/api/deals/:id`

Retrieve a single deal with invoice-style details.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Path parameters:
- `id` — deal UUID

Success response (`200`):
```json
{
  "success": true,
  "message": "Deal retrieved successfully",
  "data": {
    "id": "uuid",
    "createdAt": "2026-06-19T...Z",
    "totalAmount": 50000,
    "status": "PARTIAL",
    "buyer": { ... },
    "supermarket": { ... },
    "items": [ ... ],
    "payments": [ ... ],
    "paymentSummary": {
      "totalAmount": 50000,
      "totalPaid": 20000,
      "remainingBalance": 30000,
      "paymentCount": 1
    },
    "itemSummary": {
      "totalItems": 2,
      "totalQuantity": 150
    }
  }
}
```

Authorization:
- `ADMIN` may retrieve any deal.
- `BUYER` may retrieve only their own deals.

Errors:
- `403` when buyer requests another buyer's deal.
- `404` when the deal is not found.

---

### PUT `/api/deals/:id`

Update a deal. Accessible to `ADMIN` or the deal owner `BUYER`.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Path parameters:
- `id` — deal UUID

Request body (all fields optional):
```json
{
  "supermarketId": "uuid",
  "items": [
    { "dealItemId": "uuid", "quantity": 110, "unitPrice": 460 },
    { "productId": "uuid", "quantity": 20, "unitPrice": 500 }
  ],
  "paymentAmount": 5000,
  "paymentMethod": "CASH",
  "status": "PARTIAL"
}
```

Notes:
- The route is designed for full deal updates.
- If `supermarketId` changes, the debt is adjusted accordingly.
- Items may be updated by `dealItemId` or added as new entries using `productId`.

Success response (`200`):
```json
{
  "success": true,
  "message": "Deal updated successfully",
  "data": { ... }
}
```

Errors:
- `403` when buyer is not the deal creator.
- `404` when deal is not found.
- `400` when request payload is invalid.

---

### DELETE `/api/deals/:id`

Delete a deal.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Path parameters:
- `id` — deal UUID

Success response (`200`):
```json
{
  "success": true,
  "message": "Deal deleted successfully",
  "data": {
    "id": "uuid"
  }
}
```

Errors:
- `404` when deal is not found.
- `403` when buyer is not the deal owner.

---

## Payment Routes

All payment routes are protected and require authentication.

### POST `/api/payment`

Create a payment for a deal.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Request body:
```json
{
  "dealId": "uuid",
  "amount": 15000,
  "method": "CASH"
}
```

Success response (`201`):
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "id": "uuid",
    "amount": 15000,
    "paymentDate": "2026-06-19T...Z",
    "method": "CASH",
    "dealId": "uuid"
  }
}
```

Business rules:
- `amount` must be positive.
- `method` must be one of `CASH`, `CHECK`.
- Payment cannot exceed the remaining deal balance.
- Deal status is updated to `PARTIAL` or `PAID` as needed.
- Supermarket `totalDebt` is decremented by the payment amount.

Errors:
- `403` when buyer attempts to pay a deal they do not own.
- `404` when the deal is not found.
- `400` for invalid amount or overpayment.

---

### GET `/api/payment`

Retrieve payments.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Query parameters:
- `sort` (optional): `asc` or `desc` (defaults to `desc`)

Behavior:
- `ADMIN` sees all payments.
- `BUYER` sees payments on their own deals only.

Success response (`200`):
```json
{
  "success": true,
  "message": "Payments retrieved successfully",
  "data": [ ... ],
  "count": 5
}
```

---

### PUT `/api/payment/:id`

Update an existing payment.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Path parameters:
- `id` — payment UUID

Request body:
```json
{
  "amount": 20000,
  "method": "CHECK"
}
```

Success response (`200`):
```json
{
  "success": true,
  "message": "Payment updated successfully",
  "data": {
    "id": "uuid",
    "amount": 20000,
    "paymentDate": "2026-06-19T...Z",
    "method": "CHECK",
    "dealId": "uuid"
  }
}
```

Business rules:
- Must not exceed the total deal amount after update.
- Deal status and supermarket debt are adjusted accordingly.

Errors:
- `403` when buyer updates a payment for another user's deal.
- `404` when payment is not found.
- `400` if updated amount is invalid or exceeds deal balance.

---

### DELETE `/api/payment/:id`

Delete a payment.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Path parameters:
- `id` — payment UUID

Success response (`200`):
```json
{
  "success": true,
  "message": "Payment deleted successfully",
  "data": { "id": "uuid" }
}
```

Behavior:
- Deal status and supermarket debt are adjusted after deletion.

Errors:
- `403` when buyer attempts to delete a payment for another user's deal.
- `404` when payment is not found.

---

## Analytics Routes

All analytics routes are protected.

### GET `/api/analytics/admin-dashboard`

Admin dashboard analytics. Requires `ADMIN`.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Success response (`200`):
```json
{
  "success": true,
  "data": {
    "totalSalesRevenue": 120000.0,
    "totalGlobalOutstandingMarketDebt": 45000.0,
    "topPerformingBuyers": [
      {
        "buyerId": "uuid",
        "name": "Buyer Name",
        "phone": "0987654321",
        "totalSales": 50000.0,
        "dealsCount": 4
      }
    ],
    "stockWarnings": [
      {
        "productId": "uuid",
        "name": "Product Name",
        "stockQty": 5,
        "basePrice": 120.0,
        "warning": "Low stock"
      }
    ]
  }
}
```

---

### GET `/api/analytics/buyer-dashboard`

Buyer dashboard analytics. Requires `BUYER`.

Headers:
- `Authorization: Bearer <token>` or cookie `jwt`

Success response (`200`):
```json
{
  "success": true,
  "data": {
    "totalSalesThisMonth": 30000.0,
    "totalDebtResponsible": 12000.0,
    "recentDeals": [
      {
        "id": "uuid",
        "createdAt": "2026-06-01T...Z",
        "status": "PARTIAL",
        "totalAmount": 25000.0,
        "totalPaid": 13000.0,
        "remainingBalance": 12000.0,
        "supermarket": {
          "id": "uuid",
          "name": "Market Name"
        }
      }
    ]
  }
}
```

---

## Prisma Data Model Reference

### Enums

- `Role`
  - `ADMIN`
  - `BUYER`

- `DealStatus`
  - `UNPAID`
  - `PARTIAL`
  - `PAID`

- `PaymentMethod`
  - `CASH`
  - `CHECK`
  - `TRANSFER`

### Models

#### User
- `id` (`String`, UUID)
- `name` (`String`)
- `phone` (`String`, unique)
- `password` (`String`)
- `role` (`Role`)
- `createdAt` (`DateTime`)
- Relations: `deals`

#### Product
- `id` (`String`, UUID)
- `name` (`String`)
- `basePrice` (`Float`)
- `stockQty` (`Float`)
- Relations: `dealItems`

#### Supermarket
- `id` (`String`, UUID)
- `name` (`String`)
- `phone` (`String`)
- `address` (`String?`)
- `totalDebt` (`Float`)
- Relations: `deals`

#### Deal
- `id` (`String`, UUID)
- `createdAt` (`DateTime`)
- `totalAmount` (`Float`)
- `status` (`DealStatus`)
- `buyerId` (`String`)
- `supermarketId` (`String`)
- Relations: `items`, `payments`

#### DealItem
- `id` (`String`, UUID)
- `quantity` (`Float`)
- `unitPrice` (`Float`)
- `dealId` (`String`)
- `productId` (`String`)

#### Payment
- `id` (`String`, UUID)
- `amount` (`Float`)
- `paymentDate` (`DateTime`)
- `method` (`PaymentMethod`)
- `dealId` (`String`)

---

## Authentication Flow

1. Register the first admin using `/api/auth/register`.
2. Login using `/api/auth/login`.
3. Use the returned cookie or bearer token for protected requests.
4. Admin can create buyers with `/api/auth/create_buyer`.

---

## Usage Notes

- Use `Bearer` header when calling from external tools like Postman or frontend clients.
- The backend also accepts cookie-based authentication from browser requests.
- `ADMIN` controls product management and buyer creation.
- `BUYER` can create deals, view their deals/payments, and use buyer analytics.
- `Supermarket.totalDebt` is updated automatically by deals and payments.

---

## Examples

### Login example

Request:
```http
POST /api/auth/login
Content-Type: application/json

{
  "phone": "0123456789",
  "password": "secret123"
}
```

### Create product example

Request:
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Premium Dates",
  "basePrice": 220.50,
  "stockQty": 120
}
```

### Create deal example

Request:
```http
POST /api/deals
Authorization: Bearer <token>
Content-Type: application/json

{
  "supermarketId": "uuid",
  "items": [
    { "productId": "uuid", "quantity": 20, "unitPrice": 200 },
    { "productId": "uuid", "quantity": 10, "unitPrice": 180 }
  ],
  "initialPayment": 3000
}
```

---

## Contact

If you need further details about endpoints or request shapes, inspect the controller files in `backend/src/controllers`.
