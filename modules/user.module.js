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
        unique: true,
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
        { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
    ],

    activeServices: [
        {
            serviceName: { type: String, required: true }, 
            planName: { type: String },
            status: { 
                type: String, 
                enum: ["pending", "active", "completed", "rejected"], 
                default: "pending" 
            },
            rejectionReason: { type: String, default: "" },
            purchaseDate: { type: Date, default: Date.now },
            expiryDate: { type: Date },
            orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
        }
    ],

    documents: [
        {
            name: { type: String },
            url: { type: String },
            publicId: { type: String },
            relatedService: { type: String },
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
            rejectionReason: { type: String, default: "" },
            uploadedAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
