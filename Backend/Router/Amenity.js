import express from "express";
import { auth } from "../Middleware/Authentication.js";
import departmentAuthorize from "../Middleware/DepartmentAuth.js";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../Controller/foodform/main.js";

const router = express.Router();

router.post("/events", createEvent);
router.get("/events", getAllEvents);
router.get("/events/:id", getEventById);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);

// Only Food, System Admin, and IQAC can edit food forms
router.put(
  "/food/:id",
  auth,
  departmentAuthorize(["Food", "System Admin", "IQAC"]),
  updateEvent
);

export default router;
