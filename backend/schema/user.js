import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email:{type: String, required: true, unique: true},
    password:{type: String, required: true},
    role:{type: String, default:"dev", enum: ["dev", "admin", "sdev"]},
    skills: [String]
    }, {
        timestamps: true,
    });



export default userSchema;