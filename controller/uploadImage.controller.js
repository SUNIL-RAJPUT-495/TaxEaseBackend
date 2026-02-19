import uploadImageCloudinary from "../utils/uploadImageCloudnery.js";
import { User } from "../modules/user.module.js";

export const adminUploadToUser = async (req, res) => {
    try {
        const { userId, activeServiceId } = req.body; 
        const file = req.file;

        if (!file || !userId || !activeServiceId) {
            return res.status(400).json({ success: false, message: "File, UserID, or ServiceID missing" });
        }

        const uploaded = await uploadImageCloudinary(file, "TAX/admin_uploads");

        const newDocument = {
            name: file.originalname,
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            uploadedBy: "ADMIN",
            docStatus: "pending", 
            docRejectionReason: "",
            uploadedAt: new Date()
        };

        const updatedUser = await User.findOneAndUpdate(
            { _id: userId, "activeServices._id": activeServiceId },
            { 
                $push: { "activeServices.$.documents": newDocument }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User or Service not found" });
        }

        res.status(200).json({
            success: true,
            message: "Document successfully sent to user!",
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const uploadSingleImage = async (req, res) => {
  try {
    const userId = req.userId; 
    const { activeServiceId } = req.body; 

    if (!req.file || !activeServiceId) {
        return res.status(400).json({ success: false, message: "Image or Service ID missing" });
    }

    const uploaded = await uploadImageCloudinary(req.file, "TAX/documents");

    const newDocument = {
        name: req.file.originalname, 
        url: uploaded.secure_url,    
        publicId: uploaded.public_id, 
        uploadedBy: "USER",
        docStatus: "pending",
        uploadedAt: new Date()
    };

    const updatedUser = await User.findOneAndUpdate(
        { _id: userId, "activeServices._id": activeServiceId },
        { $push: { "activeServices.$.documents": newDocument } },
        { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Uploaded successfully",
      data: updatedUser 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



export const getMyDocuments = async (req, res) => {
    try {
        const userId = req.userId;
        const { activeServiceId } = req.query; 

        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const service = user.activeServices.find(s => s._id.toString() === activeServiceId);

        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        const sortedDocs = service.documents.sort((a, b) => b.uploadedAt - a.uploadedAt);

        res.status(200).json({
            success: true,
            data: sortedDocs 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};




export const updateFileDecision = async (req, res) => {
    try {
        const userId = req.userId;
        const { activeServiceId, documentId, decision, reason } = req.body; 

        if (!activeServiceId || !documentId || !decision) {
            return res.status(400).json({ success: false, message: "Missing parameters" });
        }

        const updatedUser = await User.findOneAndUpdate(
            { 
                _id: userId, 
                "activeServices._id": activeServiceId,
                "activeServices.documents._id": documentId
            },
            { 
                $set: { 
                    "activeServices.$[service].documents.$[doc].docStatus": decision, 
                    "activeServices.$[service].documents.$[doc].docRejectionReason": decision === 'rejected' ? reason : ""
                } 
            },
            { 
                arrayFilters: [
                    { "service._id": activeServiceId },
                    { "doc._id": documentId }
                ],
                new: true 
            }
        );

        res.status(200).json({ 
            success: true, 
            message: decision === 'rejected' ? "Feedback sent to Admin!" : "File Approved successfully!",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};




export const getFileDecisionStatus = async (req, res) => {
    try {
        const targetId = req.params.userId || req.userId;
        const { activeServiceId } = req.query; 

        const user = await User.findById(targetId);

        if (!user) return res.status(404).json({ success: false, message: "User nahi mila" });

        const service = user.activeServices.find(s => s._id.toString() === activeServiceId);

        if(!service) return res.status(404).json({ success: false, message: "Service nahi mili" });

        res.status(200).json({
            success: true,
            data: {
                status: service.status || 'pending',
                serviceRejectionReason: service.serviceRejectionReason || ''
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};