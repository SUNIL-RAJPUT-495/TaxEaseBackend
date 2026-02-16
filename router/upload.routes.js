import { Router } from "express";
import upload from "../middleware/multer.js";
import { adminUploadToUser, getFileDecisionStatus, getMyDocuments, updateFileDecision, uploadSingleImage } from "../controller/uploadImage.controller.js";
import { authToken } from "../middleware/authToken.js";

const uploadRouter = Router();

uploadRouter.post(
  "/upload",
  authToken,          
  upload.single("file"), 
  uploadSingleImage  
);
uploadRouter.post(
  "/upload-admin",
  authToken,          
  upload.single("file"), 
  adminUploadToUser 
);

uploadRouter.get("/getMyDocuments",authToken,getMyDocuments)

uploadRouter.post("/update-decision", authToken, updateFileDecision)

// Admin ke liye (ID ke sath)
uploadRouter.get("/get-user-decision/:userId", authToken, getFileDecisionStatus);

// User ke liye (Bina ID ke)
uploadRouter.get("/get-user-decision", authToken, getFileDecisionStatus);

export default uploadRouter;  



