import express from 'express';
import dotenv from 'dotenv';
import connectDB from '../backend/config/db.js';
import morgan from 'morgan'; 
import cors from 'cors';  
import cookieParser from 'cookie-parser';

// Routers
import userrouter from './router/user.router.js';
import planrouter from './router/plan.router.js';
import payamentRouter from './router/payment.route.js';
import uploadRouter from './router/upload.routes.js';

// Utils
import { seedAdminAccount } from './utils/seedAdmin.js'; // 👈 Ise import zaroor karein

dotenv.config();
const app = express();

// --- Middlewares ---
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

const allowedOrigins = [
    "http://localhost:5173", 
    process.env.FRONTEND_URL?.replace(/\/$/, "")
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

// --- Routes ---
app.get('/', (req, res) => {
  res.send('Tax API is running...');
});

app.use("/api/user", userrouter);
app.use("/api/plans", planrouter);
app.use("/api/payment", payamentRouter);
app.use("/api/file", uploadRouter);

// --- Database Connection & Server Start ---
const PORT = process.env.PORT || 8080;

import mongoose from "mongoose";

// Database connection ke baad ye logic chalayein
connectDB().then(async () => {
    try {
        const adminDb = mongoose.connection.db;
        const collections = await adminDb.listCollections({ name: 'users' }).toArray();

        if (collections.length > 0) {
            await mongoose.connection.collection("users").dropIndex("mobile_1")
                .then(() => console.log("✅ Purana 'mobile_1' index delete ho gaya!"))
                .catch((err) => console.log("ℹ️ Index pehle se deleted hai ya nahi mila."));
            
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Error during index cleanup:", error);
    }
});

export default app;