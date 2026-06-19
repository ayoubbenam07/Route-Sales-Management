import prisma from '../config/prisma.js';

/**
 * POST /api/deals
 * Create a new deal (sale transaction)
 * Access: BUYER (or Admin acting as a buyer)
 * 
 * Body:
 * {
 *   "supermarketId": "uuid",
 *   "items": [
 *     { "productId": "uuid", "quantity": 100, "unitPrice": 450 },
 *     { "productId": "uuid", "quantity": 50, "unitPrice": 600 }
 *   ],
 *   "initialPayment": 20000
 * }
 */
export const createDeal = async (req, res) => {
  try {
    const { supermarketId, items, initialPayment } = req.body;
    const buyerId = req.user.id;

    // Validation
    if (!supermarketId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'supermarketId and items array are required'
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity || item.unitPrice === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have productId, quantity, and unitPrice'
        });
      }
      if (item.quantity <= 0 || item.unitPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be positive and unitPrice must be non-negative'
        });
      }
    }

    // Verify supermarket exists
    const supermarket = await prisma.supermarket.findUnique({
      where: { id: supermarketId }
    });

    if (!supermarket) {
      return res.status(404).json({
        success: false,
        message: 'Supermarket not found'
      });
    }

    // Verify all products exist and check stock
    const products = await prisma.product.findMany({
      where: {
        id: { in: items.map(item => item.productId) }
      }
    });

    if (products.length !== items.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more products not found'
      });
    }

    // Check if there's enough stock for each product
    const productMap = new Map(products.map(p => [p.id, p]));
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (product.stockQty < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name}. Available: ${product.stockQty}, Requested: ${item.quantity}`
        });
      }
    }

    // Calculate total deal amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    // Validate initial payment
    const paymentAmount = initialPayment || 0;
    if (paymentAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Initial payment cannot be negative'
      });
    }

    // Use Prisma transaction to ensure atomicity
    const deal = await prisma.$transaction(async (tx) => {
      // 1. Create the deal
      const newDeal = await tx.deal.create({
        data: {
          totalAmount,
          buyerId,
          supermarketId,
          status: paymentAmount >= totalAmount ? 'PAID' : (paymentAmount > 0 ? 'PARTIAL' : 'UNPAID')
        }
      });

      // 2. Create deal items and update stock
      for (const item of items) {
        // Create deal item
        await tx.dealItem.create({
          data: {
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            dealId: newDeal.id,
            productId: item.productId
          }
        });

        // Reduce product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: {
              decrement: item.quantity
            }
          }
        });
      }

      // 3. Create initial payment if any
      if (paymentAmount > 0) {
        await tx.payment.create({
          data: {
            amount: paymentAmount,
            dealId: newDeal.id,
            method: 'CASH' // Default to CASH, can be customized in future
          }
        });
      }

      // 4. Update supermarket's total debt
      const remainingDebt = totalAmount - paymentAmount;
      await tx.supermarket.update({
        where: { id: supermarketId },
        data: {
          totalDebt: {
            increment: remainingDebt
          }
        }
      });

      return newDeal;
    });

    // Fetch the complete deal with relationships
    const completeDeal = await prisma.deal.findUnique({
      where: { id: deal.id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: true,
        buyer: true,
        supermarket: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Deal created successfully',
      data: completeDeal
    });

  } catch (error) {
    console.error('Error creating deal:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create deal',
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/deals
 * Retrieve all deals
 * Access: BOTH
 * - Admins see all deals
 * - Buyers see only their own deals
 */
export const getAlldeals = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build filter conditions
    const where = {};

    // Filter by role
    if (userRole === 'BUYER') {
      where.buyerId = userId;
    }

    // Filter by status if provided
    if (status) {
      const validStatuses = ['UNPAID', 'PARTIAL', 'PAID'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
      where.status = status;
    }

    const deals = await prisma.deal.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: true,
        buyer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        supermarket: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            totalDebt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Deals retrieved successfully',
      data: deals,
      count: deals.length
    });

  } catch (error) {
    console.error('Error fetching deals:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve deals',
      error: 'Internal server error'
    });
  }
};

/**
 * GET /api/deals/:id
 * Retrieve a single deal with full receipt/invoice details
 * Access: BOTH
 * - Admins can see any deal
 * - Buyers can only see their own deals
 */
export const getDealById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch the deal
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                basePrice: true
              }
            }
          }
        },
        payments: {
          orderBy: {
            paymentDate: 'asc'
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        supermarket: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            totalDebt: true
          }
        }
      }
    });

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Authorization check: Buyers can only see their own deals
    if (userRole === 'BUYER' && deal.buyerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own deals'
      });
    }

    // Calculate payment summary
    const totalPaid = deal.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingBalance = deal.totalAmount - totalPaid;

    // Build receipt/invoice layout
    const receipt = {
      ...deal,
      paymentSummary: {
        totalAmount: deal.totalAmount,
        totalPaid,
        remainingBalance,
        paymentCount: deal.payments.length
      },
      itemSummary: {
        totalItems: deal.items.length,
        totalQuantity: deal.items.reduce((sum, item) => sum + item.quantity, 0)
      }
    };

    return res.status(200).json({
      success: true,
      message: 'Deal retrieved successfully',
      data: receipt
    });

  } catch (error) {
    console.error('Error fetching deal:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve deal',
      error: 'Internal server error'
    });
  }
};
