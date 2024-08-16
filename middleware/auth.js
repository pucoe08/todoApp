import jwt from "jsonwebtoken";
import { User } from "../models/users.js";

export const isAuthenticated = async (req, res, next) => {
try {
    const {token} = req.cookies;
    if(!token){
        return res.status(401).json({
            success: false,
            message: "Please login"
        })
    }

    // In decoded data we get id
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if(!user){
        return res.status(401).json({
            success: false,
            message: "User not found"
        })
    }
    req.user = user;
    next();
    
} catch (error) {
    res.status(500).json({
        success: false,
        message: error.message
    })
}
}