import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  
  serviceType: { 
    type: String, 
    enum: ["ITR Filing", "Tax Planning", "GST Services", "Notice Handling"], 
    required: true 
  },
  planName: { 
    type: String, 
    enum: ["Basic", "Standard", "Premium"], 
    required: true 
  },
  amount: { type: Number, required: true },

  status: { 
    type: String, 
    enum: ["Pending", "Documents Uploaded", "In Progress", "Completed", "Cancelled"], 
    default: "Pending" 
  },

  documents: [
    {
      docName: { type: String }, 
      fileUrl: { type: String }, 
      uploadedAt: { type: Date, default: Date.now }
    }
  ],

  adminNote: { type: String }

}, { timestamps: true });

export const Order = mongoose.model("Order", orderSchema);