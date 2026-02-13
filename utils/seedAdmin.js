import { Conversation, Message } from "../modules/chat.model.js"; 
import { User } from "../modules/user.module.js";
import { pusher } from "../utils/pusher.js";

// 🧠 SMART LOGIC: Database se dynamically 'admin' ko dhoondho (Aapke seeder ke hisaab se)
const getAdminUser = async () => {
    const admin = await User.findOne({ role: "admin" }).lean();
    if (!admin) {
        throw new Error("Admin account database mein nahi mila! Pehle Seeder run karein.");
    }
    return admin._id.toString();
};


// ==========================================
// 1. MESSAGE BHEJNA (Admin se User ya User se Admin)
// ==========================================
export const sendMessage = async (req, res) => {
    try {
        const { message, receiver } = req.body;
        const senderId = req.userId.toString(); // Jo login hai (Token se aaya)

        if (!message || message.trim() === "") {
            return res.status(400).json({ success: false, message: "Message khali nahi ho sakta" });
        }

        const ADMIN_ID = await getAdminUser();
        const isSenderAdmin = senderId === ADMIN_ID;
        
        // 🎯 LOGIC: Agar bhejney wala Admin hai, toh wo kisi specific 'receiver' ko bhejega.
        // Agar bhejney wala aam User hai, toh message hamesha ADMIN ko jayega.
        const finalReceiverId = isSenderAdmin ? receiver : ADMIN_ID;

        if (!finalReceiverId) {
            return res.status(400).json({ success: false, message: "Receiver ID missing hai" });
        }

        // 1. Check karo kya in 2 logo ke beech pehle se chat room (Conversation) hai?
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, finalReceiverId] }
        });

        // 2. Agar nahi hai, toh naya Chat Room bana do
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, finalReceiverId]
            });
        }

        // 3. Naya Message database mein save karo
        const newMessage = await Message.create({
            conversationId: conversation._id,
            sender: senderId,
            message: message.trim()
        });

        // 4. Sidebar me dikhane ke liye last message update karo
        conversation.lastMessage = message.trim();
        await conversation.save();

        // 5. Pusher (WebSockets) se real-time dono ko message dikhao
        await pusher.trigger("chat-channel", "new-message", { message: newMessage });

        res.status(200).json({ success: true, data: newMessage });
    } catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// ==========================================
// 2. INBOX LIST DEKHNA (Sidebar Users)
// ==========================================
export const getChatUsers = async (req, res) => {
    try {
        const loggedInUserId = req.userId.toString();

        // 1. Wo saari conversations laao jisme main shamil hoon
        // .populate() automatically Users table se dusre bande ka naam/email utha layega
        const conversations = await Conversation.find({
            participants: { $in: [loggedInUserId] }
        })
        .populate("participants", "name email")
        .sort({ updatedAt: -1 });

        // 2. Data ko frontend ke hisaab se set karo
        const finalData = await Promise.all(conversations.map(async (conv) => {
            // Un do logo ki list mein se wo banda nikalo jo main NAHI hoon
            const otherUser = conv.participants.find(p => p._id.toString() !== loggedInUserId);

            // Unread messages count (Jo message samne wale ne bheje aur maine dekhe nahi)
            const unreadCount = await Message.countDocuments({
                conversationId: conv._id,
                sender: { $ne: loggedInUserId }, 
                seen: false
            });

            return {
                conversationId: conv._id,
                _id: otherUser ? otherUser._id : "Unknown",
                name: otherUser ? otherUser.name : "User Not Found",
                email: otherUser ? otherUser.email : "No Email",
                lastMessage: conv.lastMessage,
                lastChatTime: conv.updatedAt,
                unreadCount: unreadCount
            };
        }));

        res.status(200).json({ success: true, data: finalData });
    } catch (error) {
        console.error("Get Users Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// ==========================================
// 3. CHAT HISTORY DEKHNA (Messages load karna)
// ==========================================
export const getUserChatHistory = async (req, res) => {
    try {
        const { userId } = req.params; // Jiske sath chat kholi hai
        const loggedInUserId = req.userId.toString();

        const ADMIN_ID = await getAdminUser();
        const isMeAdmin = loggedInUserId === ADMIN_ID;
        
        // Agar main Admin hoon, toh us user ki ID search karunga jispe click kiya.
        // Agar main User hoon, toh hamesha Admin ki ID search karunga.
        const targetUserId = isMeAdmin ? userId : ADMIN_ID;

        // 1. In dono ka chat room (Conversation) dhoondo
        const conversation = await Conversation.findOne({
            participants: { $all: [loggedInUserId, targetUserId] }
        });

        // Agar aaj tak baat nahi hui, toh khali array bhej do
        if (!conversation) {
            return res.status(200).json({ success: true, data: [] });
        }

        // 2. Us chat room ke saare messages nikal lo (Time ke hisaab se)
        const messages = await Message.find({ 
            conversationId: conversation._id 
        }).sort({ createdAt: 1 }); // 1 = Oldest first, jaisa WhatsApp me hota hai

        // 3. Samne wale ke bheje messages ko "Seen" mark kar do
        if (messages.length > 0) {
            await Message.updateMany(
                { 
                    conversationId: conversation._id, 
                    sender: targetUserId, 
                    seen: false 
                },
                { $set: { seen: true } }
            );
        }

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};