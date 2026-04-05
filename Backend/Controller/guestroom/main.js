import prisma from "../../db/prisma.js";
import { withMongoId, withMongoIdsDeep } from "../../db/mongoLike.js";

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
    const payload = normalizeBookingPayload(req.body);
    const savedBooking = await prisma.guestBooking.create({
      data: {
        ...payload,
        date: payload?.date ? new Date(payload.date) : new Date(),
        guestCount: payload?.guestCount != null ? Number(payload.guestCount) : 0,
        stayDays: payload?.stayDays != null ? Number(payload.stayDays) : null,
        selectedRooms: Array.isArray(payload.selectedRooms) ? payload.selectedRooms.map(String) : [],
      },
    });
    res.status(201).json(withMongoIdsDeep(withMongoId(savedBooking)));
  } catch (error) {
    console.log("error : ",error)
    res
      .status(500)
      .json({ error: "Failed to create booking", details: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await prisma.guestBooking.findMany({ orderBy: { createdAt: "desc" } });
    res.status(200).json(bookings.map((b) => withMongoIdsDeep(withMongoId(b))));
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve bookings", details: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.guestBooking.findUnique({ where: { id: String(id) } });
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(200).json(withMongoIdsDeep(withMongoId(booking)));
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve booking", details: error.message });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = normalizeBookingPayload(req.body);
    const updatedBooking = await prisma.guestBooking.update({
      where: { id: String(id) },
      data: {
        ...payload,
        ...(payload.date ? { date: new Date(payload.date) } : {}),
        ...(payload.guestCount != null ? { guestCount: Number(payload.guestCount) } : {}),
        ...(payload.stayDays != null ? { stayDays: Number(payload.stayDays) } : {}),
        ...(payload.selectedRooms ? { selectedRooms: Array.isArray(payload.selectedRooms) ? payload.selectedRooms.map(String) : [] } : {}),
      },
    }).catch(() => null);
    if (!updatedBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.status(200).json(withMongoIdsDeep(withMongoId(updatedBooking)));
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to update booking", details: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBooking = await prisma.guestBooking.delete({ where: { id: String(id) } }).catch(() => null);
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
