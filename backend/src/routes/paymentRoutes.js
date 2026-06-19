import express from 'express';
import { getAllPayments, createPayment, updatePayment, deletePayment } from '../controllers/paymentController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);

router.get('/', getAllPayments);
router.post('/', createPayment);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

export default router;