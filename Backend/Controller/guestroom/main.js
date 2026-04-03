import Booking from "../../Schema/guestroom/main.js";

const normalizeBookingPayload = (raw) => {
  const payload = raw && typeof raw === "object" ? { ...raw } : {};

  // Accept common aliases and coerce to a valid positive integer when possible.
  const candidate =
    payload.stayDays ?? payload.numberOfDays ?? payload.days ?? payload.daysCount;

  if (candidate === "" || candidate === null || candidate === undefined) {
    delete payload.stayDays;
  } else {
    const n = Number(candidate);
    if (Number.isFinite(n) && n > 0) {
      payload.stayDays = Math.floor(n);
    } else {
      delete payload.stayDays;
    }
  }

  // Clean up aliases so the stored field is always stayDays
  delete payload.numberOfDays;
  delete payload.days;
  delete payload.daysCount;

  return payload;
};

export const createBooking = async (req, res) => {
  console.log("req.body of the bookings : ",req.body)
  try {
    const booking = new Booking(normalizeBookingPayload(req.body));
    const savedBooking = await booking.save();
    res.status(201).json(savedBooking);
  } catch (error) {
    console.log("error : ",error)
    res
      .status(500)
      .json({ error: "Failed to create booking", details: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json(bookings);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve bookings", details: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(200).json(booking);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve booking", details: error.message });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBooking = await Booking.findByIdAndUpdate(id, normalizeBookingPayload(req.body), {
      new: true,
    });
    if (!updatedBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(200).json(updatedBooking);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update booking", details: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBooking = await Booking.findByIdAndDelete(id);
    if (!deletedBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete booking", details: error.message });
  }
};
