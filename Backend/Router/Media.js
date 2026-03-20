import express from "express";
import { auth } from "../Middleware/Authentication.js";
import departmentAuthorize from "../Middleware/DepartmentAuth.js";
import {
  createRequirement,
  getRequirements,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
} from "../Controller/MediaForm.js";
import Endform from "../Schema/EndForm.js";

const router = express.Router();

router.post("/", createRequirement);
router.get("/media", getRequirements);
router.get("/:id", getRequirementById);
router.put("/:id", updateRequirement);
router.delete("/:id", deleteRequirement);

router.put(
  "/communication/:id",
  auth,
  departmentAuthorize(["Media", "System Admin", "IQAC"]),
  updateRequirement
);

export default router;

