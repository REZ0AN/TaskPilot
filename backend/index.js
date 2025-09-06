import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./db/mongoConnect.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());



const startServer = async () => {
    try {

       await connectDb(MONGO_URI);

       app.listen(PORT, () => {

        console.log(`Server is running on http://localhost:${PORT}`);
        
        });

    } catch (error) {
        console.error("Failed to start app due to DB connection error:", err);
        process.exit(1);
    } 
}
