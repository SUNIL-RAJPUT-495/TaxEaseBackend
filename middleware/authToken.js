import jwt from 'jsonwebtoken';

export const authToken = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");


        if (!token) {
            return res.status(401).json({
                message: "Authentication Failed: Please Login",
                error: true,
                success: false
            });
        }

        const decode = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (!decode) {
            return res.status(401).json({
                message: "Unauthorized access",
                error: true,
                success: false
            });
        }

        req.user = { _id: decode._id || decode.id };
        
        next();

    } catch (err) {
        return res.status(401).json({
            message: "Session Expired or Invalid Token",
            error: true,
            success: false
        });
    }
};