import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import prisma from "../db/prisma.js";

dotenv.config();

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
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  await prisma.$connect();

  const rows = [];
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

      rows.push(doc);
      createdEmails.push(emailId);
    }
  }

  const result = await prisma.user.createMany({ data: rows, skipDuplicates: true });

  console.log("Done.");
  console.log("Processed:", rows.length);
  console.log("Created:", result.count || 0);
  console.log("Skipped existing:", rows.length - (result.count || 0));

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("Seed failed:", err?.message || err);
  try {
    await prisma.$disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
