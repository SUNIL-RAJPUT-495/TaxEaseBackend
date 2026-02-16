import { Conversation, Message } from "../modules/chat.model.js";
import { User } from "../modules/user.module.js";
import {pusher} from "../utils/pusher.js"; // Ensure path is correct
import mongoose from "mongoose"; 

// Helper function to get Admin ID
const getAdminId = async () => {
    const admin = await User.findOne({ role: { $regex: /^admin$/i } }).lean();
    return admin ? admin._id.toString() : null;
};

// --- 1. SEND MESSAGE (Real-time Fix) ---
export const sendMessage = async (req, res) => {
    try {
        const { message, receiver } = req.body;
        const senderId = req.userId.toString(); 

        const ADMIN_ID = await getAdminId();
        if (!ADMIN_ID) {
            return res.status(500).json({ success: false, message: "System Error: Admin not found" });
        }

        const isSenderAdmin = senderId === ADMIN_ID;

        // Receiver decide karo
        let finalReceiverId = isSenderAdmin ? receiver : ADMIN_ID;
        if (finalReceiverId === "admin") finalReceiverId = ADMIN_ID;

        // Validation
        if (!mongoose.Types.ObjectId.isValid(finalReceiverId)) {
            return res.status(400).json({ success: false, message: "Invalid Receiver ID" });
        }

        const senderObjId = new mongoose.Types.ObjectId(senderId);
        const receiverObjId = new mongoose.Types.ObjectId(finalReceiverId);

        // Conversation setup
        let conversation = await Conversation.findOneAndUpdate(
            { participants: { $all: [senderObjId, receiverObjId] } },
            { $setOnInsert: { participants: [senderObjId, receiverObjId] } },
            { upsert: true, new: true }
        );

        // Create Message
        const newMessage = await Message.create({
            conversationId: conversation._id,
            sender: senderObjId,
            message: message.trim(),
            seen: false
        });

        conversation.lastMessage = message.trim();
        await conversation.save();

        const messageData = newMessage.toObject();
        messageData.sender = senderId;        
        messageData.receiver = finalReceiverId; 

        // 🔥 DYNAMIC PUSHER LOGIC:
        // Hamesha 'Customer' ki ID hi channel name hogi taaki Admin aur User dono sync rahein.
        const channelUserId = isSenderAdmin ? finalReceiverId : senderId;

        console.log(`🚀 Real-time: Sending to chat-${channelUserId}`);

        await pusher.trigger(`chat-${channelUserId}`, "new-message", { 
            message: messageData 
        });

        res.status(200).json({ success: true, data: messageData });

    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 2. GET CHAT USERS (Admin Sidebar) ---
export const getChatUsers = async (req, res) => {
    try {
        const loggedInUserId = req.userId.toString();
        const conversations = await Conversation.find({
            participants: { $in: [loggedInUserId] }
        })
        .populate("participants", "name email") 
        .sort({ updatedAt: -1 });

        const finalData = conversations.map(conv => {
            const otherUser = conv.participants.find(p => p._id.toString() !== loggedInUserId);
            return {
                conversationId: conv._id,
                _id: otherUser ? otherUser._id : "Unknown",
                name: otherUser ? otherUser.name : "User Not Found",
                email: otherUser ? otherUser.email : "No Email",
                lastMessage: conv.lastMessage,
                lastChatTime: conv.updatedAt
            };
        });
        res.status(200).json({ success: true, data: finalData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 3. GET CHAT HISTORY ---
export const getUserChatHistory = async (req, res) => {
    try {
        let { userId } = req.params;
        const loggedInUserId = req.userId.toString();
        const ADMIN_ID = await getAdminId();

        if (userId === "admin") userId = ADMIN_ID;

        const targetObjId = new mongoose.Types.ObjectId(userId);
        const loggedInObjId = new mongoose.Types.ObjectId(loggedInUserId);

        const conversation = await Conversation.findOne({
            participants: { $all: [loggedInObjId, targetObjId] }
        });

        if (!conversation) return res.status(200).json({ success: true, data: [] });

        const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).lean();
        
        const data = messages.map(m => ({
            ...m,
            receiver: m.sender.toString() === loggedInUserId ? userId : loggedInUserId
        }));

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "History fetch failed" });
    }
};