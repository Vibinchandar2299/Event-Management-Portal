import express from "express";
import { auth } from "../Middleware/Authentication.js";
import departmentAuthorize from "../Middleware/DepartmentAuth.js";
import { createBooking, getAllBookings, getBookingById, updateBooking, deleteBooking } from "../Controller/guestroom/main.js";
import checkDepartment from '../Middleware/checkDepartment.js';
// import authenticate from '../Middleware/Authentication.js'; // Removed, not used
import GuestRoom from "../Schema/guestroom/main.js";

const router = express.Router();

router.post("/bookings", createBooking);
router.get("/bookings", getAllBookings);
router.get("/bookings/:id", getBookingById);
router.put("/bookings/:id", auth, departmentAuthorize(["System Admin", "IQAC", "Guest Deparment"]), updateBooking);
router.delete("/bookings/:id", deleteBooking);

// Only System Admin, IQAC, and Guest Deparment can edit guest room bookings
router.put(
  "/edit/:id",
  auth,
  departmentAuthorize(["System Admin", "IQAC", "Guest Deparment"]),
  async (req, res) => {
    try {
      await updateBooking(req, res);
    } catch (err) {
      res.status(500).json({ message: "Failed to update booking", error: err.message });
    }
  }
);

export default router;
