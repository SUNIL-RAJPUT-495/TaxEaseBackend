import { User } from "../modules/user.module.js";
import haspassword from "bcryptjs";
import {generateToken} from "../utils/generatedToken.js"

export const creatUser = async (req, res) => {
    try {
        const { name, email, phone, password,role } = req.body;
        console.log("Received user data:", { name, email, phone, role });
        if (!name || !email || !phone || !password || !role) {
            return res.status(400).json({ 
                message: "All fields are required" ,
                error: true ,
                success: false
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                message: "User with this email already exists" ,
                error: true ,
                success: false
            });
        }
        const hashedPassword = await haspassword.hash(password, 10);
        const newUser = new User({ name, email, phone, password: hashedPassword ,role});
        await newUser.save();
        res.status(201).json({
             message: "User created successfully", 
             user: newUser ,
             success: true ,
             error: false
            });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const verifyUser = async (req, res) => {
    try {
        const { email, password } = req.body;
            if (!email || !password) {
            return res.status(400).json({ 
                message: "Email and password are required" ,
                error: true ,
                success: false
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                message: "User not found",
                error: true ,
                success: false
                
             });
        }   
        const isPasswordValid = await haspassword.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                 message: "Invalid password",
                    error: true ,
                    success: false 
                });
        }

        const generatedToken = await generateToken(user._id);

         const cookieOption = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'None' : 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, 
            path: "/"
        };
        return res
            .cookie("token", token, cookieOption)
            .status(200)
            .json({
                message: `Welcome back, ${user.fullName}`,
                success: true,
                token: token, 
                data: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role
                }
            });

        
    } catch (error) {
        console.error("Error verifying user:", error);
        res.status(500).json({
             message: "Internal server error",
                error: true ,
                success: false
             });
    }   
};


// export const userProfile = async (req, res) => {
//     try {
//         const userId = req.params.id;
//         const user = await User.findById(userId).select("-password");
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

