import express from "express";
import { auth } from "../Middleware/Authentication.js";
import {
  getDashboardData,
  getEventStats,
  generateSingleEventPdf,
  getPendingPageData,
  getProfilePageData,
  getUnifiedDashboardData,
} from "../Controller/Common.js";

const router = express.Router();

router.get("/dashboard-data", auth, getUnifiedDashboardData);
router.get("/event-stats", getEventStats);
router.get("/download-event-pdf", generateSingleEventPdf);
router.get("/event-requests-page-data", auth, getPendingPageData);
router.get("/profile-page-data", auth, getProfilePageData);
router.get("/test-pdf", (req, res) => {
  res.json({ message: "PDF endpoint is accessible" });
});

router.get("/test", (req, res) => {
  res.json({ message: "Common router is working", timestamp: new Date().toISOString() });
});

export default router;
