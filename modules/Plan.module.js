import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  serviceCategory: { 
    type: String, 
    required: true,
    enum: ["ITR Filing", "Tax Planning", "GST Services", "Notice Handling"] 
  },
  planName: {
     type: String,
      required: true 
    }, 
  price: {
     type: Number,
      required: true
     },
  description: { 
    type: String, 
    required: true
 },
  features: [{ type: String }], 
  isPopular: {
     type: Boolean, 
     default: false 
    },
  isActive: { 
    type: Boolean,
     default: true
     } 
}, { timestamps: true });

export const Plan = mongoose.model("Plan", planSchema);