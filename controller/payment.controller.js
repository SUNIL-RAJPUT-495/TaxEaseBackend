import Razorpay from "razorpay";
import crypto from "crypto"; 
import { Order} from "../modules/Order.module.js"
import {User} from "../modules/user.module.js"
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZARPAY_API_KEY,      
  key_secret: process.env.RAZARPAY_API_KEY_SECRET,
});

// --- 1. CREATE ORDER ---
export const createOrder = async (req, res) => {
    try {
        const { amount, service, plan, name, email, phone, pan } = req.body;
        const userId = req.userId; 

        const options = {
            amount: amount * 100, 
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        if (!razorpayOrder) {
            return res.status(500).json({ message: "Razorpay Order Failed" });
        }

        const newOrder = new Order({
            userId: userId || null, 
            name, email, phone, pan, service, plan, amount,
            orderId: razorpayOrder.id,
            status: "created", 
            paymentId: ""
        });

        const savedOrder = await newOrder.save();

        if (userId) {
            await User.findByIdAndUpdate(
                userId,
                { $push: { orders: savedOrder._id } },
                { new: true }
            );
        }

        res.status(200).json({
            success: true,
            message: "Order Created",
            order: savedOrder, 
            key_id: process.env.RAZARPAY_API_KEY
        });

    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};




// --- 2. VERIFY PAYMENT ---
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

       
        const order = await Order.findOne({ orderId: razorpay_order_id });

        if (!order) {
            return res.status(404).json({ 
                success: false,
                 message: "Order not found"
                 });
        }

        const secret = process.env.RAZARPAY_API_KEY_SECRET; 

        if (!secret) {
            return res.status(500).json({ message: "Server Config Error: Secret Key Missing" });
        }

        const generated_signature = crypto
            .createHmac("sha256", secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        
        if (generated_signature === razorpay_signature) {
            
            order.paymentId = razorpay_payment_id;
            order.status = "paid"; 
            await order.save();
            if (order.userId) {
                const expiryDate = new Date();
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);

                await User.findByIdAndUpdate(order.userId, {
                    $set: { 
                        activePlan: {
                            serviceName: order.service,
                            planName: order.plan,
                            isActive: true,
                            expiryDate: expiryDate
                        }
                    }
                });
            }

            return res.status(200).json({ 
                success: true, 
                message: "Payment Successful" 
            });

        } else {
            order.status = "failed";
            await order.save(); 
            
            return res.status(400).json({ 
                success: false, 
                message: "Payment Verification Failed" 
            });
        }

    } catch (error) {
        console.error("Verify Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



export const getAllOrders = async (req, res) => {
    try {
        // 1. Find All Orders
        // 2. .populate("userId") -> User ka data (Name, Email, Phone) layega
        // 3. .sort({ createdAt: -1 }) -> Latest order sabse upar
        
        const orders = await Order.find()
            .populate("userId", "name email phone") 
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            message: "All Orders Fetched Successfully",
            data: orders
        });

    } catch (error) {
        console.error("Get All Orders Error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Internal Server Error"
        });
    }
}



export const getOrderStats = async (req, res) => {
    try {
        const completedOrdersCount = await Order.countDocuments({ status: "paid" });


        const totalEarnings = await Order.aggregate([
            { $match: { status: "paid" } }, 
            { $group: { _id: null, total: { $sum: "$amount" } } } 
        ]);

        const failedOrdersCount = await Order.countDocuments({ status: "failed" });

        res.status(200).json({
            success: true,
            message: "Stats Fetched Successfully",
            data: {
                totalOrders: completedOrdersCount,
                totalRevenue: totalEarnings.length > 0 ? totalEarnings[0].total : 0, 
                failedOrders: failedOrdersCount
            }
        });

    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};





export const recentOrders = async (req, res) => {
    try {
        console.log("Fetching recent orders...");

        const orders = await Order.find()
            .sort({ createdAt: -1 }) 
            .limit(5)             
            .populate("userId", "name email"); 

        res.status(200).json({
            message: "Recent Orders Fetched Successfully",
            data: orders,
            success: true,
            error: false
        });

    } catch (err) {
        console.error("Recent Orders Error:", err);
        res.status(500).json({
            message: err.message || "Internal Server Error",
            error: true,
            success: false
        });
    }
};