import dotenv  from "dotenv";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const APP_URL = process.env.APP_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const PORT = process.env.PORT;
const SALT_ROUNDS = process.env.SALT_ROUNDS;
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN;
const API_VERSION = process.env.API_VERSION;


export {
  MONGO_URI,
  JWT_SECRET,
  APP_URL,
  GEMINI_API_KEY,
  DISCORD_WEBHOOK,
  PORT,
  SALT_ROUNDS,
  TOKEN_EXPIRES_IN,
  API_VERSION,
};