import inngest from "../inngest/inngestClient.js";
import Ticket from '../models/ticket.model.js';
import User from '../models/user.model.js';

const createTicket = async (req, res) => {
    try {
        const { title, description} = req.body;
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and Description are required"
            });
        }
        const ticket = await Ticket.create({
            title,
            description,
            createdBy: req.user._id
        })
        
        try {
            console.log("Sending Inngest event...");
             await inngest.send({
                name: "ticket.create",
                data: {
                    ticketId: ticket._id,
                }
            });
            console.log("Inngest event sent successfully");
        } catch (inngestError) {
            console.error("Inngest send failed:", inngestError);
            console.log("Continuing with registration despite notification failure");
        }
        
         res.status(201).json({
            success:true,
            ticket
         });

    } catch (error) {
        res.status(500).json({
            error: "Ticket Creation Failure",
            success: false,
            message: error.message,
        });
    }
}  

const  getTicketById = async (req,res) => {
    try {
        const {ticketId} = req.query;
        if (!ticketId) {
            return res.status(400).json({
                success:false,
                message:"ticketId is required"
            })
        }

        const ticket = await Ticket.findById(ticketId);

        if(!ticket) {

            return res.status(404).json({
                success: false,
                message: "Ticket not found"
            });
        }
        res.status(200).json({
            success:true,
            ticket,
        })
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: `Internal server error : ${error.message}`
        });
    }
}          

const getTickets = async (req, res) => {
    try {
        const {state, priority, sortBy = 'createdAt', sortOrder='desc'} = req.query;
        let query = {};
       

        if (state) {
            const validStates = ["Ready For Work", "In Progress", "Ready For Peer Review", "In Peer Review", "Peer Reviewed", "Done"]
            if(!validStates.includes(state)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid state. Must be one of: ${validStates.join(', ')}`
                });
            }
            query.state = state;
        }
        if (priority) {
            const validPriorities = ["Low", "Medium", "High", "Critical"];
            if(!validPriorities.includes(priority)) {
                return res.status(400).json({
                    success:true,
                    message:`Invalid priority. Must be one of: ${validPriorities.join(', ')}`
                })
            }
            query.priority = priority;
        }
        const validSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'title'];
        const validSortOrders = ['asc', 'desc'];
        if (!validSortFields.includes(sortBy) || !validSortOrders.includes(sortOrder)) {
        return res.status(400).json({
            success: false,
            message: "Invalid sort parameters"
        });
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const tickets = await Ticket.find(query)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .sort(sort)
            .lean(); // Use lean() for better performance

        return res.status(200).json({
            success: true,
            tickets,
            count: tickets.length
        });

    } catch (error) {
        console.error('Error fetching tickets:', error);
        
        // Handle specific errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters"
            });
        }
        
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    } 
}
const getUsersWithThresholdTickets = async (threshold=3, userRole) => {
    const users= await Ticket.aggregate([
                                { $match: { role: userRole } },
                                { $group: { _id: "$assignedTo", count: { $sum: 1 } } },
                                { $match: { count: { $lt: threshold } } },
                                { $project: { _id: 1 } }
                            ])
    return users;
}
const getPossibleDevToBeAssignedOnTickets = async (userIdsWithFewTickets, ticket) => {
        const userIds = userIdsWithFewTickets.map(item => item._id);
        const relatedSkills = ticket.relatedSkills;
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
    return user;

}
const updateTicket = async (req, res) => {
    try {

        const {ticketId} = req.query;

        if (!ticketId) {
            res.status(400).json({
                success:false,
                message:"ticketId is required",
            })
        }

        const {state, priority, assignedTo, relatedSkills} = req.body;
        const ticket = await Ticket.findById(ticketId);

        if(!ticket) {
            res.status(404).json({
                success:false,
                message:"Ticket not Found",
            })
        }

        // Check authorization
        const isAdmin = req.user.role === 'admin';
        const isCreator = req.user._id.toString() === ticket.createdBy.toString();
        const isAssignee = ticket.assignedTo && req.user._id.toString() === ticket.assignedTo.toString();

        if (!isAdmin && !isCreator && !isAssignee) {
            return res.status(403).json({
                success: false,
                message: "You're not allowed to update this ticket"
            });
        }

        const updateFields = {};
        if(state && !assignedTo ) {
            const validStates = ["Ready For Work", "In Progress", "Ready For Peer Review", "In Peer Review", "Peer Reviewed", "Done"]
            if(!validStates.includes(state)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid state. Must be one of: ${validStates.join(', ')}`
                });
            }

            if (state === 'Ready For Work') {
                updateFields.assignedTo = ticket.createdBy;
            } else if(state === 'In Progress') {
                const userIdsWithFewTickets = await getUsersWithThresholdTickets(3, 'dev');
                const user = await getPossibleDevToBeAssignedOnTickets(userIdsWithFewTickets, ticket);

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
                    userToBeAssigned = userSdev[0]
                    if(!userToBeAssigned) {
                        const userAdmin = await User.find({
                                            role: 'admin',
                                        }, {
                                            password: 0,
                                            email: 0
                                        }).sort({ createdAt: -1 }).limit(1).lean();
                        userToBeAssigned = userAdmin[0]
                    }
                }

                updateFields.assignedTo = userToBeAssigned._id;
                updateFields.state = state;
                
            } else if (state === 'In Peer Review') {
                const userIdsWithFewTickets = await getUsersWithThresholdTickets(4, 'sdev');
                const user = await getPossibleDevToBeAssignedOnTickets(userIdsWithFewTickets, ticket);

                let userToBeAssigned ;
                if(user.length > 0) {   
                    userToBeAssigned = user[0];
                } else {
                
                    const userAdmin = await User.find({
                                        role: 'admin',
                                    }, {
                                        password: 0,
                                        email: 0
                                    }).sort({ createdAt: -1 }).limit(1).lean();

                    userToBeAssigned = userAdmin[0]


                    
                }

                updateFields.assignedTo = userToBeAssigned._id;
                updateFields.state = state;
            } else if (state === 'Peer Reviewed') {
                updateFields.state = 'Done';
            } else {
                updateFields.state = state;
            }
        }
        
        if(priority) {
            const validPriorities = ["Low", "Medium", "High", "Critical"];
            if(!validPriorities.includes(priority)) {
                return res.status(400).json({
                    success:true,
                    message:`Invalid priority. Must be one of: ${validPriorities.join(', ')}`
                })
            }
            updateFields.priority = priority
        }
        if(assignedTo) {
            const userExists = await User.findById(assignedTo);
            if(!userExists) {
                return res.status(400).json({
                    success:false,
                    message:'Assigned user not found'
                })
            }
            updateFields.assignedTo = assignedTo
            if(state) {
                const validStates = ["Ready For Work", "In Progress", "Ready For Peer Review", "In Peer Review", "Peer Reviewed", "Done"]
                if(!validStates.includes(state)) {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid state. Must be one of: ${validStates.join(', ')}`
                    });
                }
                updateFields.state = state;
            }
        }
        if(relatedSkills) {
            if(Array.isArray(relatedSkills)) {
                const invalidSkills = relatedSkills.filter(skill => typeof skill !== 'string' || skill.trim() === '');
                if (invalidSkills.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: "All skills must be non-empty strings"
                    });
                }
                updateFields.relatedSkills = relatedSkills.map(skill => skill.trim());
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Skills must be an array"
                });
            }
        }
        
        // Check if there are any fields to update
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update"
            });
        }

        updateFields.updatedAt = new Date();

        const updatedTicket = await Ticket.findByIdAndUpdate(
            ticketId,
            { $set: updateFields },
            { 
                new: true,
                runValidators: true
            }
        ).populate('createdBy', 'name email')
         .populate('assignedTo', 'name email');

        return res.status(200).json({
            success: true,
            ticket: updatedTicket
        });

    } catch (error) {
        
        return res.status(500).json({
            success: false,
            message: `Internal server error: ${error.message}`
        });
    }

}

const deleteTicket = async (req, res) => {
       try {
            const { ticketId } = req.params;
            
            if (!ticketId) {
                return res.status(400).json({
                    success: false,
                    message: "ticketId is required"
                });
            }
            // Find the Ticket to be deleted
            const ticketToDelete = await Ticket.findById(ticketId);
            
            if (!ticketToDelete) {
                return res.status(404).json({
                    success: false,
                    message: "Ticket not found"
                });
            }
           
            if(ticketToDelete.assignedTo.toString() === req.user._id || ticketToDelete.createdBy.toString() !== req.user._id) {
                return res.status(403).json({
                    success: false,
                    message: "SLA violation not allowed"
                })
            }

            // Delete the Ticket
            await Ticket.findByIdAndDelete(ticketId);
    
            return res.status(200).json({
                success: true,
                message: "Ticket deleted successfully"
            });
    
        } catch (error) {
            
            return res.status(500).json({
                success: false,
                message: `Internal Server Error: ${error.message}`
            });
        }
}

export  {
    createTicket,
    getTicketById,
    getTickets,
    updateTicket,
    deleteTicket
}