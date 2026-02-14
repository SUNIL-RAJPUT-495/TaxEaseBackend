import { User } from "../modules/user.module.js";
import bcrypt from "bcryptjs"; 
import { generateToken } from "../utils/generatedToken.js";
import dotenv from "dotenv";
import mongoose from 'mongoose';
import { Order } from "../modules/Order.module.js";

dotenv.config();

// --- 1. CREATE USER ---
export const creatUser = async (req, res) => {
    try {
        const { name, email, phone, password, role } = req.body;
        
        if (!name || !email || !phone || !password || !role) {
            return res.status(400).json({ 
                message: "All fields are required",
                error: true,
                success: false
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                message: "User with this email already exists",
                error: true,
                success: false
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, phone, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({
             message: "User created successfully", 
             user: newUser,
             success: true,
             error: false
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// --- 2. VERIFY USER (LOGIN) ---
export const verifyUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid Credentials" });

        const token = await generateToken(user._id);

        return res.status(200).json({
            message: `Welcome, ${user.name}`,
            success: true,
            token,
            data: { _id: user._id, role: user.role, name: user.name }
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// --- 3. USER DETAILS ---
export const userDetails = async (req, res) => {
    try {
        const currentUserId = req.userId; 
        if (!mongoose.Types.ObjectId.isValid(currentUserId)) {
            return res.status(400).json({
                message: "Invalid User Session. Please Login again.",
                error: true,
                success: false
            });
        }

       

        const user = await User.findById(currentUserId)
            .select("-password") 
            .populate({
                path: 'orders',
                strictPopulate: false 
            }); 

        if (!user) {
            return res.status(404).json({
                message: "User not found in database",
                error: true,
                success: false
            });
        }

        return res.status(200).json({
            data: user,
            error: false,
            success: true,
            message: "User details fetched successfully"
        });

    } catch (err) {
        console.error("Internal Server Error Details:", err);
        
        return res.status(500).json({
            message: err.message || "Something went wrong on the server",
            error: true,
            success: false
        });
    }
};


// --- 4. GET ALL USER
export const getAllUser =async(req,res)=>{
    try{
        const allUsers = await User.find().select("-password").sort({ createdAt: -1 });

        res.status(200).json({
            message: "All Users Fetched Successfully",
            data: allUsers,
            success: true,
            error: false
        });
    }
    catch (err) {
        res.status(500).json({
            message: err.message || err,
            error: true,
            success: false
        });
    }
}

// --- 5. DELETE ALL USER

export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.body; 

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required to delete",
                error: true,
                success: false
            });
        }

        if (userId === req.userId) {
            return res.status(400).json({
                message: "Admin cannot delete themselves from the user list",
                error: true,
                success: false
            });
        }

        await Order.deleteMany({ userId: userId });

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({
                message: "User not found in database",
                error: true,
                success: false
            });
        }

        res.status(200).json({
            message: "User and all linked orders deleted successfully!",
            error: false,
            success: true
        });

    } catch (err) {
        res.status(500).json({
            message: err.message || err,
            error: true,
            success: false
        });
    }
};