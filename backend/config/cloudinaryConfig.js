import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config(); // Ensure environment variables are loaded

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Use https
});

// Helper function to upload a buffer stream to Cloudinary
export const uploadToCloudinary = (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    return reject(new Error('Failed to upload file to Cloudinary.'));
                }
                resolve(result); // Contains secure_url, public_id, etc.
            }
        );
        // Pipe the buffer into the upload stream
        uploadStream.end(fileBuffer);
    });
};

export default cloudinary; // Export configured instance if needed elsewhere