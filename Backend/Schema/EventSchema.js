import mongoose from "mongoose";

const organizerSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  designation: { type: String, required: true },
  phone: { type: String, required: true },
});

const resourcePersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  affiliation: { type: String, required: true },
});

const eventSchema = new mongoose.Schema({
  iqacNumber: { type: String, required: true },
  departments: { type: [String] },
  academicdepartment: { type: [String] },
  professional: { type: [String] },
  eventName: { type: String, required: true },
  eventType: { type: String, required: true },
  eventVenue: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  year: { type: String },
  categories: { type: String },
  logos: { type: [String] },
  description: { type: String },
  organizers: { type: [organizerSchema] },
  resourcePersons: { type: [resourcePersonSchema] },
  status: {
    type: String,
  },
  poster: { type: String },
  communicationform: { type: mongoose.Schema.Types.ObjectId, ref: "MediaRequirements" },
  foodform: { type: mongoose.Schema.Types.ObjectId, ref: "foodforms" },
  guestroom: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  transport: [{ type: mongoose.Schema.Types.ObjectId, ref: "TransportRequest" }],
});

const Event = mongoose.model("Event", eventSchema);

export default Event;
