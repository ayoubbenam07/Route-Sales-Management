# Authentication API Documentation

## Base URL
```
http://localhost:5001/api/auth
```

## Endpoints

### 1. Register Admin
**POST** `/register`

Register the first admin user for your system.

**Request Body:**
```json
{
  "name": "Admin Name",
  "phone": "213791234567",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "id": "uuid-here",
    "name": "Admin Name",
    "phone": "213791234567",
    "role": "ADMIN",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Register Buyer
**POST** `/register_buyer`

Admin or system registers a new buyer/agent.

**Request Body:**
```json
{
  "name": "Buyer Name",
  "phone": "213799876543",
  "password": "buyerPassword123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Buyer registered successfully",
  "data": {
    "id": "uuid-here",
    "name": "Buyer Name",
    "phone": "213799876543",
    "role": "BUYER",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Login
**POST** `/login`

Login with phone and password to get a JWT token.

**Request Body:**
```json
{
  "phone": "213791234567",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "uuid-here",
    "name": "Admin Name",
    "phone": "213791234567",
    "role": "ADMIN",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 4. Logout
**POST** `/logout`

Logout (token is removed client-side).

**Request Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## Authentication Usage

### Using Token in Protected Routes

After login/register, include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Name, phone, and password are required"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Invalid phone or password"
}
```

### 409 - Conflict (Phone already registered)
```json
{
  "success": false,
  "message": "Phone number already registered"
}
```

### 403 - Forbidden (Invalid Token)
```json
{
  "success": false,
  "message": "Invalid token"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Registration failed",
  "error": "error details"
}
```

---

## Testing with cURL

### Register Admin
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "phone": "213791234567",
    "password": "admin123"
  }'
```

### Register Buyer
```bash
curl -X POST http://localhost:5001/api/auth/register_buyer \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Buyer One",
    "phone": "213799876543",
    "password": "buyer123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "213791234567",
    "password": "admin123"
  }'
```

### Logout
```bash
curl -X POST http://localhost:5001/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Implementation Notes

1. **Token Expiry**: Tokens expire after 7 days
2. **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
3. **Phone Uniqueness**: Phone numbers must be unique in the system
4. **Password Minimum Length**: 6 characters
5. **Role-based Access**: Check user role (ADMIN/BUYER) in protected routes

