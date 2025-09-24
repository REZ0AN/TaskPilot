import { getToken } from "../utils/jwt.js";
import User from "../models/user.model.js";
import { getHashedPassword, comparePassword } from "../utils/password.js";
import {setTokenInCookie, clearTokenCookie} from "../utils/cookie.js";
import inngest from "../inngest/inngestClient.js";
import Ticket from "../models/ticket.model.js";

const userRegistration = async (req, res) => {
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

const updateUser = async (req, res) => {
    try {
        const {userId} = req.query;
        const {name, skills, password, confirmPassword, role} = req.body;
        const updateFields = {}
        
        if(!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required"
            })
        }
        
        const userExists = await User.findById(userId);
        if(!userExists) {
            return res.status(404).json({
                success: false,
                message: "User not Found"
            })
        }

        const isAdmin = req.user.role === 'admin';
        const isOwnProfile = userId === req.user._id.toString();

        // Authorization checks
        if(role && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only admin can change user roles"
            })
        }

        // For name, skills, password - only allow updates to own profile
        if((name || skills || password || confirmPassword) && !isOwnProfile) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own profile information"
            })
        }

        // Validate and process name
        if(name) {
            if (typeof name !== 'string' || name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Name must be at least 2 characters long"
                });
            }
            updateFields.name = name.trim();
        }
        
        // Validate and process skills
        if(skills) {
            if (Array.isArray(skills)) {
                const invalidSkills = skills.filter(skill => typeof skill !== 'string' || skill.trim() === '');
                if (invalidSkills.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: "All skills must be non-empty strings"
                    });
                }
                updateFields.skills = skills.map(skill => skill.trim());
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Skills must be an array"
                });
            }
        }
        
        // Validate and process password
        if(password || confirmPassword) {
            if (!password || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Both password and confirm password are required"
                });
            }
            
            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Password and confirm password do not match"
                });
            }
            
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters long"
                });
            }
            
            const hashedPassword = await getHashedPassword(password);
            updateFields.password = hashedPassword;
        }
        
        // Validate and process role (only admin can do this)
        if(role && isAdmin) {
            const validRoles = ['admin', 'dev', 'sdev'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
                });
            }
            updateFields.role = role;
        }
        
        // Check if there are any fields to update
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update"
            });
        }

        // Add updatedAt timestamp
        updateFields.updatedAt = new Date();
        
        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { 
                new: true,
                runValidators: true
            }
        ).select('-password'); // Exclude password from response

        return res.status(200).json({
            success: true,
            user: updatedUser
        });
        
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: `Internal Server Error: ${error.message}`
        });
    }
}

const getUsers = async (req, res) => {
    try {
        const { roles, skills, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        // Build query object
        let query = {};
        
        // Filter by roles (can be comma-separated: ?roles=admin,developer)
        if (roles) {
            const roleArray = roles.split(',').map(role => role.trim());
            const validRoles = ['admin', 'dev', 'sdev'];
            
            // Validate roles
            const invalidRoles = roleArray.filter(role => !validRoles.includes(role));
            if (invalidRoles.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid roles: ${invalidRoles.join(', ')}. Valid roles: ${validRoles.join(', ')}`
                });
            }
            
            query.role = { $in: roleArray };
        }
        
        // Filter by skills (can be comma-separated: ?skills=javascript,react)
        if (skills) {
            const skillArray = skills.split(',').map(skill => skill.trim());
            // Use $all for users who have ALL specified skills, or $in for users who have ANY of the skills
            query.skills = { $in: skillArray }; // Change to $all if you want users with ALL skills
        }
        
        // Validate sort parameters
        const validSortFields = ['name', 'email', 'role', 'createdAt', 'updatedAt'];
        const validSortOrders = ['asc', 'desc'];
        
        if (!validSortFields.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: `Invalid sortBy field. Valid fields: ${validSortFields.join(', ')}`
            });
        }
        
        if (!validSortOrders.includes(sortOrder)) {
            return res.status(400).json({
                success: false,
                message: `Invalid sortOrder. Valid orders: ${validSortOrders.join(', ')}`
            });
        }
        
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        // Execute query
        const users = await User.find(query)
            .select('-password')
            .sort(sort)
            .lean();
        
        return res.status(200).json({
            success: true,
            users,
            count: users.length,
            filters: {
                roles: roles ? roles.split(',').map(r => r.trim()) : null,
                skills: skills ? skills.split(',').map(s => s.trim()) : null,
                sortBy,
                sortOrder
            }
        });
        
    } catch (error) {        
        console.error('Error fetching users:', error);
        
        return res.status(500).json({
            success: false,
            message: `Internal server error: ${error.message}`
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });
        }

        // Find the user to be deleted
        const userToDelete = await User.findById(userId);
        
        if (!userToDelete) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent admin from deleting themselves
        if (req.user._id.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account"
            });
        }

        
        if (userToDelete.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot delete the last admin user"
                });
            }
        }

        // Delete Created Tickets by that user
        await Ticket.deleteMany({
          createdBy:userId  
        })

        // Update Assigned Tickets to Removers
        await Ticket.updateMany({ assignedTo: userId }, { $set: { assignedTo: req.user._id } });

        // Delete the user
        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });

    } catch (error) {
        
        return res.status(500).json({
            success: false,
            message: `Internal Server Error: ${error.message}`
        });
    }
};

export {
    userRegistration, 
    userLogin,
    userProfile,
    userLogout,
    updateUser,
    getUsers,
    deleteUser
}