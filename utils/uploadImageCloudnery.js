import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINERY_CLOUD_NAME,
    api_key: process.env.CLOUDINERY_API_KEY,
    api_secret: process.env.CLOUDINERY_API_SECRET_KEY
});

const uploadImageCloudinary = async (image,folderPath = "TAX/others") => {
    if (!image || !image.buffer) {
        throw new Error("Image buffer missing. Did you use multer?");
    }

    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder: folderPath},
            (error, result) => {
                if (error) reject(error);
                else resolve(result) 
                
;
            }
        ).end(image.buffer); 
    });
};

export default uploadImageCloudinary;
