import express from 'express';
import inngest from "../inngest/inngestClient.js";
import { serve } from "inngest/express";
import { onUserSignup } from "../inngest/functions/onSignup.js";
import { onTicketCreation } from '../inngest/functions/onTicketCreate.js';

const router = express.Router();

router.use("/inngest", serve({ client: inngest, functions: [onUserSignup, onTicketCreation] }));

export default router;