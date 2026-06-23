import express from "express";
import { register, login, create_buyer, getBuyers, updateBuyer, logout } from "../controllers/authController.js";
import { protectRoute, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/create_buyer", protectRoute, isAdmin, create_buyer);

router.get("/buyers", protectRoute, isAdmin, getBuyers);

router.put("/buyers/:id", protectRoute, isAdmin, updateBuyer);

router.post("/logout", logout);

export default router;