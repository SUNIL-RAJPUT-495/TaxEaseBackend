import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const connectDB = async () => {

    try {
        console.log("My Mongo URI is:", process.env.MONGOOS_URL);
        const connect =await mongoose.connect(process.env.MONGOOS_URL)
        console.log('MongoDB connected successfully');
        return connect;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); 
    }
} 
export default connectDB;
    
