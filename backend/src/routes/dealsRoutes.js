import express from 'express';
import { getAlldeals, getDealById, createDeal, putDeal, deleteDeal } from '../controllers/dealsController.js';
import { protectRoute, isAdmin, isBuyer } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectRoute);

router.get('/', getAlldeals);

router.get('/:id', getDealById);

router.post('/', createDeal);

router.put('/:id', putDeal);

router.delete('/:id', deleteDeal);

export default router;