import Event from "../../Schema/foodform/main.js";

export const createEvent = async (req, res) => {
  try {
    console.log("Incoming data:", JSON.stringify(req.body, null, 2));

    const datesArray = Object.entries(req.body.dates).map(
      ([key, dateValue]) => ({
        date: dateValue,
        foodDetails: req.body.foodDetails[key],
      })
    );

    req.body.dates = datesArray;

    const {
      eventName,
      eventType,
      iqacNumber,
      empId,
      requestorName,
      requisitionDate,
      mobileNumber,
    } = req.body;
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

    // Create and save the event
    const newEvent = new Event(req.body);
    const savedEvent = await newEvent.save();
    console.log("event comming into the backend : ", newEvent);
    res
      .status(201)
      .json({ message: "Event created successfully", data: savedEvent });
  } catch (error) {
    console.error("Error creating event:", error.message);
    res
      .status(400)
      .json({ error: "Failed to create event", details: error.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json({ data: events });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch events", details: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.status(200).json({ data: event });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch event", details: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedEvent)
      return res.status(404).json({ error: "Event not found" });
    res
      .status(200)
      .json({ message: "Event updated successfully", data: updatedEvent });
  } catch (error) {
    res
      .status(400)
      .json({ error: "Failed to update event", details: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent)
      return res.status(404).json({ error: "Event not found" });
    res
      .status(200)
      .json({ message: "Event deleted successfully", data: deletedEvent });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete event", details: error.message });
  }
};
