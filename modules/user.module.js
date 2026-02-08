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
            uploadedAt: { type: Date, default: Date.now }
        }
    ]
    
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
