import { Router } from "express";
import { createOrder, getAllOrders, getOrderStats, recentOrders, verifyPayment } from "../controller/payment.controller.js"
import { authToken } from "../middleware/authToken.js";

const payamentRouter = Router()


payamentRouter.post("/create-Order",authToken,createOrder)
payamentRouter.post("/verify-payment",authToken,verifyPayment)
payamentRouter.get("/all-orders", authToken, getAllOrders);
payamentRouter.get("/stats", authToken, getOrderStats);
payamentRouter.get("/recent-orders", authToken, recentOrders);

export default payamentRouter