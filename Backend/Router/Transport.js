import express from "express";
import { auth } from "../Middleware/Authentication.js";
import departmentAuthorize from "../Middleware/DepartmentAuth.js";
import {
  createTransportRequest,
  getAllTransportRequests,
  getTransportRequestById,
  updateTransportRequest,
  deleteTransportRequest
} from "../Controller/transportform/main.js";
import checkDepartment from '../Middleware/checkDepartment.js';
import GuestRoom from "../Schema/guestroom/main.js";

const router = express.Router();

router.post("/transports", createTransportRequest);
router.get("/transports", getAllTransportRequests);
router.get("/transports/:id", getTransportRequestById);
router.put("/transports/:id", updateTransportRequest);
router.delete("/transports/:id", deleteTransportRequest);

// Only Transport, System Admin, and IQAC can edit transport forms
router.put(
  "/transport/:id",
  auth,
  departmentAuthorize(["Transport", "System Admin", "IQAC"]),
  updateTransportRequest
);

export default router;
