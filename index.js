import express from 'express';
import dotenv from 'dotenv';
import connectDB from '../backend/config/db.js';
import morgan from 'morgan'; 
import cors from 'cors';  
import cookieParser from 'cookie-parser';
import userrouter from './router/user.router.js';
import planrouter from './router/plan.router.js';
dotenv.config();
const app = express();

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
app.get('/', (req, res) => {
  res.send('Tax API is running...');
});


connectDB();

app.use("/api/user",userrouter)
app.use("/api/plans", planrouter);

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;