import prisma from "../../db/prisma.js";
import { withMongoId, withMongoIdsDeep } from "../../db/mongoLike.js";

export const createTransportRequest = async (req, res) => {
  try {
    const transportRequests = req.body.events;

    if (!Array.isArray(transportRequests) || transportRequests.length === 0) {
      return res.status(400).json({ error: "Invalid or empty data array" });
    }

    const formattedRequests = transportRequests.map((request) => {
      const { basicDetails, travelDetails, eventDetails, driverDetails } =
        request;

      if (!basicDetails || !travelDetails || !eventDetails || !driverDetails) {
        throw new Error("Missing required nested data in one of the requests.");
      }

      if (!travelDetails.pickUpDateTime) {
        throw new Error("Pick-up Date and Time is required.");
      }

      return {
        basicDetails: {
          departmentName: basicDetails.departmentName,
          designation: basicDetails.designation || "Not Provided",
          empId: basicDetails.empId,
          iqacNumber: basicDetails.iqacNumber,
          mobileNumber: basicDetails.mobileNumber || "Not Provided",
          requestorName: basicDetails.requestorName,
          requisitionDate: new Date(basicDetails.requisitionDate),
        },
        driverDetails: {
          mobileNumber: driverDetails.mobileNumber,
          name: driverDetails.name,
        },
        travelDetails: {
          pickUpDateTime: new Date(travelDetails.pickUpDateTime),
          dropDateTime: new Date(travelDetails.dropDateTime),
          numberOfPassengers: Number(travelDetails.numberOfPassengers) || 1,
          vehicleType: travelDetails.vehicleType,
          pickUpLocation: travelDetails.pickUpLocation,
          dropLocation: travelDetails.dropLocation,
          specialRequirements: travelDetails.specialRequirements,
        },
        eventDetails: {
          eventName: eventDetails.eventName,
          eventType: eventDetails.eventType || "General",
          travellerDetails: eventDetails.travellerDetails || "Not Provided",
        },
      };
    });

    console.log("formattedRequests : ", formattedRequests);
    const created = await prisma.$transaction(
      formattedRequests.map((r) =>
        prisma.transportRequest.create({
          data: {
            basicDetails: r.basicDetails,
            driverDetails: r.driverDetails,
            travelDetails: r.travelDetails,
            eventDetails: r.eventDetails,
            iqacNumber: r?.basicDetails?.iqacNumber ? String(r.basicDetails.iqacNumber) : null,
            status: typeof r.status === "string" ? r.status : null,
          },
        })
      )
    );

    res.status(201).json(created.map((x) => withMongoIdsDeep(withMongoId(x))));
  } catch (error) {
    console.log("error : ", error);

    res.status(400).json({ error: error.message });
  }
};

export const getAllTransportRequests = async (req, res) => {
  try {
    const requests = await prisma.transportRequest.findMany({ orderBy: { createdAt: "desc" } });
    res.status(200).json(requests.map((x) => withMongoIdsDeep(withMongoId(x))));
  } catch (error) {
    console.log("error : ", error);
    res.status(500).json({
      message: "Error fetching transport requests",
      error: error.message,
    });
  }
};

export const getTransportRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.transportRequest.findUnique({ where: { id: String(id) } });
    if (!request) {
      return res.status(404).json({ message: "Transport request not found" });
    }
    res.status(200).json(withMongoIdsDeep(withMongoId(request)));
  } catch (error) {
    res.status(500).json({
      message: "Error fetching transport request",
      error: error.message,
    });
  }
};

export const updateTransportRequest = async (req, res) => {
  try {
    const { id } = req.params; // Can be single ID or undefined if multiple
    const { events } = req.body; // Expecting an array of events

    console.log("Transport Update Request:", req.body);

    if (Array.isArray(events) && events.length > 0) {
      // Multiple Updates
      const updatedRequests = await prisma.$transaction(
        events.map((event) =>
          prisma.transportRequest.update({
            where: { id: String(event._id || event.id) },
            data: {
              basicDetails: event.basicDetails,
              driverDetails: event.driverDetails,
              travelDetails: event.travelDetails,
              eventDetails: event.eventDetails,
              iqacNumber: event?.basicDetails?.iqacNumber ? String(event.basicDetails.iqacNumber) : null,
              status: typeof event.status === "string" ? event.status : null,
            },
          })
        )
      );
      return res.status(200).json({
        message: "Transport requests updated successfully",
        data: updatedRequests.map((x) => withMongoIdsDeep(withMongoId(x))),
      });
    }

    // Single Update (Fallback)
    if (id) {
      const updatedRequest = await prisma.transportRequest.update({
        where: { id: String(id) },
        data: {
          basicDetails: req.body.basicDetails,
          driverDetails: req.body.driverDetails,
          travelDetails: req.body.travelDetails,
          eventDetails: req.body.eventDetails,
          iqacNumber: req.body?.basicDetails?.iqacNumber ? String(req.body.basicDetails.iqacNumber) : null,
          status: typeof req.body.status === "string" ? req.body.status : null,
        },
      }).catch(() => null);
      if (!updatedRequest) {
        return res.status(404).json({ message: "Transport request not found" });
      }
      return res.status(200).json({
        message: "Transport request updated successfully",
        data: withMongoIdsDeep(withMongoId(updatedRequest)),
      });
    }

    return res
      .status(400)
      .json({ message: "Invalid request: No ID or events array provided" });
  } catch (error) {
    res.status(400).json({
      message: "Error updating transport request",
      error: error.message,
    });
  }
};

export const deleteTransportRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRequest = await prisma.transportRequest.delete({ where: { id: String(id) } }).catch(() => null);
    if (!deletedRequest) {
      return res.status(404).json({ message: "Transport request not found" });
    }
    res.status(200).json({ message: "Transport request deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting transport request",
      error: error.message,
    });
  }
};
