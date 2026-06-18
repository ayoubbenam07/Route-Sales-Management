import express from 'express';
import { getAllSupermarkets, getSupermarketById, createSupermarket, putSupermarket, deleteSupermarket } from '../controllers/supermarketsController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);

router.get('/', getAllSupermarkets);
router.get('/:id', getSupermarketById);
router.post('/', createSupermarket);
router.put('/:id', putSupermarket);
router.delete('/:id', deleteSupermarket);

export default router;