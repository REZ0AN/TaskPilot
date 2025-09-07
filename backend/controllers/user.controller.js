import { getToken } from "../utils/jwt.js";
import User from "../models/user.model.js";
import { getHashedPassword, comparePassword } from "../utils/password.js";
import setTokenInCookie from "../utils/cookie.js";


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
        const token = getToken(user._id, user.email, user.role);
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




export {
    userRegistraion, 
    userLogin,
    userProfile,
}