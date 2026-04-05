import bcrypt from "bcrypt";
import xlsx from "xlsx";
import multer from "multer";
import dotenv from "dotenv";
import prisma from "../db/prisma.js";
import { withMongoId } from "../db/mongoLike.js";
dotenv.config();
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadUsersFromExcel = async (req, res) => {
  console.log("Reached the Excel Endpoint");

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an Excel file" });
    }

    const originalName = String(req.file.originalname || "").toLowerCase();
    const isCsv = originalName.endsWith(".csv") || String(req.file.mimetype || "").includes("csv");

    const workbook = isCsv
      ? xlsx.read(req.file.buffer.toString("utf8"), { type: "string" })
      : xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    const normalize = (value) => String(value ?? "").trim();
    const normalizePhone = (value) => {
      if (value === null || value === undefined) return "";
      const raw = String(value).trim();
      return raw;
    };

    const ops = [];
    const seen = new Set();
    for (const row of data) {
      const emailId = normalize(row.emailId || row.email || row.Email || row["Email Id"]);
      if (!emailId) continue;
      if (seen.has(emailId.toLowerCase())) continue;
      seen.add(emailId.toLowerCase());

      const name = normalize(row.name || row.Name);
      const dept = normalize(row.dept || row.department || row.Department);
      const phoneNumber = normalizePhone(row.phoneNumber || row.phone || row.Phone || row["Phone Number"]);
      const designation = normalize(row.designation || row.Designation);
      const empid = normalize(row.empid || row.empId || row.EmpId || row["Emp Id"]);

      if (!dept || !phoneNumber) continue;

      ops.push({
        name: name || emailId,
        emailId,
        dept,
        phoneNumber,
        designation: designation || "",
        empid: empid || "",
        password: bcrypt.hashSync("sece@123", 10),
        isActive: true,
      });
    }

    if (ops.length === 0) {
      return res.status(400).json({ message: "No valid rows found in the uploaded sheet" });
    }

    const result = await prisma.user.createMany({
      data: ops,
      skipDuplicates: true,
    });

    return res.status(201).json({
      message: "Users uploaded successfully",
      processedRows: ops.length,
      created: result.count || 0,
      skippedExisting: ops.length - (result.count || 0),
    });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Error processing Excel file", error: error.message });
  }
};

export const getallstaffs = async (req, res) => {
  try {
    const q = String(req.query?.q || "").trim();

    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { emailId: { contains: q, mode: "insensitive" } },
              { dept: { contains: q, mode: "insensitive" } },
              { designation: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
      select: {
        id: true,
        name: true,
        emailId: true,
        phoneNumber: true,
        dept: true,
        designation: true,
        empid: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ message: "Data fetched successfully", users: users.map(withMongoId) });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error in logging in", error: err.message });
  }
};

export const uploadMiddleware = upload.single("file");
