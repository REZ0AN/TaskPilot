import userSchema from "../schema/user.schema.js";
import mongoose  from "mongoose";

export default mongoose.model("User", userSchema);