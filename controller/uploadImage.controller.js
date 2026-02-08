import uploadImageCloudinary from "../utils/uploadImageCloudnery.js";
import { User } from "../modules/user.module.js";

// ================= SINGLE IMAGE & SAVE TO USER DOCS =================


export const uploadSingleImage = async (req, res) => {
  try {
    const userId = req.userId; 


    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No image provided" ,
        error:true
      });
    }
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: User ID missing" });
    }

    const folder = req.body.folder || "TAX/documents"; 

 
    const uploaded = await uploadImageCloudinary(req.file, folder);

  
    const newDocument = {
        name: req.file.originalname, 
        url: uploaded.secure_url,    
        publicId: uploaded.public_id, 
        uploadedAt: new Date()
    };

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { 
            $push: { documents: newDocument } 
        },
        { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Document Uploaded & Saved Successfully",
      data: {
          url: uploaded.secure_url,
          allDocuments: updatedUser.documents 
      },
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// // ================= MULTIPLE PRODUCT IMAGES =================
// export const uploadProductImages = async (req, res) => {
//   try {
//     const files = req.files || [];
//     if (files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No images provided",
//       });
//     }

//     const folder = req.body.folder || "blinkit/products";

//     const uploadedImages = await Promise.all(
//       files.map(file => uploadImageCloudinary(file, folder))
//     );

//     const urls = uploadedImages.map(img => img.secure_url);

//     res.status(201).json({
//       success: true,
//       data: urls, // array of URLs
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
