import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true, sparse: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    orders: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }
    ],

    activeServices: [
        {
            serviceName: {
                 type: String,
                  required: true
                 }, 
            planName: { type: String },
            orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
            purchaseDate: { type: Date, default: Date.now },
            
            status: { 
                type: String, 
                enum: ["pending", "processing", "success", "rejected"], 
                default: "pending" 
            },
            serviceRejectionReason: { type: String, default: "" }, 

            
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
                 
                    docStatus: {
                        type: String,
                        enum: ['pending', 'approved', 'rejected'],
                        default: 'pending'
                    },
                    docRejectionReason: { type: String, default: "" },
                    uploadedAt: { type: Date, default: Date.now }
                }
            ]
        }
    ]
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);