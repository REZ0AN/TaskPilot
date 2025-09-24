import express from "express";
import {
    userRegistration,
    userLogin,
    userProfile,
    userLogout,
    updateUser,
    getUsers,
    deleteUser
} from "../controllers/user.controller.js";
import {
    getAccess,
    getIdentity,
} from "../middlewares/auth.midddleware.js";


const userRouter = express.Router();


userRouter.route("/signup").post(userRegistration);
userRouter.route("/signin").post(userLogin);
userRouter.route("/signout").post(getIdentity,userLogout);

userRouter.route("/").get(getIdentity,getUsers);

userRouter.route("/profile").get(getIdentity,userProfile);
userRouter.route("/delete/:userId").delete(getIdentity, getAccess("admin"), deleteUser);
userRouter.route("/profile").put(getIdentity, updateUser);





export default userRouter;

