import inngest from "../clinet.js";
import User from "../../models/user.model.js";
import { sendDiscordNotification } from "../../utils/notification.js";
import { NonRetriableError } from "inngest";
export const onUserSignup = inngest.createFunction(
    {id: "on-user-signup", retries:2},
    {event: "user.signup"},
    async ({event, step}) => {
        try {
            const {email} = event.data;
            
        
            // check if user exists in db
            const user = await step.run("get-user", async () => {
                const user = await User.findOne({email}).lean();
                if (!user) {
                    console.log("User not found with email:", email);
                    throw new NonRetriableError("User not found");
                }
                delete user.password; // remove password from user object
                console.log("User found:", user.email);
                return user;
            })

            await step.run("send-notification-to-server-owner", async () => {

                const message = `New User Signed Up: ${user.email}\n\nUser ID: ${user._id}\nName: ${user.name || "N/A"}`;

                // send notification to server owner
                await sendDiscordNotification(message);
                console.log("Notification sent to server owner");
            })

            console.log("onUserSignup function completed successfully");
            return {
                success: true
            }



        } catch (error) {
           console.error("Error in onUserSignup function:", error);
           return {
               success: false,
               error: error.message
           }    
        }
    }
);