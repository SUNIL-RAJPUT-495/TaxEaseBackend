import { Conversation, Message } from "../modules/chat.model.js";
import { User } from "../modules/user.module.js";
import { pusher } from "../utils/pusher.js";
import mongoose from "mongoose"; // ⚠️ YE IMPORT SABSE ZAROORI HAI

// Helper: Admin ki ID nikalne ke liye
const getAdminId = async () => {
    const admin = await User.findOne({ role: "admin" }).lean();
    return admin ? admin._id.toString() : null;
};

// --- 1. SEND MESSAGE ---
export const sendMessage = async (req, res) => {
    try {
        const { message, receiver } = req.body;
        const senderId = req.userId.toString(); // Jo login hai

        const ADMIN_ID = await getAdminId();
        const isSenderAdmin = senderId === ADMIN_ID;
        
        // Agar sender Admin hai, toh receiver User hoga. Warna hamesha Admin hoga.
        const receiverId = isSenderAdmin ? receiver : ADMIN_ID;

        if (!receiverId) return res.status(400).json({ success: false, message: "Receiver not found" });

        // 🔥 JADU FIX 1: ID ko Mongoose ObjectId banayein taaki duplicate rooms na banein!
        const senderObjId = new mongoose.Types.ObjectId(senderId);
        const receiverObjId = new mongoose.Types.ObjectId(receiverId);

        let conversation = await Conversation.findOne({
            participants: { $all: [senderObjId, receiverObjId] }
        });

        // Agar nahi hai, toh naya Chat Room bana do
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderObjId, receiverObjId]
            });
        }

        // Naya message database mein daalo
        const newMessage = await Message.create({
            conversationId: conversation._id,
            sender: senderObjId,
            message: message.trim()
        });

        // Chat Room ka 'lastMessage' update kar do taaki sidebar mein dikhe
        conversation.lastMessage = message.trim();
        await conversation.save();

        // 🔥 JADU FIX 2: React (Frontend) ko khush rakhne ke liye 'receiver' chipka do!
        const messageData = newMessage.toObject(); // Message ko plain object banaya
        messageData.receiver = receiverId;         // Ab Frontend Pusher ise reject nahi karega!

        // Real-time update via Pusher
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
export const getUserChatHistory = async (req, res) => {
    try {
        const { userId } = req.params; 
        const loggedInUserId = req.userId.toString();

        const ADMIN_ID = await getAdminId();
        const isMeAdmin = loggedInUserId === ADMIN_ID;
        const targetUserId = isMeAdmin ? userId : ADMIN_ID;

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
        res.status(500).json({ success: false, message: error.message });
    }
};