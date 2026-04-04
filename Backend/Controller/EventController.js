import Event from "../Schema/EventSchema.js";
import Endform from "../Schema/EndForm.js";
import multer from "multer";
import path from "path";

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

    // Ensure academic creators always have their dept on the event.
    // This prevents academic pending scoping from filtering out their own events
    // when they forget to select the academic department.
    const patchedAcademic = shouldAttachAcademicDept
      ? (() => {
          const alreadyHas = safeAcademic.some((v) => normalizeDeptKey(v) === creatorDeptKey);
          return alreadyHas ? safeAcademic : [...safeAcademic, String(creatorDeptRaw || creatorDeptKey || "").trim()].filter(Boolean);
        })()
      : safeAcademic;

    const newEvent = new Event({
      iqacNumber,
      departments: safeDepartments,
      academicdepartment: patchedAcademic,
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
      communicationform: communicationform || undefined,
      foodform: foodform || undefined,
      guestroom: guestroom || undefined,
      transport: transport || undefined
    });

    await newEvent.save();
    res
      .status(200)
      .json({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message, stack: error.stack });
  }
};

// ✅ Get All Events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get Event by ID
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id)
      .populate("communicationform")
      .populate("foodform")
      .populate("guestroom")
      .populate("transport");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };
    updateData.status = "Approved";

    // Accept and set sub-form ObjectId references if provided
    if (req.body.communicationform) updateData.communicationform = req.body.communicationform;
    if (req.body.foodform) updateData.foodform = req.body.foodform;
    if (req.body.guestroom) updateData.guestroom = req.body.guestroom;
    if (req.body.transport) updateData.transport = req.body.transport;

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.status(200).json({
      message: req.body.approve
        ? "Event approved successfully"
        : "Event updated successfully",
      event: updatedEvent,
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

    const existingEvent = await Event.findById(eventId).select('academicdepartment departments').lean();
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

    const event = await Event.findByIdAndUpdate(
      eventId,
      { poster: posterUrl },
      { new: true }
    );

    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ message: "Poster uploaded", event });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const approveEvent = async (req, res) => {
  try {
    const { eventId } = req.body;

    const event = await Event.findByIdAndUpdate(
      eventId,
      { status: "approved" },
      { new: true }
    );

    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ message: "Event approved", event });
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
