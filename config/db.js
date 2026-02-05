import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

function connectDB() {
    try {
        mongoose.connect(process.env.MONGOOS_URL)
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); 
    }
} 
export default connectDB;
    
