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

    const uniqueProductIds = new Set(items.map(item => item.productId));
    if (products.length !== uniqueProductIds.size) {
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

/**
 * PUT /api/deals/:id
 * Update a deal - modify everything (items, supermarket, payments, status)
 * Access: ADMIN or BUYER (creator only)
 * 
 * Body (all optional):
 * {
 *   "supermarketId": "uuid",
 *   "items": [
 *     { "dealItemId": "uuid", "quantity": 100, "unitPrice": 450 },
 *     { "productId": "uuid", "quantity": 50, "unitPrice": 600 }
 *   ],
 *   "paymentAmount": 5000,
 *   "paymentMethod": "CASH" | "CHECK" | "TRANSFER",
 *   "status": "UNPAID" | "PARTIAL" | "PAID"
 * }
 */
export const putDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { supermarketId, items, paymentAmount, paymentMethod, status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch the deal
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
        supermarket: true
      }
    });

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Authorization check: Only admin or deal creator can update
    if (userRole === 'BUYER' && deal.buyerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins or deal creator can update this deal'
      });
    }

    // Use transaction for all updates
    const updatedDeal = await prisma.$transaction(async (tx) => {
      let newTotalAmount = deal.totalAmount;
      let debtAdjustment = 0;

      // 1. Update supermarket if provided
      if (supermarketId && supermarketId !== deal.supermarketId) {
        const newSupermarket = await tx.supermarket.findUnique({
          where: { id: supermarketId }
        });

        if (!newSupermarket) {
          throw new Error('New supermarket not found');
        }

        // Reverse debt from old supermarket
        await tx.supermarket.update({
          where: { id: deal.supermarketId },
          data: {
            totalDebt: {
              decrement: deal.totalAmount - (deal.payments.reduce((sum, p) => sum + p.amount, 0))
            }
          }
        });
      }

      // 2. Update items if provided
      if (items && Array.isArray(items)) {
        // Validate items
        for (const item of items) {
          if ((!item.dealItemId && !item.productId) || !item.quantity || item.unitPrice === undefined) {
            throw new Error('Each item must have (dealItemId or productId), quantity, and unitPrice');
          }
          if (item.quantity <= 0 || item.unitPrice < 0) {
            throw new Error('Quantity must be positive and unitPrice must be non-negative');
          }
        }

        // Get all current deal items
        const currentItems = await tx.dealItem.findMany({
          where: { dealId: id },
          include: { product: true }
        });

        // Separate items into updates and new items
        const itemsToUpdate = items.filter(i => i.dealItemId);
        const itemsToCreate = items.filter(i => !i.dealItemId && i.productId);

        // Calculate stock adjustments for existing items being modified
        for (const updateItem of itemsToUpdate) {
          const currentItem = currentItems.find(ci => ci.id === updateItem.dealItemId);
          if (currentItem) {
            const quantityDiff = updateItem.quantity - currentItem.quantity;
            
            // Adjust stock
            if (quantityDiff !== 0) {
              await tx.product.update({
                where: { id: currentItem.productId },
                data: {
                  stockQty: {
                    decrement: quantityDiff
                  }
                }
              });
            }

            // Update deal item
            await tx.dealItem.update({
              where: { id: updateItem.dealItemId },
              data: {
                quantity: updateItem.quantity,
                unitPrice: updateItem.unitPrice
              }
            });
          }
        }

        // Add new items
        for (const newItem of itemsToCreate) {
          const product = await tx.product.findUnique({
            where: { id: newItem.productId }
          });

          if (!product) {
            throw new Error(`Product ${newItem.productId} not found`);
          }

          if (product.stockQty < newItem.quantity) {
            throw new Error(`Insufficient stock for product ${product.name}`);
          }

          // Create deal item
          await tx.dealItem.create({
            data: {
              quantity: newItem.quantity,
              unitPrice: newItem.unitPrice,
              dealId: id,
              productId: newItem.productId
            }
          });

          // Reduce stock
          await tx.product.update({
            where: { id: newItem.productId },
            data: {
              stockQty: {
                decrement: newItem.quantity
              }
            }
          });
        }

        // Recalculate total amount
        const updatedItems = await tx.dealItem.findMany({
          where: { dealId: id }
        });
        newTotalAmount = updatedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      }

      // 3. Add payment if provided
      if (paymentAmount !== undefined && paymentAmount > 0) {
        const totalPaid = deal.payments.reduce((sum, p) => sum + p.amount, 0);
        const remainingBalance = newTotalAmount - totalPaid;

        if (paymentAmount > remainingBalance) {
          throw new Error(`Payment exceeds remaining balance. Remaining: ${remainingBalance}`);
        }

        await tx.payment.create({
          data: {
            amount: paymentAmount,
            dealId: id,
            method: paymentMethod || 'CASH'
          }
        });
      }

      // 4. Update deal with new amount and/or status
      const updatedPaymentTotal = await tx.payment.aggregate({
        where: { dealId: id },
        _sum: { amount: true }
      });

      const totalPaid = updatedPaymentTotal._sum.amount || 0;
      const finalStatus = status || (
        totalPaid >= newTotalAmount ? 'PAID' : 
        (totalPaid > 0 ? 'PARTIAL' : 'UNPAID')
      );

      const updated = await tx.deal.update({
        where: { id },
        data: {
          totalAmount: newTotalAmount,
          status: finalStatus,
          ...(supermarketId && supermarketId !== deal.supermarketId && { supermarketId })
        }
      });

      // 5. Update supermarket debt
      const newSupermarketId = supermarketId || deal.supermarketId;
      const newRemainBalance = newTotalAmount - totalPaid;
      const oldRemainBalance = deal.totalAmount - deal.payments.reduce((sum, p) => sum + p.amount, 0);

      if (supermarketId && supermarketId !== deal.supermarketId) {
        // Old supermarket debt already reversed in step 1, increment new supermarket
        await tx.supermarket.update({
          where: { id: newSupermarketId },
          data: {
            totalDebt: {
              increment: newRemainBalance
            }
          }
        });
      } else {
        // Same supermarket, only adjust by the difference
        const debtDelta = newRemainBalance - oldRemainBalance;
        if (debtDelta !== 0) {
          await tx.supermarket.update({
            where: { id: newSupermarketId },
            data: {
              totalDebt: debtDelta > 0
                ? { increment: debtDelta }
                : { decrement: Math.abs(debtDelta) }
            }
          });
        }
      }

      return updated;
    });

    // Fetch complete updated deal
    const completeDeal = await prisma.deal.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        payments: true,
        buyer: {
          select: { id: true, name: true, phone: true }
        },
        supermarket: {
          select: { id: true, name: true, phone: true, address: true, totalDebt: true }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Deal updated successfully',
      data: completeDeal
    });

  } catch (error) {
    console.error('Error updating deal:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update deal',
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * DELETE /api/deals/:id
 * Delete a deal and reverse all associated changes
 * Access: ADMIN only
 * 
 * Reverses:
 * - Returns stock quantities to products
 * - Reduces supermarket's totalDebt
 * - Deletes all payments and deal items
 */
export const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admins or the buyer who created the deal can delete it
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true
      }
    });

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    if (userRole !== 'ADMIN' && deal.buyerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins or the deal creator can delete this deal'
      });
    }

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Return stock quantities to products
      for (const item of deal.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQty: {
              increment: item.quantity
            }
          }
        });
      }

      // 2. Calculate total paid amounts to reverse from supermarket debt
      const totalPaid = deal.payments.reduce((sum, p) => sum + p.amount, 0);
      const debtToReverse = deal.totalAmount - totalPaid; // Only reverse the unpaid remaining balance

      await tx.supermarket.update({
        where: { id: deal.supermarketId },
        data: {
          totalDebt: {
            decrement: debtToReverse
          }
        }
      });

      // 3. Delete payments
      await tx.payment.deleteMany({
        where: { dealId: id }
      });

      // 4. Delete deal items
      await tx.dealItem.deleteMany({
        where: { dealId: id }
      });

      // 5. Delete deal
      await tx.deal.delete({
        where: { id }
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Deal deleted successfully. Stock and debt have been reversed.',
      data: {
        dealId: id,
        action: 'deleted',
        reversedDebt: deal.totalAmount,
        itemsRestocked: deal.items.length
      }
    });

  } catch (error) {
    console.error('Error deleting deal:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete deal',
      error: 'Internal server error'
    });
  }
};
