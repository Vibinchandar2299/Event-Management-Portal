import prisma from "../db/prisma.js";
import { withMongoId, withMongoIdsDeep, ensureApprovalsShape } from "../db/mongoLike.js";

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

  // Academic department aliases (match BasicEvent `academicdepartment` values)
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

const mapBasicEvent = (event) => {
  if (!event) return null;
  return withMongoIdsDeep(withMongoId(event));
};

const mapEndform = (ef) => {
  if (!ef) return null;
  // keep legacy field name used by some older parts of the codebase
  return withMongoIdsDeep(withMongoId({ ...ef, createdat: ef.createdAt }));
};

const mapForm = (doc) => (doc ? withMongoIdsDeep(withMongoId(doc)) : null);

export const createEndform = async (req, res) => {
  try {
    const {
      iqacno,
      eventdata,
      transportform,
      amenityform,
      guestform,
      communicationform,
      foodform,
    } = req.body;
    console.log(
      "req.body of the end form :",
      iqacno,
      eventdata,
      transportform,
      amenityform,
      guestform,
      communicationform,
      foodform
    );
    const savedEndform = await prisma.endform.create({
      data: {
        iqacno: iqacno ? String(iqacno) : null,
        eventdata: eventdata ? String(eventdata) : null,
        transportformIds: Array.isArray(transportform) ? transportform.map(String) : [],
        amenityform: amenityform ? String(amenityform) : null,
        communicationformId: communicationform ? String(communicationform) : null,
        guestformId: guestform ? String(guestform) : null,
        foodformId: foodform ? String(foodform) : null,
        status: "Pending",
        approvals: ensureApprovalsShape(null),
      },
    });

    res.status(201).json({
      message: "Endform created successfully!",
      data: mapEndform(savedEndform),
    });
  } catch (error) {
    console.error("Error in createEndform:", error);
    res.status(500).json({ message: "Failed to create Endform", error: error.message });
  }
};

export const getAllEndforms = async (req, res) => {
  try {
    const endforms = await prisma.endform.findMany({ orderBy: { createdAt: "desc" } });
    res.status(200).json(endforms.map(mapEndform));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch Endforms" });
  }
};

export const getOverallPendingEndforms = async (req, res) => {
  try {
    console.log("Fetching pending and approved endforms...");

    let deptKey = normalizeDeptKey(req.user?.dept);

    // Backfill dept for older tokens that may not contain it.
    if (!deptKey) {
      try {
        const tokenUserId = req.user?.userId;
        const tokenEmail = req.user?.emailId;

        const user = tokenUserId
          ? await prisma.user.findUnique({ where: { id: String(tokenUserId) }, select: { dept: true } })
          : tokenEmail
            ? await prisma.user.findUnique({ where: { emailId: String(tokenEmail) }, select: { dept: true } })
            : null;

        deptKey = normalizeDeptKey(user?.dept);
      } catch (err) {
        console.error("Failed to backfill dept from user record:", err);
      }
    }

    if (!deptKey) {
      return res.status(403).json({ message: "User department missing in token" });
    }
    const roleKey = normalizeDeptKey(deptKey);
    
    // Get both pending and approved endforms so approved events don't disappear
    let endforms = await prisma.endform.findMany({
      where: { status: { in: ["Pending", "Approved"] } },
      orderBy: { createdAt: "desc" },
    });
    console.log(`Found ${endforms.length} endforms (pending + approved)`);
    
    if (!endforms || endforms.length === 0) {
      return res.status(200).json([]); // Return empty array instead of 404
    }

    // Apply role-based scoping based on endform links.
    // IQAC sees all. Department roles see only their relevant endforms.
    if (roleKey && roleKey !== "iqac") {
      if (roleKey === "transport") {
        endforms = endforms.filter((e) => Array.isArray(e.transportformIds) && e.transportformIds.length > 0);
      } else if (roleKey === "food") {
        endforms = endforms.filter((e) => !!e.foodformId);
      } else if (roleKey === "guestroom") {
        endforms = endforms.filter((e) => !!e.guestformId);
      } else if (roleKey === "communication") {
        endforms = endforms.filter((e) => !!e.communicationformId);
      }
    }

    // Fetch basic event data first (also used for academic department scoping).
    const eventIds = endforms.map((e) => e.eventdata).filter(Boolean).map(String);
    const basicEvents = eventIds.length
      ? await prisma.basicEvent.findMany({ where: { id: { in: eventIds } } })
      : [];
    const basicEventsMap = new Map(basicEvents.map((e) => [String(e.id), e]));

    // If this is an academic department login (not a known role), scope by BasicEvent departments.
    const isKnownRole = ["", "iqac", "transport", "food", "guestroom", "communication"].includes(roleKey);
    if (roleKey && roleKey !== "iqac" && !isKnownRole) {
      const matchesDept = (arr) =>
        Array.isArray(arr) &&
        arr.some((v) => normalizeDeptKey(v) === roleKey);

      endforms = endforms.filter((endform) => {
          const basic = endform?.eventdata ? basicEventsMap.get(String(endform.eventdata)) : null;
        return matchesDept(basic?.academicdepartment) || matchesDept(basic?.departments);
      });
    }

    // Collect IDs only for scoped endforms
    const scopedTransportIds = endforms.flatMap((e) => e.transportformIds || []).filter(Boolean).map(String);
    const scopedFoodIds = endforms.map((e) => e.foodformId).filter(Boolean).map(String);
    const scopedGuestIds = endforms.map((e) => e.guestformId).filter(Boolean).map(String);
    const scopedCommunicationIds = endforms.map((e) => e.communicationformId).filter(Boolean).map(String);

    // Batch fetch the remaining related data
    const [transportForms, foodForms, guestForms, communicationForms] = await Promise.all([
      scopedTransportIds.length
        ? prisma.transportRequest.findMany({ where: { id: { in: scopedTransportIds } } })
        : Promise.resolve([]),
      scopedFoodIds.length
        ? prisma.foodForm.findMany({ where: { id: { in: scopedFoodIds } } })
        : Promise.resolve([]),
      scopedGuestIds.length
        ? prisma.guestBooking.findMany({ where: { id: { in: scopedGuestIds } } })
        : Promise.resolve([]),
      scopedCommunicationIds.length
        ? prisma.mediaRequirement.findMany({ where: { id: { in: scopedCommunicationIds } } })
        : Promise.resolve([]),
    ]);

    // Create lookup maps for efficient access
    const transportMap = new Map(transportForms.map((t) => [String(t.id), t]));
    const foodMap = new Map(foodForms.map((f) => [String(f.id), f]));
    const guestMap = new Map(guestForms.map((g) => [String(g.id), g]));
    const communicationMap = new Map(communicationForms.map((c) => [String(c.id), c]));

    // Process each endform
    const populatedEndforms = endforms.map((endform) => {
      try {
        const populatedData = {};

        // Get basic event data
        populatedData.basicEvent = endform.eventdata
          ? mapBasicEvent(basicEventsMap.get(String(endform.eventdata))) || {}
          : {};

        // Get transport data
        if (Array.isArray(endform.transportformIds) && endform.transportformIds.length > 0) {
          populatedData.transport = endform.transportformIds
            .map((id) => transportMap.get(String(id)))
            .filter(Boolean)
            .map(mapForm);
        } else {
          populatedData.transport = [];
        }

        // Get food form data
        if (endform.foodformId) {
          populatedData.foodform = mapForm(foodMap.get(String(endform.foodformId))) || {};
        } else {
          populatedData.foodform = {};
        }

        // Get guest form data
        if (endform.guestformId) {
          populatedData.guestform = mapForm(guestMap.get(String(endform.guestformId))) || {};
        } else {
          populatedData.guestform = {};
        }

        // Get communication form data
        if (endform.communicationformId) {
          populatedData.communicationform = mapForm(communicationMap.get(String(endform.communicationformId))) || {};
        } else {
          populatedData.communicationform = {};
        }

        const approvals = ensureApprovalsShape(endform.approvals);

        return {
          ...mapEndform(endform),
          // legacy aliases expected by parts of the frontend
          transportform: Array.isArray(endform.transportformIds) ? endform.transportformIds.map(String) : [],
          foodformId: endform.foodformId ? String(endform.foodformId) : null,
          guestformId: endform.guestformId ? String(endform.guestformId) : null,
          communicationformId: endform.communicationformId ? String(endform.communicationformId) : null,
          approvals,
          ...populatedData,
        };
      } catch (error) {
        console.error("Error processing endform:", endform?.id, error);
        return null;
      }
    });

    const validPopulatedEndforms = populatedEndforms.filter(endform => endform !== null);
    console.log(`Successfully processed ${validPopulatedEndforms.length} endforms`);
    
    res.status(200).json(validPopulatedEndforms);
  } catch (error) {
    console.error("Error fetching pending endforms:", error);
    res.status(500).json({ 
      message: "Failed to fetch overall pending Endforms",
      error: error.message 
    });
  }
};

export const updateEndform = async (req, res) => {
  try {
    const body = req.body || {};
    const data = {
      ...(body.iqacno != null ? { iqacno: body.iqacno ? String(body.iqacno) : null } : {}),
      ...(body.eventdata != null ? { eventdata: body.eventdata ? String(body.eventdata) : null } : {}),
      ...(body.amenityform != null ? { amenityform: body.amenityform ? String(body.amenityform) : null } : {}),
      ...(body.status != null ? { status: body.status ? String(body.status) : null } : {}),
      ...(body.approvals != null ? { approvals: body.approvals } : {}),
      ...(body.transportform || body.transportformIds
        ? { transportformIds: Array.isArray(body.transportform || body.transportformIds) ? (body.transportform || body.transportformIds).map(String) : [] }
        : {}),
      ...(body.foodform != null || body.foodformId != null
        ? { foodformId: body.foodformId || body.foodform ? String(body.foodformId || body.foodform) : null }
        : {}),
      ...(body.guestform != null || body.guestformId != null
        ? { guestformId: body.guestformId || body.guestform ? String(body.guestformId || body.guestform) : null }
        : {}),
      ...(body.communicationform != null || body.communicationformId != null
        ? { communicationformId: body.communicationformId || body.communicationform ? String(body.communicationformId || body.communicationform) : null }
        : {}),
    };

    const updatedEndform = await prisma.endform.update({
      where: { id: String(req.params.id) },
      data,
    }).catch(() => null);

    if (!updatedEndform) {
      return res.status(404).json({ message: "Endform not found" });
    }

    res.status(200).json({
      message: "Endform updated successfully",
      data: mapEndform(updatedEndform),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update Endform" });
  }
};

export const deleteEndform = async (req, res) => {
  try {
    console.log("=== DELETE ENDFORM DEBUG ===");
    console.log("Request params:", req.params);
    console.log("Endform ID to delete:", req.params.id);
    console.log("ID type:", typeof req.params.id);

    const userDeptKey = normalizeDeptKey(req.user?.dept);
    if (!userDeptKey) {
      return res.status(403).json({ message: "User department missing in token" });
    }

    const endform = await prisma.endform.findUnique({ where: { id: String(req.params.id) } });
    if (!endform) {
      console.log("Endform not found for ID:", req.params.id);
      return res.status(404).json({ message: "Endform not found" });
    }

    if (userDeptKey !== 'iqac') {
      const basicEvent = endform.eventdata
        ? await prisma.basicEvent.findUnique({
            where: { id: String(endform.eventdata) },
            select: { academicdepartment: true, departments: true },
          })
        : null;
      if (!basicEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      const deptValues = [
        ...(Array.isArray(basicEvent.academicdepartment) ? basicEvent.academicdepartment : []),
        ...(Array.isArray(basicEvent.departments) ? basicEvent.departments : []),
      ].map((v) => normalizeDeptKey(v));

      if (!deptValues.includes(userDeptKey)) {
        return res.status(403).json({ message: "Not allowed to delete this event" });
      }
    }

    await prisma.endform.delete({ where: { id: String(req.params.id) } });
    res.status(200).json({ message: "Endform deleted successfully" });
  } catch (error) {
    console.error("Error in deleteEndform:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Failed to delete Endform", error: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("getEventById called with id:", id);

    // NOTE: This endpoint is intended to resolve an EndForm by the BasicEvent id stored in
    // EndForm.eventdata. Historically this incorrectly used findById(id) (EndForm _id).
    // To remain backward compatible, try by eventdata first, then fallback to _id.
    let endform = await prisma.endform.findFirst({ where: { eventdata: String(id) } });
    if (!endform) endform = await prisma.endform.findUnique({ where: { id: String(id) } });
    
    if (!endform) {
      console.log("Endform not found for id:", id);
      return res.status(404).json({ message: "Event not found" });
    }

    console.log("Found endform:", endform);

    const populatedData = {};

    if (endform.eventdata) {
      populatedData.basicEvent = await prisma.basicEvent.findUnique({ where: { id: String(endform.eventdata) } });
      console.log("Populated basicEvent:", populatedData.basicEvent);
    }
    if (Array.isArray(endform.transportformIds) && endform.transportformIds.length > 0) {
      populatedData.transport = await prisma.transportRequest.findMany({
        where: { id: { in: endform.transportformIds.map(String) } },
      });
      console.log("Populated transport:", populatedData.transport);
    }
    if (endform.foodformId) {
      populatedData.foodform = await prisma.foodForm.findUnique({ where: { id: String(endform.foodformId) } });
      console.log("Populated foodform:", populatedData.foodform);
      console.log("Foodform ID from endform:", endform.foodformId);
      console.log("Foodform data type:", typeof populatedData.foodform);
      console.log("Foodform data keys:", populatedData.foodform ? Object.keys(populatedData.foodform) : "No data");
    } else {
      // For existing events that might not have foodform in EndForm, check if basicEvent has foodform
      if (endform.eventdata) {
        const basicEvent = await prisma.basicEvent.findUnique({ where: { id: String(endform.eventdata) } });
        if (basicEvent && basicEvent.foodformId) {
          populatedData.foodform = await prisma.foodForm.findUnique({ where: { id: String(basicEvent.foodformId) } });
          console.log("Found foodform from basicEvent:", populatedData.foodform);
        }
      }
    }
    if (endform.guestformId) {
      populatedData.guestform = await prisma.guestBooking.findUnique({ where: { id: String(endform.guestformId) } });
      console.log("Populated guestform:", populatedData.guestform);
    }
    if (endform.communicationformId) {
      populatedData.communicationform = await prisma.mediaRequirement.findUnique({ where: { id: String(endform.communicationformId) } });
      console.log("Populated communicationform:", populatedData.communicationform);
    }

    const populatedEvent = {
      ...mapEndform(endform),
      transportform: Array.isArray(endform.transportformIds) ? endform.transportformIds.map(String) : [],
      approvals: ensureApprovalsShape(endform.approvals),
      basicEvent: mapBasicEvent(populatedData.basicEvent) || {},
      transport: Array.isArray(populatedData.transport) ? populatedData.transport.map(mapForm) : [],
      foodform: mapForm(populatedData.foodform) || {},
      guestform: mapForm(populatedData.guestform) || {},
      communicationform: mapForm(populatedData.communicationform) || {},
    };

    console.log("Final populated event for id", id, ":", populatedEvent);

    res.status(200).json(populatedEvent);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Failed to fetch event details" });
  }
};
