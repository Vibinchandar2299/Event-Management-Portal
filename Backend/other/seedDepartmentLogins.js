import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../Schema/user.js";

dotenv.config();

const mongoURI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/event_management_portal";

const PASSWORD = "sece@123";

const departmentsToSeed = [
  // Service departments
  { dept: "communication", prefix: "communication" },
  { dept: "food", prefix: "food" },
  { dept: "transport", prefix: "transport" },
  { dept: "guestroom", prefix: "guestroom" },

  // Academic departments (canonical keys used across the portal)
  { dept: "cse", prefix: "cse" },
  { dept: "it", prefix: "it" },
  { dept: "ece", prefix: "ece" },
  { dept: "eee", prefix: "eee" },
  { dept: "mech", prefix: "mech" },
  { dept: "csbs", prefix: "csbs" },
  { dept: "cce", prefix: "cce" },
  { dept: "ai & ds", prefix: "aids" },
  { dept: "ai & ml", prefix: "aiml" },
  { dept: "cyber", prefix: "cyber" },
];

const buildPhoneNumber = (base, offset) => String(base + offset);

async function main() {
  console.log("Seeding department logins…");
  console.log("Mongo:", mongoURI);

  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });

  const ops = [];
  const createdEmails = [];

  // Base 10-digit number (string). Increment per user.
  const phoneBase = 9000000000;
  let phoneOffset = 0;

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  for (const { dept, prefix } of departmentsToSeed) {
    for (let i = 1; i <= 3; i++) {
      const username = `${prefix}faculty${i}`;
      const emailId = `${username}@sece.ac.in`;

      const phoneNumber = buildPhoneNumber(phoneBase, phoneOffset);
      phoneOffset += 1;

      const doc = {
        name: username,
        emailId,
        password: hashedPassword,
        phoneNumber,
        designation: "Faculty",
        dept,
        empid: `${prefix.toUpperCase()}-F${i}`,
      };

      ops.push({
        updateOne: {
          filter: { emailId },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      });
      createdEmails.push(emailId);
    }
  }

  const result = await User.bulkWrite(ops, { ordered: false });

  console.log("Done.");
  console.log("Processed:", ops.length);
  console.log("Created:", result.upsertedCount || 0);
  console.log("Skipped existing:", ops.length - (result.upsertedCount || 0));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err?.message || err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
