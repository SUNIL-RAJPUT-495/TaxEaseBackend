import { Router } from "express";
import upload from "../middleware/multer.js";
import { uploadSingleImage } from "../controller/uploadImage.controller.js";
import { authToken } from "../middleware/authToken.js";

const uploadRouter = Router();

uploadRouter.post(
  "/upload",
  authToken,          
  upload.single("file"), 
  uploadSingleImage  
);


// uploadRouter.post(
//   "/upload-product",
//   upload.array("productImages", 5),
//   uploadProductImages
// );


export default uploadRouter;



