import { Order } from "../modules/Order.module.js"
import { User } from "../modules/user.module.js"
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const IMB_CREATE_ORDER_URL = `${process.env.IMB_BASE_URL}/api/create-order`;


export const createOrder = async (req, res) => {
    try {
        const { amount, service, plan, name, email, phone, pan } = req.body;
        const userId = req.userId;

        if (!amount || !service || !plan || !name || !email || !phone || !pan) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const cleanPhone = String(phone).replace(/\D/g, "");
        const transactionId = "TXN" + Date.now() + Math.floor(Math.random() * 1000);

        const newOrder = new Order({
            userId: userId || null,
            name, email, phone: cleanPhone, pan, service, plan, amount,
            orderId: transactionId,
            status: "created"
        });
        const savedOrder = await newOrder.save();

        if (userId) {
            await User.findByIdAndUpdate(userId, { $push: { orders: savedOrder._id } });
        }

        const payload = new URLSearchParams({
            customer_mobile: cleanPhone,
            user_token: process.env.IMB_CLIENT_SECRET,
            amount: String(amount),
            order_id: transactionId,
            customer_name: name,
            remark1: email,
            remark2: plan,
            redirect_url: `https://tax-ease-client.vercel.app/payment-status/${transactionId}`,
        });
        console.log(payload.redirect_url)

        console.log("Sending Payload to LIVE URL...");

        const response = await axios.post(IMB_CREATE_ORDER_URL, payload.toString(), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        const data = response.data;
        console.log("IMB Final Response:", data);

        if (data && data.status === true && data.result) {
            return res.status(200).json({
                success: true,
                message: "Order Created Successfully",
                payment_url: data.result.payment_url || data.result.paytm_link || data.result.bhim_link || data.result.check_link,
                orderId: transactionId
            });
        } else {
            throw new Error(data.message || "Failed to generate payment link.");
        }

    } catch (error) {
        console.error("IMB Create Order Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Payment initialization failed." });
    }
};

// ==========================================
// 2. VERIFY PAYMENT (Status Check via Frontend)
// ==========================================
export const verifyPayment = async (req, res) => {
    try {
        const { transactionId } = req.body;

        if (!transactionId) {
            return res.status(400).json({ success: false, message: "Transaction ID missing" });
        }

        const order = await Order.findOne({ orderId: transactionId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const statusPayload = {

            user_token: process.env.IMB_CLIENT_SECRET,
            order_id: transactionId
        };

        const response = await axios.post(process.env.IMB_STATUS_URL, statusPayload);
        const data = response.data;

        if (data.status === "SUCCESS" || data.status === "COMPLETED") {
            if (order.status !== "paid") {
                order.paymentId = data.upi_txn_id || data.bank_txn_id || transactionId;
                order.status = "paid";
                await order.save();

                let latestServiceId = null;

                if (order.userId) {
                    const expiryDate = new Date();
                    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

                    const updatedUser = await User.findByIdAndUpdate(
                        order.userId,
                        {
                            $push: {
                                activeServices: {
                                    serviceName: order.service,
                                    planName: order.plan,
                                    orderId: order._id,
                                    status: "pending",
                                    expiryDate: expiryDate
                                }
                            }
                        },
                        { new: true }
                    );

                    if (updatedUser && updatedUser.activeServices.length > 0) {
                        latestServiceId = updatedUser.activeServices[updatedUser.activeServices.length - 1]._id;
                    }
                }

                return res.status(200).json({
                    success: true,
                    message: "Payment Verified Successfully",
                    activeServiceId: latestServiceId
                });
            } else {
                return res.status(200).json({ success: true, message: "Already verified" });
            }
        } else if (data.status === "PENDING" || data.status === "PROCESSING") {
            return res.status(200).json({
                success: true,
                message: "Payment is currently pending/processing. Please check back shortly.",
                status: "pending"
            });
        } else {
            order.status = "failed";
            await order.save();
            return res.status(400).json({ success: false, message: "Payment was not successful or failed." });
        }

    } catch (error) {
        console.error("Verify Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Internal Server Error during verification" });
    }
};

// ==========================================
// 3. IMB WEBHOOK (Background Server-to-Server)
// ==========================================
export const imbWebhook = async (req, res) => {
    try {
        const data = req.body;
        console.log("🔥 Webhook Received from IMB:", data);

        const transactionId = data.client_txn_id || data.order_id;

        if (!transactionId) {
            return res.status(400).send("Transaction ID missing");
        }

        const order = await Order.findOne({ orderId: transactionId });
        if (!order) {
            return res.status(404).send("Order not found");
        }

        // Agar webhook SUCCESS bhejta hai aur order pehle se paid nahi hai
        if ((data.status === "SUCCESS" || data.status === "COMPLETED") && order.status !== "paid") {

            order.paymentId = data.upi_txn_id || data.bank_txn_id || transactionId;
            order.status = "paid";
            await order.save();

            if (order.userId) {
                const expiryDate = new Date();
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);

                await User.findByIdAndUpdate(
                    order.userId,
                    {
                        $push: {
                            activeServices: {
                                serviceName: order.service,
                                planName: order.plan,
                                orderId: order._id,
                                status: "pending",
                                expiryDate: expiryDate
                            }
                        }
                    }
                );
            }
            console.log(`✅ Order ${transactionId} marked as PAID via Webhook!`);
        }
        else if (data.status === "FAILED" && order.status !== "paid") {
            order.status = "failed";
            await order.save();
            console.log(`❌ Order ${transactionId} marked as FAILED via Webhook!`);
        }

        return res.status(200).send("Webhook Received Successfully");

    } catch (error) {
        console.error("Webhook Error:", error);
        return res.status(500).send("Webhook processing failed");
    }
};













// ==========================================
// OTHER FUNCTIONS
// ==========================================
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("userId", "name email phone documents")
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
};

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

export const markOrderAsSeen = async (req, res) => {
    try {
        const { orderId } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { isSeen: true },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Order marked as seen",
            data: updatedOrder
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};