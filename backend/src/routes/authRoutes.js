import express from "express";
import { register, login, create_buyer, logout } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/create_buyer", create_buyer);

router.post("/logout", logout);

export default router;