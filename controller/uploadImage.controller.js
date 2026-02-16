import uploadImageCloudinary from "../utils/uploadImageCloudnery.js";
import { User } from "../modules/user.module.js";

// 1. ADMIN UPLOAD LOGIC
export const adminUploadToUser = async (req, res) => {
    try {
        const { userId } = req.body;
        const file = req.file;

        if (!file || !userId) {
            return res.status(400).json({ success: false, message: "File or UserID missing" });
        }

        const uploaded = await uploadImageCloudinary(file, "TAX/admin_uploads");

        const newDocument = {
            name: file.originalname,
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            uploadedBy: "ADMIN",
            status: "active", // Change from hidden/rejected to active
            uploadedAt: new Date()
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $push: { documents: newDocument },
                $set: {
                    filingStatus: "uploaded", // Reset status taaki user ko buttons dikhein
                    rejectionReason: ""        // Purana reason clear kar dein
                }
            },
            { new: true }
        ).populate("documents");

        res.status(200).json({
            success: true,
            message: "Document successfully sent to user!",
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. USER UPLOAD LOGIC 
export const uploadSingleImage = async (req, res) => {
  try {
    const userId = req.userId; 
    if (!req.file) return res.status(400).json({ success: false, message: "No image provided" });

    const uploaded = await uploadImageCloudinary(req.file, "TAX/documents");

    const newDocument = {
        name: req.file.originalname, 
        url: uploaded.secure_url,    
        publicId: uploaded.public_id, 
        uploadedBy: "USER",
        status: "pending",
        uploadedAt: new Date()
    };

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { documents: newDocument } },
        { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Uploaded successfully",
      data: updatedUser.documents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getMyDocuments = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 🔥 LOGIC: Agar status 'rejected' hai toh Admin ke purane docs hide kar do
        // Agar 'uploaded' ya 'pending' hai toh sab dikhao
        let filteredDocs = user.documents;
        
        if (user.filingStatus === 'rejected') {
            // User ko sirf uske khud ke upload kiye huye docs dikhenge jab tak naya dispatch na aaye
            filteredDocs = user.documents.filter(doc => doc.uploadedBy === 'USER');
        }

        const sortedDocs = filteredDocs.sort((a, b) => b.uploadedAt - a.uploadedAt);

        res.status(200).json({
            success: true,
            data: sortedDocs // Fixed spelling error (sortedDocsz -> sortedDocs)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



// controller/file.controller.js
export const updateFileDecision = async (req, res) => {
    try {
        const userId = req.userId;
        const { decision, reason } = req.body;

        const updateData = {
            filingStatus: decision,
            rejectionReason: decision === 'rejected' ? reason : ""
        };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        );

        res.status(200).json({ 
            success: true, 
            message: decision === 'rejected' ? "Rejection sent to Admin" : "Files approved!",
            data: updatedUser.filingStatus
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFileDecisionStatus = async (req, res) => {
    try {
        // Agar Admin ne bhei hai toh req.params.userId, warna req.userId (Token se)
        const targetId = req.params.userId || req.userId;

        const user = await User.findById(targetId).select("filingStatus rejectionReason");

        if (!user) {
            return res.status(404).json({ success: false, message: "User nahi mila" });
        }

        res.status(200).json({
            success: true,
            data: {
                status: user.filingStatus || 'pending',
                reason: user.rejectionReason || ''
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};