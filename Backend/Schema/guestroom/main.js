import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  empId: {
    type: String,
    required: true,
  },
  eventType: {
    type: String,
    required: true,
  },
  guestCount: {
    type: Number,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    required: true,
  },
  requestorName: {
    type: String,
    required: true,
  },
  selectedRooms: {
    type: [String],
    required: true,
  },
  status: {
    type: String,
  },
});

const Booking = mongoose.model("Booking", BookingSchema);

export default Booking;
