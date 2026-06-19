import express from 'express';
import { getAdminDashboard, getBuyerDashboard } from '../controllers/analyticsController.js';
import { protectRoute, isAdmin, isBuyer } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);

router.get('/admin-dashboard', isAdmin, getAdminDashboard);
router.get('/buyer-dashboard', isBuyer, getBuyerDashboard);

export default router;