import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
    title:  { type : String, required: true },
    description:    { type : String, required: true },
    state : {
        type: String, 
        default: "Ready For Work", 
        enum: ["Ready For Work", "In Progress", "Ready For Peer Review", "In Peer Review", "Peer Reviewed", "Done"]
    },
    createdBy : { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedTo :    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    priority :  Number,
    deadline :  Date,
    helpNotes : String,
    relatedSkills : [String],
    }, {
    timestamps: true,
});



export default ticketSchema;