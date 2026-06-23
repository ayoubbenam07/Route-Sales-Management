import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import { generateToken } from '../lib/utils.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

/**
 * Register Admin (Only for initial setup)
 */
export const register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Validation
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    try {
      const existingUser = await prisma.user.findUnique({
        where: { phone: String(phone) }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Phone number already registered'
        });
      }
    } catch (dbError) {
      console.error('Database error during findUnique:', dbError);
      throw dbError;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        name: String(name),
        phone: String(phone),
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    // Generate token
    const token = generateToken(user.id, user.role, res);

    return res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: 'Internal server error',
      details: error.meta || error.clientVersion || 'Unknown error'
    });
  }
};

/**
 * Create Buyer (Admin creates buyers) — simplified: create only, no token
 */
export const create_buyer = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Validation
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: String(phone) }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create buyer user
    const user = await prisma.user.create({
      data: {
        name: String(name),
        phone: String(phone),
        password: hashedPassword,
        role: 'BUYER'
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Buyer created successfully',
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create buyer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Buyer creation failed',
      error: 'Internal server error'
    });
  }
};

/**
 * Login
 */
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validation
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone and password are required'
      });
    }

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password'
      });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role, res);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: 'Internal server error'
    });
  }
};

/**
 * Get all buyers (admin)
 */
export const getBuyers = async (req, res) => {
  try {
    const buyers = await prisma.user.findMany({
      where: { role: 'BUYER' },
      select: {
        id: true,
        name: true,
        phone: true,
        _count: { select: { deals: true } },
        deals: {
          select: { totalAmount: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const result = buyers.map((b) => ({
      id: b.id,
      name: b.name,
      phone: b.phone,
      dealsCount: b._count.deals,
      totalSales: b.deals.reduce((s, d) => s + d.totalAmount, 0)
    }));

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Get buyers error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Update buyer (admin)
 */
export const updateBuyer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, password } = req.body;

    const buyer = await prisma.user.findUnique({ where: { id } });
    if (!buyer || buyer.role !== 'BUYER') {
      return res.status(404).json({ success: false, message: 'Buyer not found' });
    }

    const updateData = {};
    if (name) updateData.name = String(name);
    if (phone) {
      // Check uniqueness if phone changed
      if (phone !== buyer.phone) {
        const existing = await prisma.user.findUnique({ where: { phone: String(phone) } });
        if (existing) {
          return res.status(409).json({ success: false, message: 'Phone already in use' });
        }
      }
      updateData.phone = String(phone);
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, phone: true, role: true }
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update buyer error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Logout
 */
export const logout = async (req, res) => {
  try {
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: 'Internal server error'
    });
  }
};