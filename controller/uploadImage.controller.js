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
        status: "approved",  
        uploadedAt: new Date()
    };


    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { documents: newDocument } },
        { new: true }
    ).populate("documents");

    res.status(200).json({
      success: true,
      message: "Document successfully sent to user!",
      data: updatedUser 
    });

  } catch (error) {
    console.error("Admin Upload Error:", error);
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