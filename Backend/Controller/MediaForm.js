import prisma from "../db/prisma.js";
import { withMongoId, withMongoIdsDeep } from "../db/mongoLike.js";

export const createRequirement = async (req, res) => {
  console.log("req body of the Media form:", req.body);
  try {
    const {
      eventPoster = [],
      videos = [],
      onStageRequirements = [],
      receptionTVStreamingRequirements = [],
      communication = [],
      flexBanners = [],
      cameraAction = { photography: false, videography: false }
    } = req.body;

    const requirement = await prisma.mediaRequirement.create({
      data: {
        eventPoster: Array.isArray(eventPoster) ? eventPoster.map(String) : [],
        videos: Array.isArray(videos) ? videos.map(String) : [],
        onStageRequirements: Array.isArray(onStageRequirements) ? onStageRequirements.map(String) : [],
        receptionTVStreamingRequirements: Array.isArray(receptionTVStreamingRequirements)
          ? receptionTVStreamingRequirements.map(String)
          : [],
        communication: Array.isArray(communication) ? communication.map(String) : [],
        flexBanners: Array.isArray(flexBanners) ? flexBanners.map(String) : [],
        cameraAction: cameraAction || null,
        status: typeof req.body?.status === "string" ? req.body.status : null,
      },
    });

    res.status(201).json({ message: "Requirement created successfully", requirement: withMongoIdsDeep(withMongoId(requirement)) });
  } catch (error) {
    console.error("Error creating requirement:", error);
    res.status(500).json({ message: "Error creating requirement", error: error.message });
  }
};

export const getRequirements = async (req, res) => {
  try {
    const requirements = await prisma.mediaRequirement.findMany({ orderBy: { createdAt: "desc" } });
    res.status(200).json(requirements.map((r) => withMongoIdsDeep(withMongoId(r))));
  } catch (error) {
    res.status(500).json({ message: "Error fetching requirements", error });
  }
};

export const getRequirementById = async (req, res) => {
  try {
    const requirement = await prisma.mediaRequirement.findUnique({ where: { id: String(req.params.id) } });
    if (!requirement)
      return res.status(404).json({ message: "Requirement not found" });
    res.status(200).json(withMongoIdsDeep(withMongoId(requirement)));
  } catch (error) {
    res.status(500).json({ message: "Error fetching requirement", error });
  }
};

// Update a requirement
export const updateRequirement = async (req, res) => {
  try {
    const {
      eventPoster,
      videos,
      onStageRequirements,
      receptionTVStreamingRequirements,
      communication,
      flexBanners,
      cameraAction,
    } = req.body;

    const updatedRequirement = await prisma.mediaRequirement.update({
      where: { id: String(req.params.id) },
      data: {
        ...(eventPoster ? { eventPoster: Array.isArray(eventPoster) ? eventPoster.map(String) : [] } : {}),
        ...(videos ? { videos: Array.isArray(videos) ? videos.map(String) : [] } : {}),
        ...(onStageRequirements ? { onStageRequirements: Array.isArray(onStageRequirements) ? onStageRequirements.map(String) : [] } : {}),
        ...(receptionTVStreamingRequirements
          ? { receptionTVStreamingRequirements: Array.isArray(receptionTVStreamingRequirements) ? receptionTVStreamingRequirements.map(String) : [] }
          : {}),
        ...(communication ? { communication: Array.isArray(communication) ? communication.map(String) : [] } : {}),
        ...(flexBanners ? { flexBanners: Array.isArray(flexBanners) ? flexBanners.map(String) : [] } : {}),
        ...(cameraAction ? { cameraAction: cameraAction || null } : {}),
        ...(typeof req.body?.status === "string" ? { status: req.body.status } : {}),
      },
    }).catch(() => null);

    if (!updatedRequirement)
      return res.status(404).json({ message: "Requirement not found" });
    res.status(200).json({
      message: "Requirement updated successfully",
      updatedRequirement: withMongoIdsDeep(withMongoId(updatedRequirement)),
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating requirement", error });
  }
};

export const deleteRequirement = async (req, res) => {
  try {
    const deletedRequirement = await prisma.mediaRequirement.delete({ where: { id: String(req.params.id) } }).catch(() => null);
    if (!deletedRequirement)
      return res.status(404).json({ message: "Requirement not found" });
    res.status(200).json({ message: "Requirement deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting requirement", error });
  }
};
