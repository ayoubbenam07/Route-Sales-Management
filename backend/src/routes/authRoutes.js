import express from "express";
import { register, login, create_buyer, logout } from "../controllers/authController.js";
import { protectRoute, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/create_buyer", protectRoute, isAdmin, create_buyer);

router.post("/logout", logout);

export default router;