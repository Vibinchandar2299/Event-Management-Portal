import express from "express";
import { auth, authorize } from "../Middleware/Authentication.js";
import { createEvent, getAllEvents, getEventById, updateEvent, uploadPoster, approveEvent, upload } from "../Controller/EventController.js";

const router = express.Router();
router.post("/create", createEvent);
router.post("/upload-poster", upload.single("poster"), uploadPoster);
router.post("/approve-event", approveEvent);
router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.put("/:id", updateEvent);

export default router;
