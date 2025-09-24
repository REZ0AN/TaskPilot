import mongoose from "mongoose";
import ticketSchema from "../schema/ticket.schema.js";

export default mongoose.model("Ticket", ticketSchema);