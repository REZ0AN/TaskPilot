import express from "express";
import {
    userRegistraion,
    userLogin,
    userProfile,
    userLogout
} from "../controllers/user.controller.js";
import {
    getIdentity,
    getAccess
} from "../middlewares/auth.midddleware.js";


const userRouter = express.Router();


userRouter.route("/register").post(userRegistraion);
userRouter.route("/login").get(userLogin);
userRouter.route("/profile").get(getIdentity,userProfile);
userRouter.route("/logout").post(getIdentity,userLogout);

// TODO
// userRouter.route("/profile/update/:id").patch();
// userRouter.route("/profile/update").put();
// userRouter.route("/profiles").get();

export default userRouter;

