import { verifyToken } from "../utils/jwt.js";

const getIdentity = async (req, res, next) => {

    const {token} = req.cookies;
    if(!token) {
        return res.status(401).json({
            success:false,
            error:"Identity not found",
            message:"Register/Login to get identity"
        });
    }
    try {
        const decoded = verifyToken(token);
        req.user = {
            _id : decoded.userId,
            email: decoded.email,
            role: decoded.role
        }
        next();

    } catch (error) {
        res.clearCookie("token");
        return res.status(401).json({ success:false, error: "Invalid or expired token. Please login again.", message:error.message });
    }
}

const getAccess = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Access Denied",
        message: "User doesn't have enough privileges to access this resource",
      });
    }

    // user is authorized
    next();
  };
};


export {getIdentity, getAccess};