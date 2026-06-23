import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dbConnection } from './lib/dbConnection.js';
import authRoutes from './routes/authRoutes.js';
import productsRoutes from './routes/productsRoutes.js';
import supermarketsRoutes from './routes/supermarketsRoutes.js';
import dealsRoutes from './routes/dealsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:8080",
  credentials: true
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize Database
dbConnection();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/supermarkets", supermarketsRoutes);
app.use("/api/deals", dealsRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);


// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running", port: PORT });
});

app.listen(PORT, () => {
  console.log(`🚀 Server spinning on port http://localhost:${PORT}`);
});