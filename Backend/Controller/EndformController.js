import Endform from "../Schema/EndForm.js";
import BasicEvent from "../Schema/EventSchema.js";
import transport from "../Schema/transportform/main.js";
import foodformModel from "../Schema/foodform/main.js";
import communicationform from "../Schema/MedaiRequirements.js";
import guestroomform from "../Schema/guestroom/main.js";
import User from "../Schema/user.js";

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
    const newEndform = new Endform({
      iqacno,
      eventdata,
      transportform,
      amenityform,
      communicationform,
      guestform,
      foodform,
      status: "Pending"
    });
    const savedEndform = await newEndform.save();
    console.log("Saved Endform:", savedEndform);

    if (!savedEndform || !savedEndform._id) {
      return res.status(500).json({ message: "Failed to save Endform" });
    }

    res.status(201).json({
      message: "Endform created successfully!",
      data: savedEndform,
    });
  } catch (error) {
    console.error("Error in createEndform:", error);
    res.status(500).json({ message: "Failed to create Endform", error: error.message });
  }
};

export const getAllEndforms = async (req, res) => {
  try {
    const endforms = await Endform.find();
    res.status(200).json(endforms);
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
          ? await User.findById(tokenUserId).select("dept").lean()
          : tokenEmail
            ? await User.findOne({ emailId: tokenEmail }).select("dept").lean()
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
    let endforms = await Endform.find({ 
      status: { $in: ["Pending", "Approved"] } 
    });
    console.log(`Found ${endforms.length} endforms (pending + approved)`);
    
    if (!endforms || endforms.length === 0) {
      return res.status(200).json([]); // Return empty array instead of 404
    }

    // Apply role-based scoping based on endform links.
    // IQAC sees all. Department roles see only their relevant endforms.
    if (roleKey && roleKey !== "iqac") {
      if (roleKey === "transport") {
        endforms = endforms.filter((e) => Array.isArray(e.transportform) && e.transportform.length > 0);
      } else if (roleKey === "food") {
        endforms = endforms.filter((e) => !!e.foodform);
      } else if (roleKey === "guestroom") {
        endforms = endforms.filter((e) => !!e.guestform);
      } else if (roleKey === "communication") {
        endforms = endforms.filter((e) => !!e.communicationform);
      }
    }

    // Fetch basic event data first (also used for academic department scoping).
    const eventIds = endforms.map((e) => e.eventdata).filter(Boolean);
    const basicEvents = await BasicEvent.find({ _id: { $in: eventIds } });
    const basicEventsMap = new Map(basicEvents.map((e) => [e._id.toString(), e]));

    // If this is an academic department login (not a known role), scope by BasicEvent departments.
    const isKnownRole = ["", "iqac", "transport", "food", "guestroom", "communication"].includes(roleKey);
    if (roleKey && roleKey !== "iqac" && !isKnownRole) {
      const matchesDept = (arr) =>
        Array.isArray(arr) &&
        arr.some((v) => normalizeDeptKey(v) === roleKey);

      endforms = endforms.filter((endform) => {
        const basic = endform?.eventdata ? basicEventsMap.get(endform.eventdata.toString()) : null;
        return matchesDept(basic?.academicdepartment) || matchesDept(basic?.departments);
      });
    }

    // Collect IDs only for scoped endforms
    const scopedTransportIds = endforms.flatMap((e) => e.transportform || []).filter(Boolean);
    const scopedFoodIds = endforms.map((e) => e.foodform).filter(Boolean);
    const scopedGuestIds = endforms.map((e) => e.guestform).filter(Boolean);
    const scopedCommunicationIds = endforms.map((e) => e.communicationform).filter(Boolean);

    // Batch fetch the remaining related data
    const [transportForms, foodForms, guestForms, communicationForms] = await Promise.all([
      transport.find({ _id: { $in: scopedTransportIds } }),
      foodformModel.find({ _id: { $in: scopedFoodIds } }),
      guestroomform.find({ _id: { $in: scopedGuestIds } }),
      communicationform.find({ _id: { $in: scopedCommunicationIds } })
    ]);

    // Create lookup maps for efficient access
    const transportMap = new Map(transportForms.map(t => [t._id.toString(), t]));
    const foodMap = new Map(foodForms.map(f => [f._id.toString(), f]));
    const guestMap = new Map(guestForms.map(g => [g._id.toString(), g]));
    const communicationMap = new Map(communicationForms.map(c => [c._id.toString(), c]));

    // Process each endform
    const populatedEndforms = endforms.map((endform) => {
      try {
        const populatedData = {};

        // Get basic event data
        if (endform.eventdata) {
          populatedData.basicEvent = basicEventsMap.get(endform.eventdata.toString()) || {};
        } else {
          populatedData.basicEvent = {};
        }

        // Get transport data
        if (endform.transportform && endform.transportform.length > 0) {
          populatedData.transport = endform.transportform
            .map(id => transportMap.get(id.toString()))
            .filter(Boolean);
        } else {
          populatedData.transport = [];
        }

        // Get food form data
        if (endform.foodform) {
          populatedData.foodform = foodMap.get(endform.foodform.toString()) || {};
        } else {
          populatedData.foodform = {};
        }

        // Get guest form data
        if (endform.guestform) {
          populatedData.guestform = guestMap.get(endform.guestform.toString()) || {};
        } else {
          populatedData.guestform = {};
        }

        // Get communication form data
        if (endform.communicationform) {
          populatedData.communicationform = communicationMap.get(endform.communicationform.toString()) || {};
        } else {
          populatedData.communicationform = {};
        }

        return {
          ...endform.toObject(),
          ...populatedData,
        };
      } catch (error) {
        console.error("Error processing endform:", endform._id, error);
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
    const updatedEndform = await Endform.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedEndform) {
      return res.status(404).json({ message: "Endform not found" });
    }

    res.status(200).json({
      message: "Endform updated successfully",
      data: updatedEndform,
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

    const endform = await Endform.findById(req.params.id);
    if (!endform) {
      console.log("Endform not found for ID:", req.params.id);
      return res.status(404).json({ message: "Endform not found" });
    }

    if (userDeptKey !== 'iqac') {
      const basicEvent = endform.eventdata ? await BasicEvent.findById(endform.eventdata).select('academicdepartment departments').lean() : null;
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

    await Endform.findByIdAndDelete(req.params.id);
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
    let endform = await Endform.findOne({ eventdata: id });
    if (!endform) {
      endform = await Endform.findById(id);
    }
    
    if (!endform) {
      console.log("Endform not found for id:", id);
      return res.status(404).json({ message: "Event not found" });
    }

    console.log("Found endform:", endform);

    const populatedData = {};

    if (endform.eventdata) {
      populatedData.basicEvent = await BasicEvent.findById(endform.eventdata);
      console.log("Populated basicEvent:", populatedData.basicEvent);
    }
    if (endform.transportform && endform.transportform.length > 0) {
      populatedData.transport = await transport.find({
        _id: { $in: endform.transportform },
      });
      console.log("Populated transport:", populatedData.transport);
    }
    if (endform.foodform) {
      populatedData.foodform = await foodformModel.findById(endform.foodform);
      console.log("Populated foodform:", populatedData.foodform);
      console.log("Foodform ID from endform:", endform.foodform);
      console.log("Foodform data type:", typeof populatedData.foodform);
      console.log("Foodform data keys:", populatedData.foodform ? Object.keys(populatedData.foodform) : "No data");
    } else {
      // For existing events that might not have foodform in EndForm, check if basicEvent has foodform
      if (endform.eventdata) {
        const basicEvent = await BasicEvent.findById(endform.eventdata);
        if (basicEvent && basicEvent.foodform) {
          populatedData.foodform = await foodformModel.findById(basicEvent.foodform);
          console.log("Found foodform from basicEvent:", populatedData.foodform);
        }
      }
    }
    if (endform.guestform) {
      populatedData.guestform = await guestroomform.findById(endform.guestform);
      console.log("Populated guestform:", populatedData.guestform);
    }
    if (endform.communicationform) {
      populatedData.communicationform = await communicationform.findById(endform.communicationform);
      console.log("Populated communicationform:", populatedData.communicationform);
    }

    const populatedEvent = {
      ...endform.toObject(),
      ...populatedData,
    };

    console.log("Final populated event for id", id, ":", populatedEvent);

    res.status(200).json(populatedEvent);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ message: "Failed to fetch event details" });
  }
};
