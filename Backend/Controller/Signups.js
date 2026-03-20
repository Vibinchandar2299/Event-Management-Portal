import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import xlsx from "xlsx";
import multer from "multer";
import User from "../Schema/user.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
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
  const dbUri =
    "mongodb+srv://botonicalgarden:TN30e4230!@cluster0.ostdu.mongodb.net/";
  console.log("Reached the Excel Endpoint");

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an Excel file" });
    }

    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log("data : ", data);

    const usersToInsert = data.map((row) => ({
      name: row.name,
      emailId: row.emailId,
      dept: row.dept,
      phoneNumber: row.phoneNumber.toString(),
      designation: row.designation,
      password: bcrypt.hashSync("sece@123", 10),
      empid: row.empid,
    }));

    console.log("user data to be inserting : ", usersToInsert);
    const collection = mongoose.connection.db.collection("users");

    const bulk = collection.initializeUnorderedBulkOp();

    usersToInsert.forEach((user) => {
      bulk.insert(user);
    });
    await bulk.execute();

    res
      .status(201)
      .json({ message: "Users uploaded successfully", users: usersToInsert });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: "Error processing Excel file", error: error.message });
  } finally {
    await mongoose.connection.close();
  }
};

export const getallstaffs = async (req, res) => {
  try {
    const user = await User.findOne();

    res.status(200).json({ message: "Data fetched Sucessfully", user });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error in logging in", error: err.message });
  }
};

export const uploadMiddleware = upload.single("file");
