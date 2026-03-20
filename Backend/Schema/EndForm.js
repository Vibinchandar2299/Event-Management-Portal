import mongoose from "mongoose";

const EndformSchema = new mongoose.Schema({
  eventdata: {
    type: String,
  },
  iqacno: {
    type: String,
  },
  transportform: [{ type: mongoose.Schema.Types.ObjectId, ref: "TransportRequest" }],
  amenityform: {
    type: String,
  },
  guestform: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  communicationform: { type: mongoose.Schema.Types.ObjectId, ref: "MediaRequirements" },
  foodform: { type: mongoose.Schema.Types.ObjectId, ref: "foodforms" },
  status: {
    type: String,
  },
  // Department approval status
  approvals: {
    communication: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: String },
      approvedAt: { type: Date },
      department: { type: String, default: "Communication" }
    },
    food: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: String },
      approvedAt: { type: Date },
      department: { type: String, default: "Food" }
    },
    transport: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: String },
      approvedAt: { type: Date },
      department: { type: String, default: "Transport" }
    },
    guestroom: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: String },
      approvedAt: { type: Date },
      department: { type: String, default: "Guest Deparment" }
    },
    iqac: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: String },
      approvedAt: { type: Date },
      department: { type: String, default: "IQAC" }
    }
  },
  createdat: {
    type: Date,
    default: Date.now(),
  },
});
const Endform = mongoose.model("Endform", EndformSchema);
export default Endform;
