// models/DocRequirement.js
import mongoose from "mongoose";

const docRequirementSchema = new mongoose.Schema({
    serviceId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Service',
         required: true },
    planId: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: 'Plan',
          required: true },
    Documents: [
        {
            docName: { type: String, required: true }, 
            description: { type: String },          
            isMandatory: { type: Boolean, default: true }
        }
    ]
}, { timestamps: true });

export const DocRequirement = mongoose.model("DocRequirement", docRequirementSchema);