import express from 'express';
import { getAlldeals, getDealById, createDeal } from '../controllers/dealsController.js';
import { protectRoute, isAdmin, isBuyer } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectRoute);

router.get('/', getAlldeals);

router.get('/:id', getDealById);

router.post('/', createDeal);

export default router;