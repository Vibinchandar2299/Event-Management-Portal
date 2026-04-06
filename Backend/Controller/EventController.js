import multer from "multer";
import path from "path";
import prisma from "../db/prisma.js";
import { withMongoId, withMongoIdsDeep } from "../db/mongoLike.js";

const normalizeDeptKey = (dept) => {
  if (!dept) return "";
  const d = String(dept).toLowerCase().trim();

  if (d === "iqac") return "iqac";
  if (d === "system admin" || d === "systemadmin" || d === "admin") return "iqac";

  if (d === "transport") return "transport";
  if (d === "food") return "food";
  if (d === "media" || d === "communication") return "communication";
  if (d === "guestroom" || d === "guest room" || d === "guest department" || d === "guest deparment") {
    return "guestroom";
  }

  const alnum = d.replace(/[^a-z0-9]/g, "");
  if (alnum === "aids" || alnum === "aiandds") return "ai & ds";
  if (alnum === "aiml" || alnum === "aiandml") return "ai & ml";
  if (alnum === "cybersecurity" || alnum === "cyber") return "cyber";
  if (alnum === "csbs") return "csbs";
  if (alnum === "cse" || alnum === "computerscienceengineering") return "cse";
  if (alnum === "it" || alnum === "informationtechnology") return "it";
  if (alnum === "ece" || alnum === "electronicsandcommunicationengineering") return "ece";
  if (alnum === "eee" || alnum === "electricalandelectronicsengineering") return "eee";
  if (alnum === "mech" || alnum === "mechanicalengineering") return "mech";
  if (alnum === "cce") return "cce";

  return d;
};

const isAcademicDeptKey = (deptKey) => {
  if (!deptKey) return false;
  const known = new Set(["iqac", "transport", "food", "guestroom", "communication"]);
  return !known.has(deptKey);
};

const createEvent = async (req, res) => {
  console.log("Event Request form data:", req.body);
  try {
    const {
      iqacNumber,
      departments,
      academicdepartment,
      professional,
      eventName,
      eventType,
      eventVenue,
      startDate,
      endDate,
      startTime,
      endTime,
      year,
      categories,
      logos,
      description,
      organizers,
      resourcePersons,
      communicationform,
      foodform,
      guestroom,
      transport
    } = req.body;

    const creatorDeptRaw = req.user?.dept;
    const creatorDeptKey = normalizeDeptKey(creatorDeptRaw);
    const shouldAttachAcademicDept = isAcademicDeptKey(creatorDeptKey);

    const safeDepartments = Array.isArray(departments) ? departments : [];
    const safeAcademic = Array.isArray(academicdepartment) ? academicdepartment : [];

    const normalizeList = (list) => {
      const seen = new Set();
      const out = [];
      for (const item of list) {
        const s = String(item ?? "").trim();
        if (!s) continue;
        const key = normalizeDeptKey(s);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(s);
      }
      return out;
    };

    // Use `departments` as the primary department field (matches the Basic form dropdown).
    // If an academic creator forgets to pick their dept, auto-attach it to `departments`.
    const normalizedDepartments = normalizeList(safeDepartments);
    const patchedDepartments = shouldAttachAcademicDept
      ? (() => {
          const alreadyHas = normalizedDepartments.some((v) => normalizeDeptKey(v) === creatorDeptKey);
          const creatorLabel = String(creatorDeptRaw || creatorDeptKey || "").trim();
          return alreadyHas || !creatorLabel
            ? normalizedDepartments
            : normalizeList([...normalizedDepartments, creatorLabel]);
        })()
      : normalizedDepartments;

    // Avoid duplicating the same dept in both arrays.
    const deptKeySet = new Set(patchedDepartments.map((v) => normalizeDeptKey(v)));
    const patchedAcademic = normalizeList(safeAcademic).filter((v) => !deptKeySet.has(normalizeDeptKey(v)));

    const created = await prisma.basicEvent.create({
      data: {
        iqacNumber: String(iqacNumber),
        departments: patchedDepartments.map((v) => String(v)),
        academicdepartment: patchedAcademic.map((v) => String(v)),
        professional: Array.isArray(professional) ? professional.map((v) => String(v)) : [],
        eventName: String(eventName),
        eventType: String(eventType),
        eventVenue: String(eventVenue),
        startDate: String(startDate),
        endDate: String(endDate),
        startTime: String(startTime),
        endTime: String(endTime),
        year: typeof year === "string" ? year : null,
        categories: typeof categories === "string" ? categories : null,
        logos: Array.isArray(logos) ? logos.map((v) => String(v)) : [],
        description: typeof description === "string" ? description : null,
        organizers: Array.isArray(organizers) ? organizers : organizers || null,
        resourcePersons: Array.isArray(resourcePersons) ? resourcePersons : resourcePersons || null,
        status: typeof req.body?.status === "string" ? req.body.status : null,
        poster: typeof req.body?.poster === "string" ? req.body.poster : null,

        communicationformId: communicationform ? String(communicationform) : null,
        foodformId: foodform ? String(foodform) : null,
        guestroomId: guestroom ? String(guestroom) : null,
        transportIds: Array.isArray(transport) ? transport.map((v) => String(v)) : [],
      },
    });

    res.status(200).json({
      message: "Event created successfully",
      event: withMongoIdsDeep(withMongoId(created)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message, stack: error.stack });
  }
};

// ✅ Get All Events
const getAllEvents = async (req, res) => {
  try {
    const events = await prisma.basicEvent.findMany({ orderBy: { createdAt: "desc" } });
    res.status(200).json(events.map((e) => withMongoIdsDeep(withMongoId(e))));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get Event by ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.basicEvent.findUnique({ where: { id: String(id) } });
    if (!event) return res.status(404).json({ message: "Event not found" });

    const [communicationform, foodform, guestroom, transport] = await Promise.all([
      event.communicationformId
        ? prisma.mediaRequirement.findUnique({ where: { id: event.communicationformId } }).catch(() => null)
        : Promise.resolve(null),
      event.foodformId
        ? prisma.foodForm.findUnique({ where: { id: event.foodformId } }).catch(() => null)
        : Promise.resolve(null),
      event.guestroomId
        ? prisma.guestBooking.findUnique({ where: { id: event.guestroomId } }).catch(() => null)
        : Promise.resolve(null),
      Array.isArray(event.transportIds) && event.transportIds.length
        ? prisma.transportRequest.findMany({ where: { id: { in: event.transportIds } } }).catch(() => [])
        : Promise.resolve([]),
    ]);

    const populated = {
      ...event,
      communicationform: communicationform ? withMongoId(communicationform) : null,
      foodform: foodform ? withMongoId(foodform) : null,
      guestroom: guestroom ? withMongoId(guestroom) : null,
      transport: Array.isArray(transport) ? transport.map(withMongoId) : [],
    };

    res.status(200).json(withMongoIdsDeep(withMongoId(populated)));
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };
    updateData.status = "Approved";

    const normalizeList = (list) => {
      const seen = new Set();
      const out = [];
      for (const item of list) {
        const s = String(item ?? "").trim();
        if (!s) continue;
        const key = normalizeDeptKey(s);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(s);
      }
      return out;
    };

    // If both departments arrays are provided in an update, prevent duplication.
    const nextDepartments =
      "departments" in updateData && Array.isArray(updateData.departments)
        ? normalizeList(updateData.departments)
        : null;
    const nextAcademic =
      "academicdepartment" in updateData && Array.isArray(updateData.academicdepartment)
        ? normalizeList(updateData.academicdepartment)
        : null;

    const sanitizedAcademic =
      nextDepartments && nextAcademic
        ? (() => {
            const deptKeySet = new Set(nextDepartments.map((v) => normalizeDeptKey(v)));
            return nextAcademic.filter((v) => !deptKeySet.has(normalizeDeptKey(v)));
          })()
        : nextAcademic;

    // Accept and set sub-form ObjectId references if provided
    if (req.body.communicationform) updateData.communicationform = req.body.communicationform;
    if (req.body.foodform) updateData.foodform = req.body.foodform;
    if (req.body.guestroom) updateData.guestroom = req.body.guestroom;
    if (req.body.transport) updateData.transport = req.body.transport;

    const updatedEvent = await prisma.basicEvent.update({
      where: { id: String(id) },
      data: {
        ...("iqacNumber" in updateData ? { iqacNumber: String(updateData.iqacNumber) } : {}),
        ...(nextDepartments
          ? { departments: nextDepartments.map((v) => String(v)) }
          : {}),
        ...(sanitizedAcademic
          ? { academicdepartment: sanitizedAcademic.map((v) => String(v)) }
          : {}),
        ...("professional" in updateData && Array.isArray(updateData.professional)
          ? { professional: updateData.professional.map((v) => String(v)) }
          : {}),
        ...("eventName" in updateData ? { eventName: String(updateData.eventName) } : {}),
        ...("eventType" in updateData ? { eventType: String(updateData.eventType) } : {}),
        ...("eventVenue" in updateData ? { eventVenue: String(updateData.eventVenue) } : {}),
        ...("startDate" in updateData ? { startDate: String(updateData.startDate) } : {}),
        ...("endDate" in updateData ? { endDate: String(updateData.endDate) } : {}),
        ...("startTime" in updateData ? { startTime: String(updateData.startTime) } : {}),
        ...("endTime" in updateData ? { endTime: String(updateData.endTime) } : {}),
        ...("year" in updateData ? { year: updateData.year ? String(updateData.year) : null } : {}),
        ...("categories" in updateData ? { categories: updateData.categories ? String(updateData.categories) : null } : {}),
        ...("logos" in updateData && Array.isArray(updateData.logos) ? { logos: updateData.logos.map((v) => String(v)) } : {}),
        ...("description" in updateData ? { description: typeof updateData.description === "string" ? updateData.description : null } : {}),
        ...("organizers" in updateData ? { organizers: updateData.organizers ?? null } : {}),
        ...("resourcePersons" in updateData ? { resourcePersons: updateData.resourcePersons ?? null } : {}),
        ...(updateData.communicationform ? { communicationformId: String(updateData.communicationform) } : {}),
        ...(updateData.foodform ? { foodformId: String(updateData.foodform) } : {}),
        ...(updateData.guestroom ? { guestroomId: String(updateData.guestroom) } : {}),
        ...(updateData.transport ? { transportIds: Array.isArray(updateData.transport) ? updateData.transport.map(String) : [] } : {}),
        status: "Approved",
      },
    });

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({
      message: req.body.approve
        ? "Event approved successfully"
        : "Event updated successfully",
      event: withMongoIdsDeep(withMongoId(updatedEvent)),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const uploadPoster = async (req, res) => {
  console.log("Hitting the upload poster endpoint");
  try {
    const { eventId } = req.body;
    console.log("Event ID:", eventId);
    if (!eventId) {
      return res.status(400).json({ message: "Missing eventId" });
    }
    if (!req.file || !req.file.filename) {
      return res.status(400).json({ message: "Missing poster file" });
    }

    const userDeptKey = normalizeDeptKey(req.user?.dept);
    if (!userDeptKey) {
      return res.status(403).json({ message: "User department missing in token" });
    }

    const existingEvent = await prisma.basicEvent.findUnique({
      where: { id: String(eventId) },
      select: { id: true, academicdepartment: true, departments: true },
    });
    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (userDeptKey !== 'iqac') {
      const deptValues = [
        ...(Array.isArray(existingEvent.academicdepartment) ? existingEvent.academicdepartment : []),
        ...(Array.isArray(existingEvent.departments) ? existingEvent.departments : []),
      ].map((v) => normalizeDeptKey(v));

      if (!deptValues.includes(userDeptKey)) {
        return res.status(403).json({ message: "Not allowed to upload poster for this event" });
      }
    }

    const posterUrl = `/uploads/${req.file.filename}`;

    const event = await prisma.basicEvent.update({
      where: { id: String(eventId) },
      data: { poster: posterUrl },
    });

    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ message: "Poster uploaded", event: withMongoIdsDeep(withMongoId(event)) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const approveEvent = async (req, res) => {
  try {
    const { eventId } = req.body;

    const event = await prisma.basicEvent.update({
      where: { id: String(eventId) },
      data: { status: "approved" },
    });

    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ message: "Event approved", event: withMongoIdsDeep(withMongoId(event)) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export {
  upload,
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  uploadPoster,
  approveEvent,
};
