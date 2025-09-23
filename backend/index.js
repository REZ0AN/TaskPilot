import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDb from "./db/mongoConnect.js";
import userRoutes from './routes/user.route.js';
import inngestRoutes from './routes/ingest.route.js';
import {
    API_VERSION,
    PORT,
    MONGO_URI
} from './configs/systemVariables.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(`/api/${API_VERSION}/user`, userRoutes);
app.use("/api", inngestRoutes);



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

startServer();