import { getToken } from "../utils/jwt.js";
import User from "../models/user.model.js";
import { getHashedPassword, comparePassword } from "../utils/password.js";
import {setTokenInCookie, clearTokenCookie} from "../utils/cookie.js";
import inngest from "../inngest/clinet.js";

const userRegistraion = async (req, res) => {
    try {

        const {name, email, password} = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ error: 'User already exists' });

        const hashedPassword =  await getHashedPassword(password);
        const user = await User.create({
            name,
            email,
            password:hashedPassword
        });
        // fire event to inngest
        // Add try-catch around Inngest specifically
        try {
            console.log("Sending Inngest event...");
            await inngest.send({
                name: "user.signup",
                data: {
                    email,
                }
            });
            console.log("Inngest event sent successfully");
        } catch (inngestError) {
            console.error("Inngest send failed:", inngestError);
            // Don't fail registration if notification fails
            console.log("Continuing with registration despite notification failure");
        }

        const token = getToken(user._id, user.email, user.role);
        setTokenInCookie(token,res);
        res.status(201).json({success:true});

    } catch(error) {
        res.status(500).json({
            error:"Registration Failure",
            success: false,
            message : error.message,
        })
    }
};


const userLogin = async (req, res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password) {
            res.status(400).json({
                success:false,
                message:"Email and Password Must be Filled"
            });
        }

        const user = await User.findOne({ email });
        if(!user) {
            res.status(404).json({
                success:false,
                message:"User Not Found"
            })
        }
        const isPasswordMatched = comparePassword(user.password, password);
        if(!isPasswordMatched) {
            res.status(401).json({
                success:false,
                message:"Invalid Email or Password"
            })
        }
        const tokenPayload =  {
            userId: user._id,
            email: user.email,
            role: user.role,
        }
        const token = getToken(tokenPayload);
        setTokenInCookie(token,res);
        res.status(200).json({
            success:true,
        })

    } catch (error) {
        res.status(500).json({
            success:false,
            error:"Login Failure",
            message: error.message
        })
    }
}

const userProfile = async (req, res) => {
    try {
        const {id} = req.query || null;
        if(id) {
            const user = await User.findById(id).lean();
            if(!user) {
                res.status(404).json({
                    success:false,
                    message:"User not Found",
                })
            }

            delete user.password;
            res.json(user);
            return ;
        }
        const userId = req.user._id;
        const user = await User.findById(userId).select("-password").lean();
        res.json(user);
    } catch (error) {
        res.status(500).json({
            success:false,
            message: error.message,
            error:"Profile Not Available"
        })
    }

}

const userLogout = async (req, res) => {
    try {
        clearTokenCookie(res);
        res.status(200).json({
            success:true,
            message:"Logged Out Successfully"
        })
    } catch (error) {
        res.status(500).json({
            success:false,
            message: error.message,
            error:"Logout Failure"
        })
    }
}


export {
    userRegistraion, 
    userLogin,
    userProfile,
    userLogout
}