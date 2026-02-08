import express from 'express';
import dotenv from 'dotenv';
import connectDB from '../backend/config/db.js';
import morgan from 'morgan'; 
import cors from 'cors';  
import cookieParser from 'cookie-parser';
import mongoose from "mongoose";

// Routers
import userrouter from './router/user.router.js';
import planrouter from './router/plan.router.js';
import payamentRouter from './router/payment.route.js';
import uploadRouter from './router/upload.routes.js';

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
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

// --- Database Connection Middleware (For Serverless) ---
// Vercel par har request se pehle check karna zaroori hai ki DB connected hai ya nahi
const connectToDatabase = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await connectDB();
    
    // Index cleanup logic (Only runs once when DB connects)
    try {
        const adminDb = mongoose.connection.db;
        const collections = await adminDb.listCollections({ name: 'users' }).toArray();
        if (collections.length > 0) {
            await mongoose.connection.collection("users").dropIndex("mobile_1").catch(() => {});
        }
    } catch (e) {
        console.log("Index cleanup skipped or not needed");
    }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
    await connectToDatabase();
    next();
});

// --- Routes ---
app.get('/', (req, res) => {
  res.send('Tax API is running on Vercel...');
});

app.use("/api/user", userrouter);
app.use("/api/plans", planrouter);
app.use("/api/payment", payamentRouter);
app.use("/api/file", uploadRouter);

// ✅ Vercel doesn't need app.listen. It handles the port itself.
// Local development ke liye ye zaroori hai:
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`🚀 Local Server running on port ${PORT}`);
    });
}

export default app;