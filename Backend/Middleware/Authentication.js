import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const secretKey = process.env.JWT_SECRET_TOKEN || "yourDefaultSecretKey";

const auth = async (req, res, next) => {
  const rawAuth = req.headers["authorization"] || req.headers["Authorization"];
  let token = null;

  if (typeof rawAuth === "string" && rawAuth.trim()) {
    const trimmed = rawAuth.trim();
    // Accept both: "Bearer <token>" and "<token>"
    token = trimmed.toLowerCase().startsWith("bearer ") ? trimmed.slice(7).trim() : trimmed;
  }

  // Fallback header some clients use
  if (!token && typeof req.headers["x-access-token"] === "string") {
    token = req.headers["x-access-token"].trim();
  }

  if (!token) return res.status(401).json({ message: "No token provided." });

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const authorize = (req, res, next) => {
  // Placeholder for role/permission checks
  next();
};

export { auth, authorize };
