import express from 'express';
import inngest from "../inngest/clinet.js";
import { serve } from "inngest/express";
import { onUserSignup } from "../inngest/functions/onSignup.js";

const router = express.Router();

router.use("/inngest", serve({ client: inngest, functions: [onUserSignup] }));

export default router;