import mongoose from "mongoose";

const connectDb = async (MONGO_URI) => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB is Connected");
  } catch (error) {
    console.log("MongoDB error: ", error.message);
    throw error; 
  }
};

export default connectDb;
           