import { Conversation, Message } from "../modules/chat.model.js";
import { User } from "../modules/user.module.js";
import { pusher } from "../utils/pusher.js";
import mongoose from "mongoose"; 


const getAdminId = async () => {
    const admin = await User.findOne({ role: "admin" }).lean();
    return admin ? admin._id.toString() : null;
};

// --- 1. SEND MESSAGE ---
export const sendMessage = async (req, res) => {
    try {
        const { message, receiver } = req.body;
        const senderId = req.userId.toString(); 

        const ADMIN_ID = await getAdminId();
        const isSenderAdmin = senderId === ADMIN_ID;
        
        const receiverId = isSenderAdmin ? receiver : ADMIN_ID;

        if (!receiverId) return res.status(400).json({ success: false, message: "Receiver not found" });

        const senderObjId = new mongoose.Types.ObjectId(senderId);
        const receiverObjId = new mongoose.Types.ObjectId(receiverId);

        let conversation = await Conversation.findOne({
            participants: { $all: [senderObjId, receiverObjId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderObjId, receiverObjId]
            });
        }

        const newMessage = await Message.create({
            conversationId: conversation._id,
            sender: senderObjId,
            message: message.trim()
        });

        conversation.lastMessage = message.trim();
        await conversation.save();

        const messageData = newMessage.toObject(); 
        messageData.receiver = receiverId;         

        await pusher.trigger("chat-channel", "new-message", { message: messageData });

        res.status(200).json({ success: true, data: messageData });
    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 2. GET CHAT USERS (Admin Inbox List) ---
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
        console.error("Get Users Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 3. GET CHAT HISTORY ---
// --- 3. GET CHAT HISTORY (Safe & Optimized) ---
export const getUserChatHistory = async (req, res) => {
    try {
        let { userId } = req.params; // "admin" ya asli ID
        const loggedInUserId = req.userId.toString();

        const ADMIN_ID = await getAdminId();
        if (!ADMIN_ID) return res.status(404).json({ success: false, message: "Admin not found" });

        // 🔥 FIX: Agar userId "admin" string hai, toh use asli ADMIN_ID se badal do
        if (userId === "admin") {
            userId = ADMIN_ID;
        }

        const isMeAdmin = loggedInUserId === ADMIN_ID;
        const targetUserId = isMeAdmin ? userId : ADMIN_ID;

        // Ab targetUserId hamesha ek 24-char ID hogi, "admin" nahi
        const loggedInObjId = new mongoose.Types.ObjectId(loggedInUserId);
        const targetObjId = new mongoose.Types.ObjectId(targetUserId);

        const conversation = await Conversation.findOne({
            participants: { $all: [loggedInObjId, targetObjId] }
        });

        if (!conversation) {
            return res.status(200).json({ success: true, data: [] }); 
        }

        const messages = await Message.find({
            conversationId: conversation._id
        }).sort({ createdAt: 1 }).lean(); 

        const messagesWithReceiver = messages.map(msg => ({
            ...msg,
            receiver: msg.sender.toString() === loggedInUserId ? targetUserId : loggedInUserId
        }));

        res.status(200).json({ success: true, data: messagesWithReceiver });
    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ success: false, message: "Invalid ID format or Server Error" });
    }
};