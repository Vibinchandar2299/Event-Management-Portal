import express from "express";
import { sendAutoSchedulingEmail } from "../other/Whatsapp.js";

const router = express.Router();

router.get("/whatsapp", sendAutoSchedulingEmail);

export default router;
