import prisma from '../config/prisma.js';

const validMethods = ['CASH', 'CHECK'];

export const createPayment = async (req, res) => {
  try {
    const { dealId, amount, method } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!dealId || amount === undefined || amount === null || !method) {
      return res.status(400).json({
        success: false,
        message: 'dealId, amount, and method are required'
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'amount must be a positive number'
      });
    }

    if (!validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: `method must be one of: ${validMethods.join(', ')}`
      });
    }

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        payments: true,
        supermarket: true,
        buyer: true
      }
    });

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    if (userRole === 'BUYER' && deal.buyerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only add payments to your own deals.'
      });
    }

    const totalPaid = deal.payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingBalance = deal.totalAmount - totalPaid;

    if (remainingBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This deal is already fully paid.'
      });
    }

    if (amount > remainingBalance) {
      return res.status(400).json({
        success: false,
        message: `Payment exceeds remaining balance. Remaining amount: ${remainingBalance}`
      });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          amount,
          method,
          dealId
        }
      });

      const newTotalPaid = totalPaid + amount;
      const newStatus = newTotalPaid >= deal.totalAmount ? 'PAID' : 'PARTIAL';
      const debtReduction = amount;

      await tx.deal.update({
        where: { id: dealId },
        data: {
          status: newStatus
        }
      });

      await tx.supermarket.update({
        where: { id: deal.supermarketId },
        data: {
          totalDebt: {
            decrement: debtReduction
          }
        }
      });

      return newPayment;
    });

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: 'Internal server error'
    });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { sort = 'desc' } = req.query;

    const orderDirection = sort.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where = {};

    if (userRole === 'BUYER') {
      where.deal = {
        buyerId: userId
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        deal: {
          include: {
            buyer: {
              select: { id: true, name: true, phone: true }
            },
            supermarket: {
              select: { id: true, name: true, phone: true, address: true }
            }
          }
        }
      },
      orderBy: {
        paymentDate: orderDirection
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: payments,
      count: payments.length
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments',
      error: 'Internal server error'
    });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method } = req.body;

    if (amount === undefined && method === undefined) {
      return res.status(400).json({
        success: false,
        message: 'amount or method is required to update'
      });
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'amount must be a positive number'
      });
    }

    if (method !== undefined && !validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: `method must be one of: ${validMethods.join(', ')}`
      });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        deal: {
          include: {
            payments: true,
            supermarket: true,
            buyer: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (req.user.role === 'BUYER' && payment.deal.buyerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update payments for your own deals.'
      });
    }

    const oldAmount = payment.amount;
    const newAmount = amount !== undefined ? amount : oldAmount;
    const totalPaidExcludingThis = payment.deal.payments.reduce((sum, p) => sum + p.amount, 0) - oldAmount;
    const newTotalPaid = totalPaidExcludingThis + newAmount;

    if (newTotalPaid > payment.deal.totalAmount) {
      return res.status(400).json({
        success: false,
        message: `Updated payment amount exceeds deal remaining balance. Deal total is ${payment.deal.totalAmount}`
      });
    }

    const newStatus = newTotalPaid >= payment.deal.totalAmount
      ? 'PAID'
      : (newTotalPaid > 0 ? 'PARTIAL' : 'UNPAID');

    const delta = newAmount - oldAmount;

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          amount: newAmount,
          ...(method !== undefined && { method })
        }
      });

      await tx.deal.update({
        where: { id: payment.deal.id },
        data: {
          status: newStatus
        }
      });

      if (delta !== 0) {
        await tx.supermarket.update({
          where: { id: payment.deal.supermarket.id },
          data: {
            totalDebt: delta > 0
              ? { decrement: delta }
              : { increment: Math.abs(delta) }
          }
        });
      }

      return updated;
    });

    return res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: updatedPayment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: 'Internal server error'
    });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        deal: {
          include: {
            payments: true,
            supermarket: true,
            buyer: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (req.user.role === 'BUYER' && payment.deal.buyerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete payments for your own deals.'
      });
    }

    const totalPaidExcludingDeleted = payment.deal.payments.reduce((sum, p) => sum + p.amount, 0) - payment.amount;
    const newStatus = totalPaidExcludingDeleted >= payment.deal.totalAmount
      ? 'PAID'
      : (totalPaidExcludingDeleted > 0 ? 'PARTIAL' : 'UNPAID');

    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id } });

      await tx.deal.update({
        where: { id: payment.deal.id },
        data: {
          status: newStatus
        }
      });

      await tx.supermarket.update({
        where: { id: payment.deal.supermarket.id },
        data: {
          totalDebt: {
            increment: payment.amount
          }
        }
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Payment deleted successfully',
      data: { id: payment.id }
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: 'Internal server error'
    });
  }
};
