import { Chat } from "../modules/chat.model.js";
import {pusher} from "../utils/pusher.js"
export const sendMessage = async (req, res) => {
    try {
        const { message, receiver } = req.body; 
        const sender = req.userId; 

        const newMessage = await Chat.create({
            sender,  
            receiver, 
            message  
        });

        await pusher.trigger("chat-channel", "new-message", {
            message: newMessage
        });

        res.status(200).json({ success: true, data: newMessage });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




// 1. Admin ke liye saare unique users ki list lana
export const getChatUsers = async (req, res) => {
    try {
        const adminId = req.userId;
        // Sirf check karne ke liye ki messages hain ya nahi
        const allMessages = await Chat.find({
            $or: [{ sender: adminId }, { receiver: adminId }]
        });
        
        console.log("Found Messages:", allMessages.length);
        res.status(200).json({ success: true, data: allMessages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// 2. Kisi specific user ki puri history lana (Admin ke liye)


export const getUserChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.userId;

        const history = await Chat.find({
            $or: [
                { sender: adminId, receiver: userId },
                { sender: userId, receiver: adminId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};