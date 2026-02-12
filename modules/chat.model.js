import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'users', 
        required: true 
    },
    receiver: {
         type: mongoose.Schema.Types.ObjectId,
          ref: 'users',
          required: true }, 
    message: { 
        type: String,
         required: true 
        },
    seen: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

export const Chat = mongoose.model("chats", chatSchema);