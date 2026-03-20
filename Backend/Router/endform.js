import express from "express";
import { auth } from "../Middleware/Authentication.js";
import departmentAuthorize from "../Middleware/DepartmentAuth.js";
import { createEndform, getAllEndforms, getOverallPendingEndforms, getEventById, updateEndform, deleteEndform } from "../Controller/EndformController.js";
import Endform from "../Schema/EndForm.js";
import checkDepartment from '../Middleware/checkDepartment.js';

const router = express.Router();

router.post("/create", createEndform);
router.get("/getallforms", getAllEndforms);
router.get("/allpending", getOverallPendingEndforms);
router.get("/event/:id", getEventById);
router.put("/:id", updateEndform);
router.delete("/:id", deleteEndform);

// Approval endpoints for each department
router.post("/approve/communication/:id", auth, checkDepartment('Media'), async (req, res) => {
  try {
    const { id } = req.params;
    const endform = await Endform.findById(id);
    
    if (!endform) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    endform.approvals.communication.approved = true;
    endform.approvals.communication.approvedBy = req.user.name || req.user.emailId;
    endform.approvals.communication.approvedAt = new Date();
    
    await endform.save();
    
    res.json({ 
      message: "Communication department approval successful",
      approval: endform.approvals.communication
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/approve/food/:id", auth, checkDepartment('Food'), async (req, res) => {
  try {
    const { id } = req.params;
    const endform = await Endform.findById(id);
    
    if (!endform) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    endform.approvals.food.approved = true;
    endform.approvals.food.approvedBy = req.user.name || req.user.emailId;
    endform.approvals.food.approvedAt = new Date();
    
    await endform.save();
    
    res.json({ 
      message: "Food department approval successful",
      approval: endform.approvals.food
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/approve/transport/:id", auth, checkDepartment('Transport'), async (req, res) => {
  try {
    const { id } = req.params;
    const endform = await Endform.findById(id);
    
    if (!endform) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    endform.approvals.transport.approved = true;
    endform.approvals.transport.approvedBy = req.user.name || req.user.emailId;
    endform.approvals.transport.approvedAt = new Date();
    
    await endform.save();
    
    res.json({ 
      message: "Transport department approval successful",
      approval: endform.approvals.transport
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/approve/guestroom/:id", auth, checkDepartment('Guest Deparment'), async (req, res) => {
  try {
    const { id } = req.params;
    const endform = await Endform.findById(id);
    
    if (!endform) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    endform.approvals.guestroom.approved = true;
    endform.approvals.guestroom.approvedBy = req.user.name || req.user.emailId;
    endform.approvals.guestroom.approvedAt = new Date();
    
    await endform.save();
    
    res.json({ 
      message: "Guest Department approval successful",
      approval: endform.approvals.guestroom
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/approve/iqac/:id", auth, checkDepartment('IQAC'), async (req, res) => {
  try {
    const { id } = req.params;
    const endform = await Endform.findById(id);
    
    if (!endform) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    // Check if all other departments have approved
    const { communication, food, transport, guestroom } = endform.approvals;
    if (!communication.approved || !food.approved || !transport.approved || !guestroom.approved) {
      return res.status(400).json({ 
        message: "Cannot approve: All other departments must approve first",
        pendingApprovals: {
          communication: !communication.approved,
          food: !food.approved,
          transport: !transport.approved,
          guestroom: !guestroom.approved
        }
      });
    }
    
    endform.approvals.iqac.approved = true;
    endform.approvals.iqac.approvedBy = req.user.name || req.user.emailId;
    endform.approvals.iqac.approvedAt = new Date();
    
    // Update overall status to approved
    endform.status = "Approved";
    
    await endform.save();
    
    res.json({ 
      message: "IQAC approval successful",
      approval: endform.approvals.iqac,
      status: endform.status
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get approval status for an event
router.get("/approvals/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const endform = await Endform.findById(id);
    
    if (!endform) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    res.json({ 
      approvals: endform.approvals,
      status: endform.status
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/edit/:id", auth, departmentAuthorize(), async (req, res) => {
  try {
    const updatedEvent = await updateEndform(req, res);
    // If your updateEvent controller handles the response, you may not need to send another response here.
  } catch (err) {
    res.status(500).json({ message: "Failed to update event", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const endform = await Endform.findById(req.params.id)
      .populate("foodform")
      .populate("guestform")
      .populate("transportform")
      .populate("communicationform");
    res.json(endform);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit endpoint (example: PATCH)
router.patch("/:id", async (req, res) => {
  try {
    const updated = await Endform.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
