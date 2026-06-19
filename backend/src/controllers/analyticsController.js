import prisma from '../config/prisma.js';

const LOW_STOCK_THRESHOLD = 10;

export const getAdminDashboard = async (req, res) => {
  try {
    const [salesResult, debtResult, lowStockProducts, topBuyersRaw] = await Promise.all([
      prisma.deal.aggregate({
        _sum: {
          totalAmount: true
        }
      }),
      prisma.supermarket.aggregate({
        _sum: {
          totalDebt: true
        }
      }),
      prisma.product.findMany({
        where: {
          stockQty: {
            lte: LOW_STOCK_THRESHOLD
          }
        },
        select: {
          id: true,
          name: true,
          stockQty: true,
          basePrice: true
        },
        orderBy: {
          stockQty: 'asc'
        }
      }),
      prisma.deal.groupBy({
        by: ['buyerId'],
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            totalAmount: 'desc'
          }
        },
        take: 5
      })
    ]);

    const totalSalesRevenue = salesResult._sum.totalAmount ?? 0;
    const totalGlobalOutstandingMarketDebt = debtResult._sum.totalDebt ?? 0;

    const buyerIds = topBuyersRaw.map((item) => item.buyerId);
    const buyers = buyerIds.length
      ? await prisma.user.findMany({
          where: { id: { in: buyerIds } },
          select: {
            id: true,
            name: true,
            phone: true
          }
        })
      : [];

    const buyerMap = new Map(buyers.map((buyer) => [buyer.id, buyer]));
    const topPerformingBuyers = topBuyersRaw.map((item) => ({
      buyerId: item.buyerId,
      name: buyerMap.get(item.buyerId)?.name ?? 'Unknown',
      phone: buyerMap.get(item.buyerId)?.phone ?? null,
      totalSales: item._sum.totalAmount ?? 0,
      dealsCount: item._count.id
    }));

    const stockWarnings = lowStockProducts.map((product) => ({
      productId: product.id,
      name: product.name,
      stockQty: product.stockQty,
      basePrice: product.basePrice,
      warning: product.stockQty <= 0 ? 'Out of stock' : 'Low stock'
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalSalesRevenue,
        totalGlobalOutstandingMarketDebt,
        topPerformingBuyers,
        stockWarnings
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getBuyerDashboard = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlySalesResult, debtRows, recentDeals] = await Promise.all([
      prisma.deal.aggregate({
        where: {
          buyerId,
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          totalAmount: true
        }
      }),
      prisma.deal.findMany({
        where: {
          buyerId
        },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          payments: {
            select: {
              amount: true
            }
          },
          supermarket: {
            select: {
              id: true,
              name: true,
              phone: true,
              totalDebt: true
            }
          }
        }
      }),
      prisma.deal.findMany({
        where: {
          buyerId
        },
        include: {
          supermarket: {
            select: {
              id: true,
              name: true
            }
          },
          payments: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ]);

    const totalSalesThisMonth = monthlySalesResult._sum.totalAmount ?? 0;

    let totalDebtResponsible = 0;
    for (const deal of debtRows) {
      const paid = deal.payments.reduce((sum, payment) => sum + payment.amount, 0);
      totalDebtResponsible += Math.max(deal.totalAmount - paid, 0);
    }

    const formattedRecentDeals = recentDeals.map((deal) => {
      const paid = deal.payments.reduce((sum, payment) => sum + payment.amount, 0);
      return {
        id: deal.id,
        createdAt: deal.createdAt,
        status: deal.status,
        totalAmount: deal.totalAmount,
        totalPaid: paid,
        remainingBalance: Math.max(deal.totalAmount - paid, 0),
        supermarket: deal.supermarket
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        totalSalesThisMonth,
        totalDebtResponsible,
        recentDeals: formattedRecentDeals
      }
    });
  } catch (error) {
    console.error('Error fetching buyer dashboard analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
