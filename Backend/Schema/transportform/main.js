import mongoose from "mongoose";

const transportSchema = new mongoose.Schema(
  {
    basicDetails: {
      departmentName: { type: String, required: true },
      designation: { type: String, required: false },
      empId: { type: String, required: true },
      iqacNumber: { type: String, required: true },
      mobileNumber: { type: String, required: false },
      requestorName: { type: String, required: true },
      requisitionDate: { type: Date, required: true },
    },
    eventDetails: {
      eventName: { type: String, required: true },
      eventType: { type: String, required: true },
      travellerDetails: { type: String, required: true },
    },
    travelDetails: {
      pickUpDateTime: { type: Date },
      dropDateTime: { type: Date, required: true },
      pickUpLocation: { type: String, required: true },
      dropDateTime: { type: Date, required: true },
      dropLocation: { type: String, required: true },
      numberOfPassengers: { type: Number, required: true },
      vehicleType: { type: String, required: true },
      specialRequirements: { type: String, required: false },
    },
    driverDetails: {
      name: { type: String, required: true },
      mobileNumber: { type: String, required: true },
    },
    status: {
      type: String,
    },
  },
  { timestamps: true }
);

const TransportRequest = mongoose.model("TransportRequest", transportSchema);

export default TransportRequest;
