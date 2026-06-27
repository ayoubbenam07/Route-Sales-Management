import express from 'express';
import { getAllProducts, createProduct, putProduct, deleteProduct } from "../controllers/productsController.js";
import { protectRoute, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protectRoute);

router.get('/', getAllProducts);

router.post('/', createProduct);

router.put('/:id', putProduct);

router.delete('/:id', deleteProduct);

export default router;