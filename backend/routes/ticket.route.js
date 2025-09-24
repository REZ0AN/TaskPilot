import express from 'express';
import {
    createTicket,
    deleteTicket,
    getTicketById,
    getTickets,
    updateTicket
}  from '../controllers/ticket.controller.js';
import {
    getIdentity,
    getAccess
} from "../middlewares/auth.midddleware.js";

const ticketRouter = express.Router();



ticketRouter.route('/add').post( getIdentity, getAccess("admin") ,createTicket);

ticketRouter.route('/').get(getIdentity,getTickets);

ticketRouter.route('/details').get(getIdentity, getTicketById);
ticketRouter.route('/update').put(getIdentity, updateTicket);
ticketRouter.route('/delete/:ticketId').delete(getIdentity, getAccess("admin"), deleteTicket);



export default ticketRouter;