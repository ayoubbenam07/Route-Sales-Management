import prisma from '../config/prisma.js';

/**
 * List all supermarkets with their contact info and cached totalDebt
 */
export const getAllSupermarkets = async (req, res) => {
  try {
    const supermarkets = await prisma.supermarket.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        totalDebt: true
      },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({
      success: true,
      message: 'Supermarkets retrieved successfully',
      data: supermarkets,
      count: supermarkets.length
    });
  } catch (error) {
    console.error('Error fetching supermarkets:', error);
    return res.status(500).json({ success: false, message: 'Error fetching supermarkets', error: "Internal Server Error" });
  }
};

/**
 * Get a supermarket by id with its deals and payments history
 */
export const getSupermarketById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Supermarket ID is required' });
    }

    const supermarket = await prisma.supermarket.findUnique({
      where: { id },
      include: {
        deals: {
          orderBy: { createdAt: 'desc' },
          include: {
            buyer: { select: { id: true, name: true, phone: true } },
            items: { include: { product: { select: { id: true, name: true } } } },
            payments: { orderBy: { paymentDate: 'desc' } }
          }
        }
      }
    });

    if (!supermarket) {
      return res.status(404).json({ success: false, message: 'Supermarket not found' });
    }

    return res.status(200).json({ success: true, data: supermarket });
  } catch (error) {
    console.error('Error fetching supermarket:', error);
    return res.status(500).json({ success: false, message: 'Error fetching supermarket', error: "Internal Server Error" });
  }
};

/**
 * Create a new supermarket (accessible to both Admin and Buyer)
 */
export const createSupermarket = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    // Optional: check for existing by phone (use findFirst because `phone` is not a unique field)
    const existing = await prisma.supermarket.findFirst({ where: { phone: String(phone) } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Supermarket with this phone already exists' });
    }

    const created = await prisma.supermarket.create({ data: { name: name.trim(), phone: String(phone), address: address ? String(address).trim() : null } });

    return res.status(201).json({ success: true, message: 'Supermarket created', data: created });
  } catch (error) {
    console.error('Error creating supermarket:', error);
    return res.status(500).json({ success: false, message: 'Error creating supermarket', error: "Internal Server Error" });
  }
};

/**
 * Update a supermarket (accessible to both Admin and Buyer)
 */
export const putSupermarket = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;

    if (!id) return res.status(400).json({ success: false, message: 'Supermarket ID is required' });
    if (!name && phone === undefined && address === undefined) return res.status(400).json({ success: false, message: 'At least one field is required to update' });

    const existing = await prisma.supermarket.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Supermarket not found' });

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (phone !== undefined) data.phone = String(phone);
    if (address !== undefined) data.address = address ? String(address).trim() : null;

    const updated = await prisma.supermarket.update({ where: { id }, data });

    return res.status(200).json({ success: true, message: 'Supermarket updated', data: updated });
  } catch (error) {
    console.error('Error updating supermarket:', error);
    return res.status(500).json({ success: false, message: 'Error updating supermarket', error: "Internal Server Error" });
  }
};

/**
 * Delete a supermarket (accessible to both Admin and Buyer)
 */
export const deleteSupermarket = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Supermarket ID is required' });

    const existing = await prisma.supermarket.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Supermarket not found' });

    // Attempt delete
    const deleted = await prisma.supermarket.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Supermarket deleted', data: deleted });
  } catch (error) {
    console.error('Error deleting supermarket:', error);
    // handle foreign key constraint errors
    if (error.code === 'P2003' || error.code === 'P2014') {
      return res.status(400).json({ success: false, message: 'Cannot delete supermarket with related deals/payments' });
    }
    return res.status(500).json({ success: false, message: 'Error deleting supermarket', error: "Internal Server Error" });
  }
};
