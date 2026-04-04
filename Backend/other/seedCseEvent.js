import mongoose from "mongoose";
import dotenv from "dotenv";

import BasicEvent from "../Schema/EventSchema.js";
import Endform from "../Schema/EndForm.js";

dotenv.config();

const mongoURI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/event_management_portal";

const isoDateOnly = (d) => {
  // Schema stores date as string; keep it simple and consistent.
  const date = d instanceof Date ? d : new Date(d);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const main = async () => {
  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() + 3);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const iqacNumber = `SEED-CSE-${Date.now()}`;

  const basicEvent = await BasicEvent.create({
    iqacNumber,
    departments: [],
    academicdepartment: ["CSE"],
    professional: [],
    eventName: `Seed CSE Event ${iqacNumber}`,
    eventType: "Workshop",
    eventVenue: "SEED Venue",
    startDate: isoDateOnly(start),
    endDate: isoDateOnly(end),
    startTime: "10:00",
    endTime: "12:00",
    year: "2026",
    categories: "Seed",
    logos: [],
    description: "Seeded event for testing CSE Pending/Event Management cards.",
    organizers: [
      {
        employeeId: "SEED001",
        name: "Seed Organizer",
        designation: "Faculty",
        phone: "9999999999",
      },
    ],
    resourcePersons: [
      {
        name: "Seed Speaker",
        affiliation: "Seed Org",
      },
    ],
    status: "Pending",
  });

  const endform = await Endform.create({
    iqacno: iqacNumber,
    eventdata: String(basicEvent._id),
    transportform: [],
    status: "Pending",
  });

  // eslint-disable-next-line no-console
  console.log("Seeded CSE BasicEvent:", String(basicEvent._id));
  // eslint-disable-next-line no-console
  console.log("Seeded Endform:", String(endform._id));
  // eslint-disable-next-line no-console
  console.log("Now login as CSE and open /pending to see the card.");

  await mongoose.disconnect();
};

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to seed CSE event:", err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
