import { Conversation, Message } from "../modules/chat.model.js";
import { User } from "../modules/user.module.js";
import { pusher } from "../utils/pusher.js";

// Helper: Admin ki ID nikalne ke liye
const getAdminId = async () => {
    const admin = await User.findOne({ role: "admin" }).lean();
    return admin ? admin._id.toString() : null;
};

// --- 1. SEND MESSAGE ---
export const sendMessage = async (req, res) => {
    try {
        const { message, receiver } = req.body;
        const senderId = req.userId; // Jo login hai

        const ADMIN_ID = await getAdminId();
        const isSenderAdmin = senderId.toString() === ADMIN_ID;
        
        // Agar sender Admin hai, toh receiver User hoga. Warna hamesha Admin hoga.
        const receiverId = isSenderAdmin ? receiver : ADMIN_ID;

        if (!receiverId) return res.status(400).json({ success: false, message: "Receiver not found" });

        // 🧠 JADU 1: Check karo kya in dono ke beech pehle se koi chat room (conversation) hai?
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        // Agar nahi hai, toh naya Chat Room bana do
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId]
            });
        }

        // 🧠 JADU 2: Naya message database mein daalo
        const newMessage = await Message.create({
            conversationId: conversation._id,
            sender: senderId,
            message: message.trim()
        });

        // Chat Room ka 'lastMessage' update kar do taaki sidebar mein dikhe
        conversation.lastMessage = message.trim();
        await conversation.save();

        // Real-time update via Pusher
        await pusher.trigger("chat-channel", "new-message", { message: newMessage });

        res.status(200).json({ success: true, data: newMessage });
    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 2. GET CHAT USERS (Admin Inbox List) ---
export const getChatUsers = async (req, res) => {
    try {
        const loggedInUserId = req.userId;

        // 🧠 JADU 3: Direct wo saari conversations utha lo jisme main shamil hu
        // Aur .populate() se apne aap doosre bande ka naam aur email le aao!
        const conversations = await Conversation.find({
            participants: { $in: [loggedInUserId] }
        })
        .populate("participants", "name email") // Yeh line automatically Users table se data utha layegi
        .sort({ updatedAt: -1 });

        // Data ko saaf karke bhej do
        const finalData = conversations.map(conv => {
            // Un 2 logo mein se wo banda nikalo jo main NAHI hu
            const otherUser = conv.participants.find(p => p._id.toString() !== loggedInUserId.toString());

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
        const { userId } = req.params; // Jiske sath chat dekhni hai
        const loggedInUserId = req.userId;

        const ADMIN_ID = await getAdminId();
        const isMeAdmin = loggedInUserId.toString() === ADMIN_ID;
        const targetUserId = isMeAdmin ? userId : ADMIN_ID;

        // Pehle wo chat room dhoondo
        const conversation = await Conversation.findOne({
            participants: { $all: [loggedInUserId, targetUserId] }
        });

        if (!conversation) {
            return res.status(200).json({ success: true, data: [] }); // Abhi tak koi chat nahi hui
        }

        // Us chat room ke saare messages nikal lo
        const messages = await Message.find({
            conversationId: conversation._id
        }).sort({ createdAt: 1 });

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};