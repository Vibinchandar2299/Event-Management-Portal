import express from "express";
import User from "../Schema/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadUsersFromExcel, uploadMiddleware, getallstaffs } from "../Controller/Signups.js";
import checkDepartment from '../Middleware/checkDepartment.js';
import { auth as authenticate } from '../Middleware/Authentication.js';
import departmentAuthorize from "../Middleware/DepartmentAuth.js";
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
      designation,
      empid,
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
      designation: typeof designation === "string" ? designation.trim() : designation,
      empid: typeof empid === "string" ? empid.trim() : empid,
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, dept: user.dept },
      process.env.JWT_SECRET_TOKEN,
      { expiresIn: "1d" }
    );

    res.status(201).json({ message: "User registered successfully", token, dept: user.dept });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is blocked. Contact IQAC." });
    }

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

// IQAC/System Admin tooling
const adminOnly = [authenticate, departmentAuthorize(["iqac", "system admin"])]

router.post("/admin/create-login", ...adminOnly, async (req, res) => {
  try {
    const {
      name,
      emailId,
      password,
      phoneNumber,
      dept,
      designation,
      empid,
    } = req.body || {};

    if (!name || !emailId || !phoneNumber || !dept) {
      return res.status(400).json({ message: "Name, Email, Phone, and Department are required" });
    }

    const existingUser = await User.findOne({ emailId: String(emailId).trim() });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const rawPassword = String(password || "sece@123");
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = new User({
      name: String(name).trim(),
      emailId: String(emailId).trim(),
      password: hashedPassword,
      phoneNumber: String(phoneNumber).trim(),
      dept: String(dept).trim(),
      designation: typeof designation === "string" ? designation.trim() : "",
      empid: typeof empid === "string" ? empid.trim() : "",
    });
    await user.save();

    return res.status(201).json({
      message: "Login created successfully",
      user: {
        _id: user._id,
        name: user.name,
        emailId: user.emailId,
        phoneNumber: user.phoneNumber,
        dept: user.dept,
        designation: user.designation,
        empid: user.empid,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.patch("/admin/users/:id/status", ...adminOnly, async (req, res) => {
  try {
    const userId = String(req.params.id || "").trim();
    if (!userId) return res.status(400).json({ message: "User id is required" });

    const requestedActive = req.body?.isActive;
    if (typeof requestedActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be a boolean" });
    }

    // Avoid locking out the current admin user.
    if (req.user?.userId && String(req.user.userId) === String(userId)) {
      return res.status(400).json({ message: "You cannot change your own account status" });
    }

    const target = await User.findById(userId).select("dept emailId isActive");
    if (!target) return res.status(404).json({ message: "User not found" });

    const targetDept = String(target.dept || "").trim().toLowerCase();
    if (targetDept === "iqac" || targetDept === "system admin" || targetDept === "systemadmin" || targetDept === "admin") {
      return res.status(403).json({ message: "This account cannot be blocked/unblocked" });
    }

    target.isActive = requestedActive;
    await target.save();

    return res.status(200).json({
      message: requestedActive ? "Account unblocked" : "Account blocked",
      user: {
        _id: target._id,
        emailId: target.emailId,
        dept: target.dept,
        isActive: target.isActive,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.delete("/admin/users/:id", ...adminOnly, async (req, res) => {
  try {
    const userId = String(req.params.id || "").trim();
    if (!userId) return res.status(400).json({ message: "User id is required" });

    if (req.user?.userId && String(req.user.userId) === String(userId)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const target = await User.findById(userId).select("dept emailId");
    if (!target) return res.status(404).json({ message: "User not found" });

    const targetDept = String(target.dept || "").trim().toLowerCase();
    if (
      targetDept === "iqac" ||
      targetDept === "system admin" ||
      targetDept === "systemadmin" ||
      targetDept === "admin"
    ) {
      return res.status(403).json({ message: "This account cannot be removed" });
    }

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      message: "Account removed permanently",
      removed: { _id: userId, emailId: target.emailId, dept: target.dept },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/admin/users", ...adminOnly, getallstaffs);
router.post("/admin/upload-excel", ...adminOnly, uploadMiddleware, uploadUsersFromExcel);

router.get("/me", authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Invalid token" });

    const user = await User.findById(userId)
      .select(
        "name emailId phoneNumber dept accountOwnerName accountOwnerEmail accountOwnerPhone notificationEmails notificationWhatsappNumbers createdAt updatedAt"
      )
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      userId: String(userId),
      name: user.name || "",
      emailId: user.emailId || "",
      phoneNumber: user.phoneNumber || "",
      dept: user.dept || "",
      accountOwner: {
        name: user.accountOwnerName || "",
        email: user.accountOwnerEmail || "",
        phone: user.accountOwnerPhone || "",
      },
      notifications: {
        emails: Array.isArray(user.notificationEmails) ? user.notificationEmails : [],
        whatsapps: Array.isArray(user.notificationWhatsappNumbers) ? user.notificationWhatsappNumbers : [],
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.put("/account-settings", authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Invalid token" });

    const {
      accountOwnerName,
      accountOwnerEmail,
      accountOwnerPhone,
      notificationEmails,
      notificationWhatsappNumbers,
    } = req.body || {};

    const normalizeList = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value
          .map((v) => String(v || "").trim())
          .filter(Boolean)
          .slice(0, 50);
      }
      // Allow newline/comma separated strings from UI
      return String(value)
        .split(/\r?\n|,/g)
        .map((v) => String(v || "").trim())
        .filter(Boolean)
        .slice(0, 50);
    };

    const update = {
      accountOwnerName: typeof accountOwnerName === "string" ? accountOwnerName.trim() : "",
      accountOwnerEmail: typeof accountOwnerEmail === "string" ? accountOwnerEmail.trim() : "",
      accountOwnerPhone: typeof accountOwnerPhone === "string" ? accountOwnerPhone.trim() : "",
      notificationEmails: normalizeList(notificationEmails),
      notificationWhatsappNumbers: normalizeList(notificationWhatsappNumbers),
    };

    const user = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: false,
    }).select(
      "name emailId phoneNumber dept accountOwnerName accountOwnerEmail accountOwnerPhone notificationEmails notificationWhatsappNumbers createdAt updatedAt"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      message: "Account settings updated",
      accountOwner: {
        name: user.accountOwnerName || "",
        email: user.accountOwnerEmail || "",
        phone: user.accountOwnerPhone || "",
      },
      notifications: {
        emails: Array.isArray(user.notificationEmails) ? user.notificationEmails : [],
        whatsapps: Array.isArray(user.notificationWhatsappNumbers) ? user.notificationWhatsappNumbers : [],
      },
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/change-password", authenticate, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Invalid token" });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(String(currentPassword), String(user.password));
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/getallstaffs", ...adminOnly, getallstaffs);
router.post("/upload-excel", ...adminOnly, uploadMiddleware, uploadUsersFromExcel);

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

