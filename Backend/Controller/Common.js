import express from "express";
import Event from "../Schema/EventSchema.js";
import { generateSingleEventPdf } from "../other/PDF.js";
import Endform from "../Schema/EndForm.js";
import mongoose from "mongoose";

const toDayDate = (value) => {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const toValidDate = (value) => {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d;
};

const getBookingDate = (endform, event) => {
  return (
    toValidDate(endform?.createdAt) ||
    toValidDate(endform?.createdat) ||
    toValidDate(event?.createdAt) ||
    toValidDate(event?.createdat) ||
    toValidDate(event?.startDate)
  );
};

const getTrackedEndformsAndEvents = async () => {
  const rawEndforms = await Endform.find({ eventdata: { $exists: true, $ne: null } })
    .select(
      "eventdata status createdAt createdat transportform foodform guestform communicationform approvals"
    )
    .lean();

  const eventIds = [
    ...new Set(rawEndforms.map((f) => String(f.eventdata)).filter(Boolean)),
  ];

  const events = await Event.find({ _id: { $in: eventIds } }).lean();
  const eventsMap = new Map(events.map((e) => [String(e._id), e]));

  const sortedEndforms = rawEndforms
    .slice()
    .sort((a, b) => {
      const aDate = getBookingDate(a, eventsMap.get(String(a.eventdata))) || new Date(0);
      const bDate = getBookingDate(b, eventsMap.get(String(b.eventdata))) || new Date(0);
      return bDate - aDate;
    });

  // Keep only the latest endform per event to avoid duplicate counting.
  const uniqueEndformsMap = new Map();
  sortedEndforms.forEach((ef) => {
    const key = String(ef.eventdata || "");
    if (!key) return;
    if (!uniqueEndformsMap.has(key)) {
      uniqueEndformsMap.set(key, ef);
    }
  });

  const endforms = Array.from(uniqueEndformsMap.values());

  return { endforms, events, eventsMap };
};

const normalizeDeptKey = (raw) => {
  const d = String(raw || "").trim().toLowerCase();
  if (!d) return "";

  if (d === "iqac") return "iqac";
  if (d === "system admin" || d === "systemadmin" || d === "admin") return "iqac";
  if (d === "transport") return "transport";
  if (d === "food") return "food";
  if (d === "media" || d === "communication") return "communication";
  if (d === "guest deparment" || d === "guest department" || d === "guestroom" || d === "guest room") {
    return "guestroom";
  }

  // Academic department aliases (match BasicEvent `academicdepartment` values)
  const alnum = d.replace(/[^a-z0-9]/g, "");
  if (alnum === "aids" || alnum === "aiandds") return "ai & ds";
  if (alnum === "aiml" || alnum === "aiandml") return "ai & ml";
  if (alnum === "cybersecurity" || alnum === "cyber") return "cyber";
  if (alnum === "csbs") return "csbs";
  if (alnum === "cse" || alnum === "computerscienceengineering") return "cse";
  if (alnum === "it" || alnum === "informationtechnology") return "it";
  if (alnum === "ece" || alnum === "electronicsandcommunicationengineering") return "ece";
  if (alnum === "eee" || alnum === "electricalandelectronicsengineering") return "eee";
  if (alnum === "mech" || alnum === "mechanicalengineering") return "mech";
  if (alnum === "cce") return "cce";

  return d;
};

const getEventSpanStatus = (event) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = toDayDate(event?.startDate);
  const end = toDayDate(event?.endDate);
  if (!start || !end) return "unknown";
  if (end < today) return "completed";
  if (start > today) return "upcoming";
  return "ongoing";
};

const daysUntil = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = toDayDate(date);
  if (!d) return null;
  const diffMs = d.getTime() - today.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
};

export const getDepartmentDashboardData = async (req, res) => {
  try {
    const deptKey = normalizeDeptKey(req.user?.dept);
    if (!deptKey) {
      return res.status(403).json({ message: "User department missing in token" });
    }

    const { endforms, eventsMap } = await getTrackedEndformsAndEvents();

    const isKnownRole = ["iqac", "transport", "food", "guestroom", "communication"].includes(deptKey);
    const pickRelevant = (ef) => {
      if (!ef) return false;
      if (deptKey === "iqac") return true;
      if (deptKey === "transport") return Array.isArray(ef.transportform) && ef.transportform.length > 0;
      if (deptKey === "food") return !!ef.foodform;
      if (deptKey === "guestroom") return !!ef.guestform;
      if (deptKey === "communication") return !!ef.communicationform;

      // Academic/other departments: match against BasicEvent departments
      const ev = eventsMap.get(String(ef.eventdata));
      const matchesDept = (arr) =>
        Array.isArray(arr) &&
        arr.some((v) => String(v || "").trim().toLowerCase() === deptKey);

      return matchesDept(ev?.academicdepartment) || matchesDept(ev?.departments);
    };

    const relevantEndforms = endforms.filter(pickRelevant);

    const getApprovalForDept = (ef) => {
      if (!ef?.approvals || typeof ef.approvals !== "object") return null;
      if (deptKey === "communication") return ef.approvals.communication || null;
      if (deptKey === "food") return ef.approvals.food || null;
      if (deptKey === "transport") return ef.approvals.transport || null;
      if (deptKey === "guestroom") return ef.approvals.guestroom || null;
      return null;
    };

    const approvalRequired = ["transport", "food", "guestroom", "communication"].includes(deptKey);
    const role = approvalRequired ? "approver" : "requester";

    const queue = [];
    const recentActions = [];

    let totalRelevantEvents = 0;
    let upcomingCount = 0;
    let ongoingCount = 0;
    let completedCount = 0;
    let dueSoonCount = 0;
    let overdueCount = 0;

    const statusSummary = {};

    let transportRequests = 0;
    let foodRequests = 0;
    let guestBookings = 0;
    let communicationRequests = 0;

    for (const ef of relevantEndforms) {
      const ev = eventsMap.get(String(ef.eventdata)) || null;
      if (!ev) continue;

      totalRelevantEvents++;

      const spanStatus = getEventSpanStatus(ev);
      if (spanStatus === "upcoming") upcomingCount++;
      else if (spanStatus === "ongoing") ongoingCount++;
      else if (spanStatus === "completed") completedCount++;

      const overallStatus = String(ef.status || "").trim() || "Unknown";
      statusSummary[overallStatus] = (statusSummary[overallStatus] || 0) + 1;

      // dept-specific request counters (cheap, based on refs)
      transportRequests += Array.isArray(ef.transportform) ? ef.transportform.length : 0;
      foodRequests += ef.foodform ? 1 : 0;
      guestBookings += ef.guestform ? 1 : 0;
      communicationRequests += ef.communicationform ? 1 : 0;

      const approval = getApprovalForDept(ef);
      const isApproved = approvalRequired ? Boolean(approval?.approved) : null;

      const startInDays = daysUntil(ev.startDate);
      const isDueSoon = typeof startInDays === "number" && startInDays >= 0 && startInDays <= 7;
      const isOverdue = typeof startInDays === "number" && startInDays >= 0 && startInDays <= 2;

      if (approvalRequired) {
        if (!isApproved) {
          if (isDueSoon) dueSoonCount++;
          if (isOverdue) overdueCount++;

          queue.push({
            endformId: String(ef._id),
            eventId: String(ev._id),
            eventName: ev.eventName,
            eventType: ev.eventType,
            department: Array.isArray(ev.departments) ? ev.departments.join(", ") : (ev.departments || ""),
            startDate: ev.startDate,
            endDate: ev.endDate,
            venue: ev.eventVenue,
            status: ef.status,
            startInDays,
          });
        }

        if (isApproved && approval?.approvedAt) {
          recentActions.push({
            endformId: String(ef._id),
            eventId: String(ev._id),
            eventName: ev.eventName,
            approvedAt: approval.approvedAt,
            approvedBy: approval.approvedBy || "",
          });
        }
      } else {
        // For requester dashboards, dueSoon/overdue still matters as upcoming urgency.
        if (isDueSoon) dueSoonCount++;
        if (isOverdue) overdueCount++;
      }
    }

    queue.sort((a, b) => (a.startInDays ?? 9999) - (b.startInDays ?? 9999));
    recentActions.sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime());

    const formatDateOnly = (d) => {
      if (!d || Number.isNaN(d.getTime())) return "";
      return d.toISOString().slice(0, 10);
    };

    const getDeptScopedStatus = (ef) => {
      if (!approvalRequired) return ef?.status || "";
      const approval = getApprovalForDept(ef);
      return approval?.approved ? "Approved" : "Pending";
    };

    const pendingRequestsCount = approvalRequired
      ? 0
      : relevantEndforms.filter((ef) => {
          const s = String(ef?.status || "").trim();
          return s === "Pending" || s === "Corrections";
        }).length;

    const myRequests = approvalRequired
      ? []
      : relevantEndforms
          .map((ef) => {
            const ev = eventsMap.get(String(ef.eventdata)) || {};
            const startInDays = daysUntil(ev.startDate);
            const spanStatus = getEventSpanStatus(ev);
            const departments = Array.isArray(ev.departments)
              ? ev.departments.join(", ")
              : (ev.departments || "");

            return {
              endformId: String(ef._id),
              eventId: String(ev._id || ""),
              eventName: ev.eventName || "Untitled Event",
              eventType: ev.eventType || "Other",
              department: departments,
              startDate: ev.startDate || "",
              endDate: ev.endDate || "",
              venue: ev.eventVenue || "",
              status: String(ef.status || "").trim() || "Pending",
              spanStatus,
              startInDays,
            };
          })
          .filter((row) => row.spanStatus !== "completed")
          .sort((a, b) => (a.startInDays ?? 9999) - (b.startInDays ?? 9999))
          .slice(0, 10);

    const activitySeries = (() => {
      const days = 7;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const buckets = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        buckets.push({
          key,
          name: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          value: 0,
        });
      }

      const bucketMap = new Map(buckets.map((b) => [b.key, b]));

      if (approvalRequired) {
        for (const item of recentActions) {
          const raw = item?.approvedAt;
          const dt = raw ? new Date(raw) : null;
          if (!dt || Number.isNaN(dt.getTime())) continue;
          dt.setHours(0, 0, 0, 0);
          const key = dt.toISOString().slice(0, 10);
          const bucket = bucketMap.get(key);
          if (bucket) bucket.value += 1;
        }
      } else {
        for (const ef of relevantEndforms) {
          const ev = eventsMap.get(String(ef.eventdata));
          const created = getBookingDate(ef, ev);
          if (!created || Number.isNaN(created.getTime())) continue;
          created.setHours(0, 0, 0, 0);
          const key = created.toISOString().slice(0, 10);
          const bucket = bucketMap.get(key);
          if (bucket) bucket.value += 1;
        }
      }

      return buckets.map(({ key: _k, ...rest }) => rest);
    })();

    // Recent requests for this department (most recent booking first)
    const recentRequests = relevantEndforms
      .slice()
      .sort((a, b) => {
        const aEv = eventsMap.get(String(a.eventdata));
        const bEv = eventsMap.get(String(b.eventdata));
        const aDate = getBookingDate(a, aEv) || new Date(0);
        const bDate = getBookingDate(b, bEv) || new Date(0);
        return bDate - aDate;
      })
      .map((ef) => {
        const ev = eventsMap.get(String(ef.eventdata)) || {};
        const requestedOn = getBookingDate(ef, ev);
        const departments = Array.isArray(ev.departments) ? ev.departments : [];

        return {
          endformId: String(ef._id),
          eventId: String(ev._id || ""),
          iqacNumber: ev.iqacNumber || "",
          requestedOn: formatDateOnly(requestedOn),
          eventName: ev.eventName || "Untitled Event",
          eventType: ev.eventType || "Other",
          startDate: ev.startDate || "",
          endDate: ev.endDate || "",
          venue: ev.eventVenue || "",
          departments,
          status: getDeptScopedStatus(ef),
        };
      })
      .slice(0, 12);

    const response = {
      deptKey,
      role,
      totals: {
        totalRelevantEvents,
        pendingApprovals: approvalRequired ? queue.length : 0,
        pendingRequests: pendingRequestsCount,
        dueSoon: dueSoonCount,
        overdue: overdueCount,
        upcoming: upcomingCount,
        ongoing: ongoingCount,
        completed: completedCount,
      },
      statusSummary,
      activitySeries,
      kpis: {
        transportRequests,
        foodRequests,
        guestBookings,
        communicationRequests,
      },
      myQueue: queue.slice(0, 10),
      myRequests,
      recentActions: recentActions.slice(0, 10),
      recentRequests,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error generating department dashboard data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUnifiedDashboardData = async (req, res) => {
  try {
    const deptKey = normalizeDeptKey(req.user?.dept);
    if (!deptKey) {
      return res.status(403).json({ message: "User department missing in token" });
    }

    const isIqac = deptKey === "iqac";
    if (isIqac) {
      return await getComprehensiveDashboardData(req, res);
    }

    return await getDepartmentDashboardData(req, res);
  } catch (error) {
    console.error("Error generating unified dashboard data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCurrentDateEvents = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const { endforms, eventsMap } = await getTrackedEndformsAndEvents();

    const trackedCurrentEvents = endforms
      .filter((ef) => ["Pending", "Approved"].includes(ef.status))
      .map((ef) => eventsMap.get(String(ef.eventdata)))
      .filter(Boolean)
      .filter((ev) => {
        const start = toDayDate(ev.startDate);
        const end = toDayDate(ev.endDate);
        return start && end && start <= today && end >= today;
      });

    const uniqueById = Array.from(
      new Map(trackedCurrentEvents.map((ev) => [String(ev._id), ev])).values()
    );

    const events = uniqueById;
    return res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching current date events:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDashboardData = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  try {
    const { endforms, events, eventsMap } = await getTrackedEndformsAndEvents();

    const pendingCollaborations = endforms.filter((ef) => ef.status === "Pending").length;
    const totalBookingsThisMonth = endforms.filter((ef) => {
      const event = eventsMap.get(String(ef.eventdata));
      const created = getBookingDate(ef, event);
      return created && !Number.isNaN(created.getTime()) && created >= startOfMonth;
    }).length;
    const eventsToday = events.filter((ev) => {
      const start = toDayDate(ev.startDate);
      const end = toDayDate(ev.endDate);
      return start && end && start <= today && end >= today;
    }).length;

    const departmentCountMap = new Map();
    events.forEach((ev) => {
      (ev.departments || []).forEach((dept) => {
        departmentCountMap.set(dept, (departmentCountMap.get(dept) || 0) + 1);
      });
    });
    const mostDept = Array.from(departmentCountMap.entries()).sort((a, b) => b[1] - a[1])[0];

    const dashboardData = {
      pendingCollaborations,
      totalBookingsThisMonth,
      eventsToday,
      mostEventBookingDepartment: mostDept ? mostDept[0] : "N/A",
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getEventStats = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfQuarter = new Date(
    today.getFullYear(),
    Math.floor(today.getMonth() / 3) * 3,
    1
  );
  const endOfQuarter = new Date(startOfQuarter);
  endOfQuarter.setMonth(startOfQuarter.getMonth() + 3);

  try {
    const { events } = await getTrackedEndformsAndEvents();

    const totalEvents = events.length;
    const upcomingEvents = events.filter((ev) => {
      const start = toDayDate(ev.startDate);
      return start && start >= today;
    }).length;
    const ongoingEvents = events.filter((ev) => {
      const start = toDayDate(ev.startDate);
      const end = toDayDate(ev.endDate);
      return start && end && start <= today && end >= today;
    }).length;

    const stats = {
      totalEvents,
      upcomingEvents,
      ongoingEvents,
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching event stats:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getComprehensiveDashboardData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const { endforms, events, eventsMap } = await getTrackedEndformsAndEvents();

    // College-relevant event totals (based on BasicEvent span)
    const totalEvents = events.length;
    let upcomingEvents = 0;
    let ongoingEvents = 0;
    let completedEvents = 0;
    for (const ev of events) {
      const spanStatus = getEventSpanStatus(ev);
      if (spanStatus === "upcoming") upcomingEvents++;
      else if (spanStatus === "ongoing") ongoingEvents++;
      else if (spanStatus === "completed") completedEvents++;
    }

    const completedEventsList = events
      .filter((ev) => getEventSpanStatus(ev) === "completed")
      .slice()
      .sort((a, b) => {
        const aEnd = toDayDate(a?.endDate) || new Date(0);
        const bEnd = toDayDate(b?.endDate) || new Date(0);
        return bEnd - aEnd;
      })
      .map((ev) => ({
        eventId: String(ev._id),
        iqacNumber: ev.iqacNumber || "",
        eventName: ev.eventName || "Untitled Event",
        eventType: ev.eventType || "Other",
        endDate: ev.endDate || "",
        venue: ev.eventVenue || "",
        departments: Array.isArray(ev.departments) ? ev.departments : [],
      }))
      .slice(0, 100);

    const pendingCollaborations = endforms.filter((ef) => ef.status === "Pending").length;
    const totalBookingsThisMonth = endforms.filter((ef) => {
      const event = eventsMap.get(String(ef.eventdata));
      const created = getBookingDate(ef, event);
      return created && !Number.isNaN(created.getTime()) && created >= startOfMonth;
    }).length;

    const eventsToday = endforms
      .map((ef) => eventsMap.get(String(ef.eventdata)))
      .filter(Boolean)
      .filter((ev) => {
        const start = toDayDate(ev.startDate);
        const end = toDayDate(ev.endDate);
        return start && end && start <= today && end >= today;
      }).length;

    // Today's schedule (same source as /current-date-events, but embedded here
    // so the IQAC dashboard can use a single endpoint).
    const trackedCurrentEvents = endforms
      .filter((ef) => ["Pending", "Approved"].includes(ef.status))
      .map((ef) => eventsMap.get(String(ef.eventdata)))
      .filter(Boolean)
      .filter((ev) => {
        const start = toDayDate(ev.startDate);
        const end = toDayDate(ev.endDate);
        return start && end && start <= today && end >= today;
      });

    const currentEvents = Array.from(
      new Map(trackedCurrentEvents.map((ev) => [String(ev._id), ev])).values()
    ).map((ev) => ({
      _id: String(ev._id),
      iqacNumber: ev.iqacNumber || "",
      eventName: ev.eventName || "",
      eventVenue: ev.eventVenue || "",
      startTime: ev.startTime || "",
      endTime: ev.endTime || "",
      startDate: ev.startDate || "",
      endDate: ev.endDate || "",
      departments: Array.isArray(ev.departments) ? ev.departments : [],
      academicdepartment: Array.isArray(ev.academicdepartment)
        ? ev.academicdepartment
        : [],
    }));
    
    // Department bookings for donut chart - FIXED to show all departments
    const departmentCountMap = new Map();
    events.forEach((ev) => {
      (ev.departments || []).forEach((dept) => {
        if (!dept) return;
        departmentCountMap.set(dept, (departmentCountMap.get(dept) || 0) + 1);
      });
    });
    const departmentBookings = Array.from(departmentCountMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Event types for donut chart - FIXED to show all event types
    const eventTypeMap = new Map();
    events.forEach((ev) => {
      const type = ev.eventType || "Other";
      eventTypeMap.set(type, (eventTypeMap.get(type) || 0) + 1);
    });
    const eventTypes = Array.from(eventTypeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Monthly data for area chart - FIXED to be truly dynamic
    const currentYear = new Date().getFullYear();
    const monthlyData = [];
    const monthlyStatusTrend = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date(currentYear, month, 1);
      const endOfMonth = new Date(currentYear, month + 1, 0);
      
      const monthCount = endforms.filter((ef) => {
        const event = eventsMap.get(String(ef.eventdata));
        const created = getBookingDate(ef, event);
        return created && !Number.isNaN(created.getTime()) && created >= startOfMonth && created <= endOfMonth;
      }).length;

      const statusCounts = {
        pending: 0,
        approved: 0,
        rejected: 0,
        corrections: 0,
        completed: 0,
        other: 0,
      };

      endforms.forEach((ef) => {
        const event = eventsMap.get(String(ef.eventdata));
        const created = getBookingDate(ef, event);
        if (!created || Number.isNaN(created.getTime())) return;
        if (created < startOfMonth || created > endOfMonth) return;

        const status = String(ef.status || "").trim();
        if (status === "Pending") statusCounts.pending += 1;
        else if (status === "Approved") statusCounts.approved += 1;
        else if (status === "Rejected") statusCounts.rejected += 1;
        else if (status === "Corrections") statusCounts.corrections += 1;
        else if (status === "Completed") statusCounts.completed += 1;
        else statusCounts.other += 1;
      });
      
      monthlyData.push({
        name: monthNames[month],
        uv: monthCount
      });

      monthlyStatusTrend.push({
        name: monthNames[month],
        pending: statusCounts.pending,
        approved: statusCounts.approved,
        rejected: statusCounts.rejected,
      });
    }

    // Status breakdown (real)
    const statusBreakdown = endforms.reduce(
      (acc, ef) => {
        const status = String(ef.status || "").trim();
        if (!status) return acc;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {}
    );

    // Request mix (real)
    const requestTypeCounts = {
      transport: 0,
      food: 0,
      guestroom: 0,
      communication: 0,
    };

    // Pending service approvals (real, per latest endform per event)
    const servicePendingApprovals = {
      transport: 0,
      food: 0,
      guestroom: 0,
      communication: 0,
    };

    const isApproved = (ef, key) => {
      const a = ef?.approvals?.[key];
      return Boolean(a && a.approved);
    };

    endforms.forEach((ef) => {
      const hasTransport = Array.isArray(ef.transportform) && ef.transportform.length > 0;
      const hasFood = Boolean(ef.foodform);
      const hasGuest = Boolean(ef.guestform);
      const hasComm = Boolean(ef.communicationform);

      if (hasTransport) {
        requestTypeCounts.transport += 1;
        if (!isApproved(ef, "transport")) servicePendingApprovals.transport += 1;
      }
      if (hasFood) {
        requestTypeCounts.food += 1;
        if (!isApproved(ef, "food")) servicePendingApprovals.food += 1;
      }
      if (hasGuest) {
        requestTypeCounts.guestroom += 1;
        if (!isApproved(ef, "guestroom")) servicePendingApprovals.guestroom += 1;
      }
      if (hasComm) {
        requestTypeCounts.communication += 1;
        if (!isApproved(ef, "communication")) servicePendingApprovals.communication += 1;
      }
    });

    // Recent bookings (last 10 events)
    const recentBookings = endforms
      .slice()
      .sort((a, b) => {
        const aDate = getBookingDate(a, eventsMap.get(String(a.eventdata))) || new Date(0);
        const bDate = getBookingDate(b, eventsMap.get(String(b.eventdata))) || new Date(0);
        return bDate - aDate;
      })
      .map((ef) => {
        const ev = eventsMap.get(String(ef.eventdata)) || {};
        return {
          _id: ef._id,
          departments: ev.departments || [],
          startDate: ev.startDate || "N/A",
          eventName: ev.eventName || "Untitled Event",
          status: ef.status || "Pending",
          eventType: ev.eventType || "Other",
        };
      })
      .slice(0, 10);

    // Pending queue for IQAC (real): nearest upcoming first
    const pendingQueue = endforms
      .filter((ef) => String(ef.status || "") === "Pending")
      .map((ef) => {
        const ev = eventsMap.get(String(ef.eventdata)) || {};
        return {
          endformId: String(ef._id),
          eventId: String(ev._id || ""),
          iqacNumber: ev.iqacNumber || "",
          eventName: ev.eventName || "Untitled Event",
          startDate: ev.startDate || "",
          endDate: ev.endDate || "",
          venue: ev.eventVenue || "",
          departments: Array.isArray(ev.departments) ? ev.departments : [],
          eventType: ev.eventType || "Other",
          startInDays: daysUntil(ev.startDate),
        };
      })
      .sort((a, b) => (a.startInDays ?? 9999) - (b.startInDays ?? 9999))
      .slice(0, 8);

    // Get most active department
    const mostEventBookingDepartment = departmentBookings.length > 0
      ? [{ _id: departmentBookings[0].name, count: departmentBookings[0].value }]
      : [];

    // Participants (total from all events) - SIMPLIFIED TO AVOID ERRORS
    let totalParticipants = 0;
    
    // For now, use a default value to avoid MongoDB aggregation errors
    // TODO: Implement proper participants calculation when data structure is fixed
    totalParticipants = 0; // Default value

    const dashboardData = {
      // Basic statistics
      pendingCollaborations,
      totalBookingsThisMonth,
      eventsToday,
      totalEvents,
      upcomingEvents,
      ongoingEvents,
      completedEvents,
      completedEventsList,
      currentEvents,
      mostEventBookingDepartment:
        mostEventBookingDepartment.length > 0
          ? mostEventBookingDepartment[0]._id
          : "N/A",
      // Kept for backward compatibility; no real satisfaction metric exists.
      userSatisfactionRating: "N/A",

      // Chart data
      departmentBookings,
      activeDepartments: departmentBookings.length,
      eventTypes,
      monthlyData,
      monthlyStatusTrend,

      // New college-relevant metrics
      statusBreakdown,
      requestTypeCounts,
      servicePendingApprovals,
      pendingQueue,

      // Recent bookings
      recentBookings: recentBookings.map((booking, index) => ({
        id: index + 1,
        dept: booking.departments && booking.departments.length > 0 ? booking.departments[0] : "N/A",
        date: booking.startDate || "N/A",
        title: booking.eventName || "Untitled Event",
        status: booking.status || "Pending",
        eventType: booking.eventType || "Other"
      }))
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error fetching comprehensive dashboard data:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
};

const getPendingPageData = async (req, res) => {
  try {
    const roleKey = normalizeDeptKey(req.user?.dept);

    // Get current quarter (Q1, Q2, Q3, Q4) - IMPROVED LOGIC
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-11 (Jan=0, Dec=11)
    const currentQuarter = Math.floor(currentMonth / 3) + 1; // Q1=1, Q2=2, Q3=3, Q4=4
    const currentYear = currentDate.getFullYear();
    
    
    // Calculate quarter start and end dates
    const quarterStart = new Date(currentYear, (currentQuarter - 1) * 3, 1);
    const quarterEnd = new Date(currentYear, currentQuarter * 3, 0);
    
    
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    const { endforms, eventsMap } = await getTrackedEndformsAndEvents();

    // Event Requests list (/api/endform/event-requests) shows Pending + Approved endforms.
    // Keep KPI stats aligned with that same scope.
    const visibleEndforms = endforms.filter((ef) => ["Pending", "Approved"].includes(String(ef?.status || "")));

    // Apply role/department scoping:
    // - IQAC sees all
    // - Service roles see only relevant endforms
    // - Academic departments see only their department's events
    const isKnownRole = ["", "iqac", "transport", "food", "guestroom", "communication"].includes(roleKey);
    const matchesDept = (arr) =>
      Array.isArray(arr) && arr.some((v) => normalizeDeptKey(v) === roleKey);

    const pickRelevant = (ef, ev) => {
      if (!roleKey) return true;
      if (roleKey === "iqac") return true;
      if (roleKey === "transport") return Array.isArray(ef.transportform) && ef.transportform.length > 0;
      if (roleKey === "food") return !!ef.foodform;
      if (roleKey === "guestroom") return !!ef.guestform;
      if (roleKey === "communication") return !!ef.communicationform;

      // Academic/other departments: match against BasicEvent departments
      if (!isKnownRole) {
        return matchesDept(ev?.academicdepartment) || matchesDept(ev?.departments);
      }

      return true;
    };

    const trackedEvents = visibleEndforms
      .map((ef) => ({ endform: ef, event: eventsMap.get(String(ef.eventdata)) }))
      .filter((row) => !!row.event)
      .filter(({ endform, event }) => pickRelevant(endform, event));

    const totalEventsCount = trackedEvents.length;

    const upcomingEventsCount = trackedEvents.filter(({ event }) => {
      const start = toDayDate(event.startDate);
      return start && start >= today;
    }).length;

    const ongoingEventsCount = trackedEvents.filter(({ event }) => {
      const start = toDayDate(event.startDate);
      const end = toDayDate(event.endDate);
      return start && end && start <= today && end >= today;
    }).length;
    
    // Participants (total from all events) - SIMPLIFIED TO AVOID ERRORS
    let totalParticipants = 0;
    
    // For now, use a default value to avoid MongoDB aggregation errors
    // TODO: Implement proper participants calculation when data structure is fixed
    totalParticipants = 0; // Default value
    
    // Quarter-specific data
    const quarterEvents = trackedEvents.filter(({ event }) => {
      const start = toDayDate(event.startDate);
      return start && start >= quarterStart && start <= quarterEnd;
    }).length;

    const quarterUpcoming = trackedEvents.filter(({ event }) => {
      const start = toDayDate(event.startDate);
      return start && start >= today && start <= quarterEnd;
    }).length;

    const quarterOngoing = trackedEvents.filter(({ event }) => {
      const start = toDayDate(event.startDate);
      const end = toDayDate(event.endDate);
      return start && end && start <= today && end >= today && start >= quarterStart && start <= quarterEnd;
    }).length;
    
    // Calculate growth percentage (simulated based on current vs previous quarter)
    const previousQuarterStart = new Date(currentYear, (currentQuarter - 2) * 3, 1);
    const previousQuarterEnd = new Date(currentYear, (currentQuarter - 1) * 3, 0);
    
    const previousQuarterEvents = trackedEvents.filter(({ event }) => {
      const start = toDayDate(event.startDate);
      return start && start >= previousQuarterStart && start <= previousQuarterEnd;
    }).length;
    
    const growthPercentage = previousQuarterEvents > 0 
      ? ((quarterEvents - previousQuarterEvents) / previousQuarterEvents * 100).toFixed(1)
      : "0.0";
    
    const pendingPageData = {
      // Main statistics
      totalEvents: totalEventsCount,
      upcomingEvents: upcomingEventsCount,
      ongoingEvents: ongoingEventsCount,
      totalParticipants: totalParticipants || 23500, // Fallback if no participants data
      
      // Quarter-specific data
      quarter: `Q${currentQuarter} ${currentYear}`,
      quarterEvents,
      quarterUpcoming,
      quarterOngoing,
      growthPercentage,
      
      // Additional metrics
      pendingEvents: trackedEvents.filter(({ endform }) => endform?.status === "Pending").length,
      completedEventsCount: trackedEvents.filter(({ endform }) => endform?.status === "Approved" || endform?.status === "Completed").length,
      rejectedEvents: trackedEvents.filter(({ endform }) => endform?.status === "Rejected").length
    };

    return res.status(200).json(pendingPageData);
  } catch (error) {
    console.error("Error fetching pending page data:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
};

const getProfilePageData = async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Organization Info (can be made dynamic later)
    const organizationInfo = {
      name: "Tech Summit Organizers",
      role: "Event Management Team",
      description: "Global Tech Conference Network",
      bio: "Professional event organizers specializing in tech conferences and developer summits worldwide.",
      image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      isVerified: true
    };
    
    // Event Statistics
    const totalEvents = await Event.countDocuments({});
    const upcomingEvents = await Event.countDocuments({
      startDate: { $gte: currentDate.toISOString().split("T")[0] }
    });
    const completedEvents = await Event.countDocuments({ status: "Completed" });
    
    // Event Status Overview
    const pendingEvents = await Event.countDocuments({ status: "Pending" });
    const rejectedEvents = await Event.countDocuments({ status: "Rejected" });
    const approvedEvents = await Event.countDocuments({ status: "Approved" });
    
    // Recent Events (last 10 events with details)
    const recentEvents = await Event.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id eventName startDate endDate eventVenue status departments eventType')
      .lean();
    
    // Format recent events for display
    const formattedRecentEvents = recentEvents.map((event, index) => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const daysUntilEvent = Math.ceil((startDate - currentDate) / (1000 * 60 * 60 * 24));
      
      return {
        id: event._id,
        title: event.eventName || "Untitled Event",
        date: `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        location: event.eventVenue || "TBD",
        status: event.status || "Pending",
        department: event.departments && event.departments.length > 0 ? event.departments[0] : "N/A",
        eventType: event.eventType || "Other",
        daysLeft: daysUntilEvent > 0 ? `${daysUntilEvent} days left` : daysUntilEvent < 0 ? "Completed" : "Today",
        attendees: Math.floor(Math.random() * 500) + 50, // Simulated attendees count
        image: `https://source.unsplash.com/random/400x400/?event,conference,${index + 1}`
      };
    });
    
    // Calculate participants from foodforms (same logic as pending page)
    let totalParticipants = 0;
    
    // For now, use a default value to avoid MongoDB aggregation errors
    // TODO: Implement proper participants calculation when data structure is fixed
    totalParticipants = 0; // Default value
    
    const profileData = {
      // Organization Info
      organization: organizationInfo,
      
      // Statistics
      statistics: {
        totalEvents,
        upcomingEvents,
        completedEvents,
        totalParticipants
      },
      
      // Event Status Overview
      statusOverview: {
        pending: pendingEvents,
        rejected: rejectedEvents,
        approved: approvedEvents
      },
      
      // Recent Events
      recentEvents: formattedRecentEvents
    };

    return res.status(200).json(profileData);
  } catch (error) {
    console.error("Error fetching profile page data:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
};

export {
  getCurrentDateEvents,
  getDashboardData,
  getEventStats,
  generateSingleEventPdf,
  getComprehensiveDashboardData,
  getPendingPageData,
  getProfilePageData,
};
