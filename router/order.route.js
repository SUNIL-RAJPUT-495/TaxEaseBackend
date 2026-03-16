import { Router } from "express";
import { createOrder, getAllOrders, getOrderStats, imbWebhook, markOrderAsSeen, recentOrders, verifyPayment } from "../controller/order.controller.js"
import { authToken } from "../middleware/authToken.js";

const orderRouter = Router()


orderRouter.post("/create-Order",authToken,createOrder)
orderRouter.post("/verify-payment",authToken,verifyPayment)
orderRouter.get("/all-orders", authToken, getAllOrders);
orderRouter.get("/stats", authToken, getOrderStats);
orderRouter.get("/recent-orders", authToken, recentOrders);

orderRouter.post("/webhook/imb", imbWebhook);


orderRouter.post("/markOrderAsSeen",authToken,markOrderAsSeen)

export default orderRouter