import express from "express";
import dotenv from "dotenv";
import router from "./Router/Signups.js";
import Event from "./Router/eventHandeler.js";
import messages from "./Router/Whatsapp.js";
import guestroom from "./Router/GuestRoom.js";
import foodform from "./Router/Food.js";
import transportform from "./Router/Transport.js";
import endform from "./Router/endform.js";
import path from "path";
import { fileURLToPath } from 'url';
import signupRouter from "./Router/Signups.js";
import common from "./Router/Common.js";
import cors from "cors";
import mediaRouter from "./Router/Media.js";
import prisma from "./db/prisma.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use("/api/auth", signupRouter);
app.use("/api/sece", signupRouter);

// ES module workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/sece", router);
app.use("/api/event", Event);
app.use("/api/messages", messages);
app.use("/api/guestroom", guestroom);
app.use("/api/food", foodform);
app.use("/api/transportform", transportform);
app.use("/api/endform", endform);
app.use("/api/common", common);
app.use("/api/media", mediaRouter);

// Add a simple root route for testing
app.get("/", (req, res) => {
  res.json({ message: "Event Management Backend Server is running", timestamp: new Date().toISOString() });
});

const PORT = 8000;

const startServer = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL is not set. Postgres connection will fail.");
    }

    await prisma.$connect();
    console.log("Connected to Postgres via Prisma");

    await import("./other/Node-Corn.js");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(
      "Failed to connect to Postgres (Prisma). Ensure DATABASE_URL is configured.",
      err?.message || err
    );
    process.exit(1);
  }
};

startServer();
