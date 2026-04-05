import prisma from "../../db/prisma.js";
import { withMongoId, withMongoIdsDeep } from "../../db/mongoLike.js";

const normalizeFoodDetails = (details = {}) => {
  if (!details || typeof details !== "object") return {};

  const mealKeyMap = {
    "Morning Refreshment": "MorningRefreshment",
    "Evening Refreshment": "EveningRefreshment",
  };

  const normalized = {};

  Object.entries(details).forEach(([mealKey, mealValue]) => {
    const targetMealKey = mealKeyMap[mealKey] || mealKey;
    const mealObj = mealValue && typeof mealValue === "object" ? mealValue : {};

    const normalizeSection = (section) => {
      if (section == null) return undefined;
      if (typeof section !== "object") return section;
      return {
        ...section,
        NonVeg: section.NonVeg ?? section["Non Veg"] ?? "",
      };
    };

    normalized[targetMealKey] = {
      ...(mealObj.participants ? { participants: normalizeSection(mealObj.participants) } : {}),
      ...(mealObj.guest ? { guest: normalizeSection(mealObj.guest) } : {}),
    };
  });

  return normalized;
};

const normalizePayload = (payload = {}) => {
  const body = { ...payload };

  if (Array.isArray(body.dates)) {
    body.dates = body.dates.map((entry) => {
      const dateObj = entry?.date && typeof entry.date === "object"
        ? {
            start: entry.date.start,
            end: entry.date.end || entry.date.start,
          }
        : {
            start: entry?.date || entry?.start,
            end: entry?.end || entry?.date || entry?.start,
          };

      return {
        date: dateObj,
        foodDetails: normalizeFoodDetails(entry?.foodDetails || {}),
      };
    });
  } else if (body.dates && typeof body.dates === "object") {
    const rootFoodDetails = body.foodDetails && typeof body.foodDetails === "object" ? body.foodDetails : {};

    body.dates = Object.entries(body.dates).map(([key, dateValue]) => {
      const dateObj = dateValue && typeof dateValue === "object"
        ? {
            start: dateValue.start || key,
            end: dateValue.end || dateValue.start || key,
          }
        : {
            start: key,
            end: key,
          };

      return {
        date: dateObj,
        foodDetails: normalizeFoodDetails(rootFoodDetails[key] || {}),
      };
    });
  } else {
    body.dates = [];
  }

  delete body.foodDetails;
  return body;
};

export const createEvent = async (req, res) => {
  try {
    console.log("Incoming data:", JSON.stringify(req.body, null, 2));

    const normalizedBody = normalizePayload(req.body);

    const {
      eventName,
      eventType,
      iqacNumber,
      empId,
      requestorName,
      requisitionDate,
      mobileNumber,
    } = normalizedBody;
    // eventname:eventName
    if (
      !eventName ||
      !eventType ||
      !iqacNumber ||
      !empId ||
      !requestorName ||
      !requisitionDate ||
      !mobileNumber
    ) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const created = await prisma.foodForm.create({
      data: {
        ...normalizedBody,
        // Ensure JSON is stored for dates
        dates: Array.isArray(normalizedBody.dates) ? normalizedBody.dates : [],
      },
    });

    res.status(201).json({
      message: "Event created successfully",
      data: withMongoIdsDeep(withMongoId(created)),
    });
  } catch (error) {
    console.error("Error creating event:", error.message);
    res
      .status(400)
      .json({ error: "Failed to create event", details: error.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const events = await prisma.foodForm.findMany({ orderBy: { createdAt: "desc" } });
    res.status(200).json({ data: events.map((e) => withMongoIdsDeep(withMongoId(e))) });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch events", details: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.foodForm.findUnique({ where: { id: String(id) } });
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.status(200).json({ data: withMongoIdsDeep(withMongoId(event)) });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch event", details: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const normalizedBody = normalizePayload(req.body);

    const updatedEvent = await prisma.foodForm.update({
      where: { id: String(id) },
      data: {
        ...normalizedBody,
        dates: Array.isArray(normalizedBody.dates) ? normalizedBody.dates : [],
      },
    });
    if (!updatedEvent)
      return res.status(404).json({ error: "Event not found" });
    res
      .status(200)
      .json({ message: "Event updated successfully", data: withMongoIdsDeep(withMongoId(updatedEvent)) });
  } catch (error) {
    res
      .status(400)
      .json({ error: "Failed to update event", details: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEvent = await prisma.foodForm.delete({ where: { id: String(id) } }).catch(() => null);
    if (!deletedEvent)
      return res.status(404).json({ error: "Event not found" });
    res
      .status(200)
      .json({ message: "Event deleted successfully", data: withMongoIdsDeep(withMongoId(deletedEvent)) });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete event", details: error.message });
  }
};
