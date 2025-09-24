import inngest from "../inngestClient.js";
import Ticket from "../../models/ticket.model.js";
import User from '../../models/user.model.js';
import { analyzeTicket } from "../../utils/agent.js";
import { NonRetriableError } from "inngest";

export const onTicketCreation = inngest.createFunction(
    {id: "on-ticket-creation", retries:2},
    {event: "ticket.create"}, async ({event, step}) => {
        try {
            const {ticketId} = event.data;
            
            // Return ticket from first step
            const ticket = await step.run("fetch ticket", async ()=> {
                if (!ticketId) {
                    throw new NonRetriableError("TicketID Not Given");
                }

                const foundTicket = await Ticket.findById(ticketId);

                if(!foundTicket) {
                    throw new NonRetriableError("Ticket Not Found")
                }
                
                return foundTicket; // Return the ticket so it can be used later
            })

            const ticketAdditional = await analyzeTicket(ticket);

            if(!ticketAdditional) {
                throw new Error('Error parsing Gemini response');
            }

            await step.run("update ticket", async () => {
                
                const {priority, deadline, helpNotes, relatedSkills} = ticketAdditional;
                const users= await Ticket.aggregate([
                                            { $match: { role: 'dev' } },
                                            { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
                                            { $match: { count: { $lt: 3 } } },
                                            { $project: { _id: 1 } }
                                        ])
                const userIds = users.map(item => item._id);
                const user = await User.aggregate([
                            {
                                $match : {
                                    _id : {$in : userIds},
                                }
                            }, {
        
                                $addFields:{
                                    matchedSkills :{
                                        $setIntersection:["$skills", relatedSkills]
                                    }
                                }
                            }, {
                                $addFields : {
                                    matchCount: { $size : "$matchedSkills"}
                                }
                            },{
                                // Filter out users with zero matching skills
                                $match: {
                                    matchCount: { $gt: 0 }
                                }
                            
                            }, {
                                $project :{
                                    password: 0,
                                    email : 0,
                                }
                            }, {
                                $sort: {matchCount : -1}
                            }, {
                                $limit : 1
                            }]);
                let userToBeAssigned ;
                if(user.length > 0) {   
                    userToBeAssigned = user[0];
                } else {
                    const userSdev = await User.find({
                                    role: 'sdev',
                                }, {
                                    password: 0,
                                    email: 0
                                }).sort({ createdAt: 1 }).limit(1).lean();
                    userToBeAssigned = userSdev[0];
                    if(!userToBeAssigned) {
                        const userAdmin = await User.find({
                                    role: 'admin',
                                }, {
                                    password: 0,
                                    email: 0
                                }).sort({ createdAt: -1 }).limit(1).lean();
                        userToBeAssigned = userAdmin[0];
                    }
                }
                console.log(userToBeAssigned);
                const ticketUpdated = await Ticket.findByIdAndUpdate(ticketId, { // Also fix the typo here
                    priority : !["Low", "Medium", "High", "Critical"].includes(priority) ? "Medium" : priority, // Fix case
                    deadline,
                    helpNotes,
                    relatedSkills,
                    state:"In Progress",
                    assignedTo:userToBeAssigned._id
                }, {new:true})

                return {
                    success: true,
                    ticketUpdated,
                }
            })
            
        } catch (error) {
            console.error("Error in onTicketCreation function:", error);
            return {
                success: false,
                error: error.message
            }    
        }
    }
);