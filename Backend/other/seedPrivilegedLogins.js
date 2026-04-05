import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import prisma from "../db/prisma.js";

dotenv.config();

const PASSWORD = "sece@123";

const usersToSeed = [
  {
    name: "System Admin",
    emailId: "admin@sece.ac.in",
    dept: "system admin",
    phoneNumber: "9000000200",
    designation: "Admin",
    empid: "ADMIN-1",
  },
  {
    name: "IQAC",
    emailId: "iqac@sece.ac.in",
    dept: "iqac",
    phoneNumber: "9000000201",
    designation: "IQAC",
    empid: "IQAC-1",
  },
];

async function main() {
  console.log("Seeding privileged logins…");
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  await prisma.$connect();

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);
  const rows = usersToSeed.map((u) => ({
    ...u,
    password: hashedPassword,
    isActive: true,
  }));

  const result = await prisma.user.createMany({
    data: rows,
    skipDuplicates: true,
  });

  const existing = await prisma.user.findMany({
    where: { emailId: { in: usersToSeed.map((u) => u.emailId) } },
    select: { emailId: true, dept: true, isActive: true, createdAt: true },
    orderBy: { emailId: "asc" },
  });

  console.log("Done.");
  console.log("Created:", result.count || 0);
  console.log("Accounts:");
  for (const u of existing) {
    console.log(`- ${u.emailId}\t${u.dept}\tactive=${u.isActive}`);
  }

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
