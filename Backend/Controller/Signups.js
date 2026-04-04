import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import xlsx from "xlsx";
import multer from "multer";
import User from "../Schema/user.js";
import dotenv from "dotenv";
dotenv.config();
const secretKey = process.env.JWT_SECRET_TOKEN || "yourDefaultSecretKey";
console.log("Initializing ordered  Bulk operation Erorr");
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const Signup = async (req, res) => {
  console.log("Creating The new user data : ", req.body);
  const { name, emailId, password, phoneNumber, designation, dept, empid } =
    req.body;

  try {
    const findAlreadyUserExist = await User.findOne({ emailId });
    if (findAlreadyUserExist) {
      return res.status(401).json({
        message: "User ID already exists",
        userId: findAlreadyUserExist._id,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      emailId,
      password: hashedPassword,
      phoneNumber,
      empid,
      designation,
      dept,
    });

    await newUser.save();

    const token = jwt.sign(
      {
        userId: newUser._id,
        emailId: newUser.emailId,
        designation: newUser.designation,
        name: newUser.name,
        empid: newUser.empid,
        phonenumber: newUser.phoneNumber,
        dept: newUser.dept,
      },
      secretKey,
      { expiresIn: "7d" }
    );

    res.status(201).json({ message: "User registered successfully", token });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error in signing up", error: err.message });
  }
};

export const Login = async (req, res) => {
  const { emailId, password } = req.body;
  console.log("Login request:", { emailId });

  try {
    const user = await User.findOne({ emailId: emailId });
    console.log("user found data : ", user);
    if (!user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Log the user's department for debugging
    console.log("User department:", user.dept);

    const token = jwt.sign(
      {
        userId: user._id,
        emailId: user.emailId,
        name: user.name,
        designation: user.designation,
        empid: user.empid,
        phonenumber: user.phoneNumber,
        dept: user.dept
      },
      secretKey,
      { expiresIn: "7d" }
    );

    res.status(200).json({ 
      message: "Login successful", 
      token,
      dept: user.dept
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error in logging in", error: err.message });
  }
};

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
    for (const row of data) {
      const emailId = normalize(row.emailId || row.email || row.Email || row["Email Id"]);
      if (!emailId) continue;

      const name = normalize(row.name || row.Name);
      const dept = normalize(row.dept || row.department || row.Department);
      const phoneNumber = normalizePhone(row.phoneNumber || row.phone || row.Phone || row["Phone Number"]);
      const designation = normalize(row.designation || row.Designation);
      const empid = normalize(row.empid || row.empId || row.EmpId || row["Emp Id"]);

      if (!dept || !phoneNumber) continue;

      ops.push({
        updateOne: {
          filter: { emailId },
          update: {
            $setOnInsert: {
              name: name || emailId,
              emailId,
              dept,
              phoneNumber,
              designation,
              empid,
              password: bcrypt.hashSync("sece@123", 10),
            },
          },
          upsert: true,
        },
      });
    }

    if (ops.length === 0) {
      return res.status(400).json({ message: "No valid rows found in the uploaded sheet" });
    }

    const result = await User.bulkWrite(ops, { ordered: false });

    return res.status(201).json({
      message: "Users uploaded successfully",
      processedRows: ops.length,
      created: result.upsertedCount || 0,
      skippedExisting: ops.length - (result.upsertedCount || 0),
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

    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { emailId: { $regex: q, $options: "i" } },
        { dept: { $regex: q, $options: "i" } },
        { designation: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("name emailId phoneNumber dept designation empid isActive createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ message: "Data fetched successfully", users });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error in logging in", error: err.message });
  }
};

export const uploadMiddleware = upload.single("file");
