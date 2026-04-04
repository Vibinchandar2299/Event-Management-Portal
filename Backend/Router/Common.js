import express from "express";
import { auth } from "../Middleware/Authentication.js";
import {
  getCurrentDateEvents,
  getDashboardData,
  getEventStats,
  generateSingleEventPdf,
  getComprehensiveDashboardData,
  getPendingPageData,
  getProfilePageData,
  getDepartmentDashboardData,
} from "../Controller/Common.js";

const router = express.Router();

router.get("/current-date-events", auth, getCurrentDateEvents);
router.get("/dashboard-data", getDashboardData);
router.get("/event-stats", getEventStats);
router.get("/download-event-pdf", generateSingleEventPdf);
router.get("/comprehensive-dashboard-data", auth, getComprehensiveDashboardData);
router.get("/pending-page-data", auth, getPendingPageData);
router.get("/profile-page-data", auth, getProfilePageData);
router.get("/department-dashboard-data", auth, getDepartmentDashboardData);
router.get("/test-pdf", (req, res) => {
  res.json({ message: "PDF endpoint is accessible" });
});

router.get("/test", (req, res) => {
  res.json({ message: "Common router is working", timestamp: new Date().toISOString() });
});

export default router;
