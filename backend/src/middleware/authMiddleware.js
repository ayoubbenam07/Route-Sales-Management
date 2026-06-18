import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET;

function parseCookieHeader(cookieHeader) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map(p => p.trim());
  for (const part of parts) {
    const [k, v] = part.split('=');
    if (k === 'jwt') return decodeURIComponent(v);
  }
  return null;
}

export const protectRoute = async (req, res, next) => {
  if (!JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'JWT_SECRET is not defined' });
  }

  try {
    let token;

    // Prefer Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } else if (req.headers.cookie) {
      token = parseCookieHeader(req.headers.cookie);
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized - token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
      return res.status(401).json({ success: false, message: msg });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Attach a minimal user object to request
    req.user = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('error in protectRoute middleware', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required' });
  }
  next();
};

export const isBuyer = (req, res, next) => {
  if (!req.user || req.user.role !== 'BUYER') {
    return res.status(403).json({ success: false, message: 'Access denied. Buyer privileges required' });
  }
  next();
};
