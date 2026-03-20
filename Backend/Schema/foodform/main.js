import mongoose from "mongoose";

const FoodDetailsSchema = new mongoose.Schema({
  Breakfast: {
    guest: {
      Veg: { type: String, default: "" },
      NonVeg: { type: String, default: "" },
    },
    participants: {
      Veg: { type: String, default: "" },
      NonVeg: { type: String, default: "" },
    },
  },
  Lunch: {
    guest: {
      Veg: { type: String, default: "" },
      NonVeg: { type: String, default: "" },
    },
    participants: {
      Veg: { type: String, default: "" },
      NonVeg: { type: String, default: "" },
    },
  },
  Dinner: {
    guest: {
      Veg: { type: String, default: "" },
      NonVeg: { type: String, default: "" },
    },
    participants: {
      Veg: { type: String, default: "" },
      NonVeg: { type: String, default: "" },
    },
  },
  MorningRefreshment: {
    participants: {
      total: { type: String, default: "" },
    },
  },
  EveningRefreshment: {
    guest: {
      total: { type: String, default: "" },
    },
    participants: {
      total: { type: String, default: "" },
    },
  },
});
const DateDetailsSchema = new mongoose.Schema({
  date: {
    start: { type: Date },
    end: { type: Date },
  },
  foodDetails: { type: FoodDetailsSchema },
});

const EventSchema = new mongoose.Schema(
  {
    eventName: { type: String },
    eventType: { type: String },
    otherEventType: { type: String, default: "" },
    iqacNumber: { type: String },
    empId: { type: String },
    requestorName: { type: String },
    requisitionDate: { type: Date },
    mobileNumber: { type: String },
    department: { type: String },
    designationDepartment: { type: String },
    amenitiesIncharge: { type: String },
    deanClearance: { type: String, default: "" },
    recommendedBy: { type: String, default: "" },
    facultySignature: { type: String, default: "" },
    dates: [DateDetailsSchema],
    status: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("foodforms", EventSchema);
