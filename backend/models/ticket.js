import mongoose from "mongoose";
import ticketSchema from "../schema/ticket.js";

export default mongoose.model("Ticket", ticketSchema);