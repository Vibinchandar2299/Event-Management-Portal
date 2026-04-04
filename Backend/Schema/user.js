import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    emailId: { type: String, required: true },
    password: { type: String, default: "sece@123" },
    phoneNumber: { type: String, required: true },
    designation: { type: String, required: false },
    dept: { type: String, required: true },
    empid: { type: String, required: false },

    // Shared-account settings (optional)
    accountOwnerName: { type: String, required: false, default: "" },
    accountOwnerEmail: { type: String, required: false, default: "" },
    accountOwnerPhone: { type: String, required: false, default: "" },

    notificationEmails: { type: [String], required: false, default: [] },
    notificationWhatsappNumbers: { type: [String], required: false, default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
