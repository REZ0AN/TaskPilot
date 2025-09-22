import jwt from "jsonwebtoken";
import {
    JWT_SECRET,
    TOKEN_EXPIRES_IN
} from '../configs/systemVariables.js';

const getToken = (payload) => {
    if (!JWT_SECRET) {
         throw new Error("Token Creation Failed, User Need to Login");
    }
    return jwt.sign({
       userId: payload['userId'],
       email: payload['email'],
       role: payload['role'],
    }, JWT_SECRET, {expiresIn:TOKEN_EXPIRES_IN});
}

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error("Invalid or Expired token");
    }
};


export {getToken, verifyToken};