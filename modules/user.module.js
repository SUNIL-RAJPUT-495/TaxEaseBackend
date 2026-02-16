import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true    
    },
    phone: {
        type: String,
        required: true,
        unique: true    ,
        sparse: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    orders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order' 
        }
    ],
    activePlan: {
        serviceName: { type: String, default: null },
        planName: { type: String, default: null },
        isActive: { type: Boolean, default: false },
        expiryDate: { type: Date }
    },
    documents: [
        {
            name: { type: String },   
            url: { type: String },       
            publicId: { type: String },  
            uploadedBy: { 
                type: String, 
                enum: ['USER', 'ADMIN'], 
                default: 'USER' 
            }, 
            status: { 
                type: String, 
                enum: ['pending', 'approved', 'rejected'], 
                default: 'pending' 
            }, 
            uploadedAt: { type: Date, default: Date.now }
        }
    ],
    filingStatus: {
        type: String,
        enum: ["pending", "uploaded", "approved", "rejected"],
        default: "pending"
    },
    rejectionReason: {
        type: String,
        default: ""
    }
    
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
