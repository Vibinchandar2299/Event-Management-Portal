import express from "express";
import { auth } from "../Middleware/Authentication.js";
import departmentAuthorize from "../Middleware/DepartmentAuth.js";
import { createEndform, getAllEndforms, getOverallPendingEndforms, getEventById, updateEndform, deleteEndform } from "../Controller/EndformController.js";
import checkDepartment from '../Middleware/checkDepartment.js';
import prisma from "../db/prisma.js";
import { ensureApprovalsShape } from "../db/mongoLike.js";

const router = express.Router();

function normalizeDepartmentKey(value) {
  if (!value) return "";

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  if (normalized === "media" || normalized === "communication") return "communication";
  if (normalized === "food") return "food";
  if (normalized === "transport") return "transport";
  if (
    normalized === "guestroom" ||
    normalized === "guest room" ||
    normalized === "guest department" ||
    normalized === "guest deparment" ||
    normalized.includes("guest")
  ) {
    return "guestroom";
  }
  if (normalized === "iqac") return "iqac";
  if (normalized === "systemadmin" || normalized === "system admin") return "system admin";

  return normalized;
}

async function applyApproval({ endformId, departmentKey, approvedBy }) {
  const endform = await prisma.endform.findUnique({ where: { id: String(endformId) } });
  if (!endform) return { status: 404, body: { message: "Event not found" } };

  const approvals = ensureApprovalsShape(endform.approvals);
  const now = new Date().toISOString();

  if (!approvals[departmentKey]) {
    return { status: 400, body: { message: "Invalid department" } };
  }

  approvals[departmentKey] = {
    approved: true,
    approvedBy: approvedBy || null,
    approvedAt: now,
  };

  // IQAC can only approve after all service departments are approved
  let nextStatus = endform.status;
  if (departmentKey === "iqac") {
    const { communication, food, transport, guestroom } = approvals;
    if (!communication.approved || !food.approved || !transport.approved || !guestroom.approved) {
      return {
        status: 400,
        body: {
          message: "Cannot approve: All other departments must approve first",
          pendingApprovals: {
            communication: !communication.approved,
            food: !food.approved,
            transport: !transport.approved,
            guestroom: !guestroom.approved,
          },
        },
      };
    }
    nextStatus = "Approved";
  }

  const updated = await prisma.endform.update({
    where: { id: String(endformId) },
    data: {
      approvals,
      ...(nextStatus !== endform.status ? { status: nextStatus } : {}),
    },
  });

  return {
    status: 200,
    body: {
      message:
        departmentKey === "iqac"
          ? "IQAC approval successful"
          : `${departmentKey} department approval successful`,
      approval: approvals[departmentKey],
      status: updated.status,
    },
  };
}

router.post("/create", createEndform);
router.get("/getallforms", getAllEndforms);
router.get("/event-requests", auth, getOverallPendingEndforms);
router.get("/event/:id", getEventById);
router.put("/:id", updateEndform);
router.delete("/:id", auth, deleteEndform);

// Approval endpoints for each department
router.post("/approve/communication/:id", auth, checkDepartment('Media'), async (req, res) => {
  try {
    const result = await applyApproval({
      endformId: req.params.id,
      departmentKey: "communication",
      approvedBy: req.user?.name || req.user?.emailId,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/approve/food/:id", auth, checkDepartment('Food'), async (req, res) => {
  try {
    const result = await applyApproval({
      endformId: req.params.id,
      departmentKey: "food",
      approvedBy: req.user?.name || req.user?.emailId,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/approve/transport/:id", auth, checkDepartment('Transport'), async (req, res) => {
  try {
    const result = await applyApproval({
      endformId: req.params.id,
      departmentKey: "transport",
      approvedBy: req.user?.name || req.user?.emailId,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/approve/guestroom/:id", auth, checkDepartment('guestroom'), async (req, res) => {
  try {
    const result = await applyApproval({
      endformId: req.params.id,
      departmentKey: "guestroom",
      approvedBy: req.user?.name || req.user?.emailId,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/approve/iqac/:id", auth, checkDepartment('IQAC'), async (req, res) => {
  try {
    const result = await applyApproval({
      endformId: req.params.id,
      departmentKey: "iqac",
      approvedBy: req.user?.name || req.user?.emailId,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Generic approval endpoint used by the frontend: /api/endform/approve/:department/:id
router.post("/approve/:department/:id", auth, async (req, res) => {
  try {
    const departmentKey = normalizeDepartmentKey(req.params.department);
    const userKey = normalizeDepartmentKey(req.user?.dept);

    const allowedKeys = ["communication", "food", "transport", "guestroom", "iqac"];
    if (!allowedKeys.includes(departmentKey)) {
      return res.status(400).json({ message: "Invalid department" });
    }

    if (!userKey || userKey !== departmentKey) {
      return res.status(403).json({ message: "Not authorized for this action" });
    }

    const result = await applyApproval({
      endformId: req.params.id,
      departmentKey,
      approvedBy: req.user?.name || req.user?.emailId,
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get approval status for an event
router.get("/approvals/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const endform = await prisma.endform.findUnique({ where: { id: String(id) } });
    
    if (!endform) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    res.json({ 
      approvals: ensureApprovalsShape(endform.approvals),
      status: endform.status
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/edit/:id", auth, departmentAuthorize(["System Admin", "IQAC"]), async (req, res) => {
  try {
    const updatedEvent = await updateEndform(req, res);
    // If your updateEvent controller handles the response, you may not need to send another response here.
  } catch (err) {
    res.status(500).json({ message: "Failed to update event", error: err.message });
  }
});

// Client uses /api/endform/:id (endform id). Keep UUID-friendly.
// IMPORTANT: keep this at the end so it doesn't shadow other routes.
router.get("/:id", getEventById);

export default router;
