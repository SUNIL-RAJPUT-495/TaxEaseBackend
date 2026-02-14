import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: false 
},
  name: { 
    type: String,
     required: true },
  email: { 
    type: String, 
    required: true },
  phone: { 
    type: String,
    required: true,
  sparse: true },
  pan: { 
    type: String,
  required: true },
  service: {
     type: String, 
     required: true },
  plan: {
     type: String, 
     required: true },    
  amount: { 
    type: Number,
     required: true }, 
  orderId: { 
    type: String, 
    required: true },
  paymentId: { 
    type: String },  
    isSeen: {
        type: Boolean,
        default: false 
    },            
  status: { 
    type: String, 
    enum: ["created", "paid", "failed"], 
    default: "created" 
  },
}, { timestamps: true });

export const Order = mongoose.model("Order", orderSchema);