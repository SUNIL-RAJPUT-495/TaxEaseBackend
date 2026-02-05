import jwt from 'jsonwebtoken';

export const generateToken = async (userId) => {
    if (!process.env.JWT_SECRET) {
        console.error("CRITICAL ERROR: 'JWT_SECRET' ");
        throw new Error("Server Misconfiguration");
    }

    const token = await jwt.sign(
        { _id: userId }, 
        process.env.JWT_SECRET, 
        { expiresIn: '7d' } 
    );

    return token;
};