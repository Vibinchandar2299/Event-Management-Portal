import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../Controller/foodform/main.js";
import checkDepartment from "../Middleware/checkDepartment.js";
import { auth, authorize } from "../Middleware/Authentication.js";
import FoodForm from "../Schema/foodform/main.js";

const router = express.Router();

// Create a new food form
router.post("/", createEvent);

// Get all food forms
router.get("/", getAllEvents);

// Get a specific food form by ID
router.get("/:id", getEventById);

// Update a food form
router.put("/:id", updateEvent);

// Delete a food form
router.delete("/:id", deleteEvent);

export default router; 