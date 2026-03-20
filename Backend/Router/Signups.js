import express from "express";
import User from "../Schema/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadUsersFromExcel, uploadMiddleware, getallstaffs } from "../Controller/Signups.js";
import checkDepartment from '../Middleware/checkDepartment.js';
import { auth as authenticate } from '../Middleware/Authentication.js';
import MediaRequirements from "../Schema/MedaiRequirements.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const {
      name,
      emailId,
      password,
      phoneNumber,
      dept,
    } = req.body;

    // Add this validation
    if (!name || !emailId || !password || !phoneNumber || !dept) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ emailId });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      emailId,
      password: hashedPassword,
      phoneNumber,
      dept,
    });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user._id, dept: user.dept }, // include dept in token
      process.env.JWT_SECRET_TOKEN,
      { expiresIn: "1d" }
    );
    res.json({ token, dept: user.dept }); // also send dept in response
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/getallstaffs", getallstaffs);
router.post("/upload-excel", uploadMiddleware, uploadUsersFromExcel);

// Approval endpoint for Communication form
router.post('/approve/:id', authenticate, checkDepartment('communication'), async (req, res) => {
  const { id } = req.params;
  const department = req.user?.dept || req.department || 'Unknown';
  const user = req.user?.name || req.user?.username || 'Unknown';
  const media = await MediaRequirements.findById(id);
  if (!media) return res.status(404).json({ message: 'Communication form not found' });
  media.approvals.push({ department, user, date: new Date() });
  await media.save();
  res.json({ message: 'Communication form approved successfully', approvals: media.approvals });
});

// Endpoint to get approval details for a communication form
router.get('/approvals/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const media = await MediaRequirements.findById(id, 'approvals');
  if (!media) return res.status(404).json({ message: 'Communication form not found' });
  res.json({ approvals: media.approvals });
});

export default router;

