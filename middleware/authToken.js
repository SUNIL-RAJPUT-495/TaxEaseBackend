import jwt from 'jsonwebtoken';

export const authToken = async (req, res, next) => {
    try {
        // 1. Token nikaalo (Cookie se ya Header se)
        const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                message: "Authentication Failed: Please Login",
                error: true,
                success: false
            });
        }

        // 2. Verify Token (❌ ACCESS_TOKEN_SECRET hata kar ✅ JWT_SECRET lagaya)
        // Kyunki Login controller mein aapne JWT_SECRET use kiya tha
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token Data:", decode);

        if (!decode) {
            return res.status(401).json({
                message: "Unauthorized access",
                error: true,
                success: false
            });
        }

        // 3. Set User ID (❌ req.user hata kar ✅ req.userId lagaya)
        // Kyunki controller 'req.userId' dhoond raha hai
        req.userId = decode?._id || decode?.id;
        
        next();

    } catch (err) {
        return res.status(401).json({
            message: "Session Expired or Invalid Token",
            error: true,
            success: false
        });
    }
};