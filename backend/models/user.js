import userSchema from "../schema/user.js";
import mongoose  from "mongoose";

export default mongoose.model("User", userSchema);