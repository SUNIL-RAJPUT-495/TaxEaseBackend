import { Order } from "../modules/Order.js";

export const createOrder = async (req, res) => {
  try {
    const { serviceType, planName, amount } = req.body;
    
    const newOrder = new Order({
      user: req.user._id, 
      serviceType,
      planName,
      amount
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadOrderDocs = async (req, res) => {
  try {
    const orderId = req.params.id;
    const fileUrl = req.file.path; 
    const docName = req.body.docName || "Uploaded Document";

    const order = await Order.findById(orderId);
    
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.documents.push({ docName, fileUrl });
    
    if(order.status === "Pending") {
      order.status = "Documents Uploaded";
    }

    await order.save();
    res.json({ message: "Document Uploaded", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};