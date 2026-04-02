import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  Grid3X3,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import EndPopup from "../PopupModels/EndPopup";

const CalenderUI = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const userDept = (localStorage.getItem("user_dept") || "").toLowerCase();

  const toStartOfDay = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const isChipCompleted = (chip) => {
    const status = String(chip?.endformStatus || chip?.basicEvent?.status || "")
      .trim()
      .toLowerCase();
    if (status === "completed") return true;

    const end = toStartOfDay(chip?.basicEvent?.endDate);
    if (!end) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return end < today;
  };

  const getChipColorClasses = (chip) =>
    isChipCompleted(chip) ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-700";

  useEffect(() => {
    const controller = new AbortController();

    const fetchEvents = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const res = await axios.get("/api/endform/allpending", {
          headers,
          signal: controller.signal,
        });

        const data = res?.data;
        const list = Array.isArray(data) ? data : data?.events || [];

        const hasId = (v) => {
          if (!v) return false;
          if (typeof v === "string") return v.trim().length > 0;
          return !!v?._id;
        };

        const eventsList = (Array.isArray(list) ? list : []).map((endform) => {
          const basic = endform?.basicEvent || {};

          const transportDocs = Array.isArray(endform?.transport)
            ? endform.transport.filter(Boolean)
            : [];

          const foodDoc = hasId(endform?.foodform) ? endform.foodform : null;
          const guestDoc = hasId(endform?.guestform) ? endform.guestform : null;
          const commDoc = hasId(endform?.communicationform)
            ? endform.communicationform
            : null;

          return {
            // Calendar event id (endform id)
            _id: endform?._id,
            endformStatus: endform?.status,
            // Basic event id (used to fetch populated endform via /api/endform/event/:id)
            basicEventId: basic?._id || endform?.eventdata,

            basicEvent: basic,

            eventName: basic?.eventName,
            startDate: basic?.startDate,
            endDate: basic?.endDate,
            departments: basic?.departments,
            academicdepartment: basic?.academicdepartment,

            // Attached forms (source of truth)
            transport: transportDocs,
            foodform: foodDoc,
            guestroom: guestDoc,
            communicationform: commDoc,
          };
        });

        setEvents(eventsList);
      } catch (err) {
        // Ignore abort errors
        if (controller.signal.aborted) return;

        console.error("Failed to load calendar events:", err);
        setLoadError("Failed to load events");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    fetchEvents();
    return () => controller.abort();
  }, [userDept]);

  const visibleEvents = useMemo(() => {
    if (!userDept || userDept === "iqac") return events;

    if (userDept === "transport") {
      return events.filter((e) => Array.isArray(e?.transport) && e.transport.length > 0);
    }

    if (userDept === "food") {
      return events.filter((e) => !!e?.foodform);
    }

    if (userDept === "guestroom") {
      return events.filter((e) => !!e?.guestroom);
    }

    if (userDept === "communication") {
      return events.filter((e) => !!e?.communicationform);
    }

    // Fallback for other departments: show only events tagged for that department.
    const matchesDept = (arr) =>
      Array.isArray(arr) &&
      arr.some((v) => String(v || "").trim().toLowerCase() === userDept);

    return events.filter((e) => matchesDept(e?.academicdepartment) || matchesDept(e?.departments));
  }, [events, userDept]);

  const chipsByDayKey = useMemo(() => {
    const map = new Map();

    const allowedTypes = (() => {
      if (!userDept || userDept === "iqac") return ["event", "transport", "food", "guestroom", "communication"];
      if (userDept === "transport") return ["transport"];
      if (userDept === "food") return ["food"];
      if (userDept === "guestroom") return ["guestroom"];
      if (userDept === "communication") return ["communication"];
      // Unknown department: keep existing behavior (show all chips within their visible events)
      return ["event", "transport", "food", "guestroom", "communication"];
    })();

    const toKey = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const parseAsDate = (value) => {
      if (!value) return null;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const normalizeSpan = (startRaw, endRaw) => {
      const start = parseAsDate(startRaw);
      const end = parseAsDate(endRaw ?? startRaw);
      if (!start || !end) return null;
      if (end < start) return { startDate: end, endDate: start };
      return { startDate: start, endDate: end };
    };

    const addChipToDay = (dayKey, chip) => {
      const existing = map.get(dayKey);
      if (!existing) {
        map.set(dayKey, [chip]);
        return;
      }
      if (!existing.some((c) => c.key === chip.key)) existing.push(chip);
    };

    const addChipForSpan = (span, chip) => {
      const startDate = parseAsDate(span?.startDate);
      const endDate = parseAsDate(span?.endDate);
      if (!startDate || !endDate) return;
      if (endDate < startDate) return;

      // Only mark start & end dates (no in-between days)
      addChipToDay(toKey(startDate), chip);
      addChipToDay(toKey(endDate), chip);
    };

    for (const evt of visibleEvents) {
      const basic = evt?.basicEvent || {};
      const eventName = basic?.eventName || evt?.eventName || "";
      const endformStatus = evt?.endformStatus;

      if (allowedTypes.includes("event")) {
        const basicId = basic?._id || evt?.basicEventId || evt?._id;
        const startDate = parseAsDate(basic?.startDate || evt?.startDate);
        const endDate = parseAsDate(basic?.endDate || evt?.endDate || basic?.startDate || evt?.startDate);

        if (basicId && startDate) {
          if (endDate && endDate.getTime() !== startDate.getTime()) {
            addChipToDay(toKey(startDate), {
              key: `event-start:${basicId}`,
              typeKey: "event",
              label: "Event Start",
              eventName,
              basicEvent: basic,
              endformStatus,
            });

            addChipToDay(toKey(endDate), {
              key: `event-end:${basicId}`,
              typeKey: "event",
              label: "Event End",
              eventName,
              basicEvent: basic,
              endformStatus,
            });
          } else {
            addChipToDay(toKey(startDate), {
              key: `event:${basicId}`,
              typeKey: "event",
              label: "Event",
              eventName,
              basicEvent: basic,
              endformStatus,
            });
          }
        }
      }

      if (allowedTypes.includes("transport")) {
        const transportDocs = Array.isArray(evt?.transport) ? evt.transport : [];
        transportDocs.forEach((doc) => {
          const id = doc?._id;
          if (!id) return;

          const span = normalizeSpan(
            doc?.travelDetails?.pickUpDateTime || doc?.travelDetails?.dropDateTime,
            doc?.travelDetails?.dropDateTime || doc?.travelDetails?.pickUpDateTime
          );
          if (!span) return;

          const chip = {
            key: `transport:${id}`,
            typeKey: "transport",
            label: "Transport",
            eventName,
            basicEvent: basic,
            endformStatus,
            transportDoc: doc,
          };

          addChipForSpan(span, chip);
        });
      }

      if (allowedTypes.includes("food") && evt?.foodform?._id) {
        const id = evt.foodform._id;
        const dates = Array.isArray(evt?.foodform?.dates) ? evt.foodform.dates : [];
        const chip = {
          key: `food:${id}`,
          typeKey: "food",
          label: "Food",
          eventName,
          basicEvent: basic,
          endformStatus,
          foodDoc: evt.foodform,
        };

        if (dates.length > 0) {
          dates.forEach((entry) => {
            const span = normalizeSpan(entry?.date?.start ?? entry?.date, entry?.date?.end ?? entry?.date?.start ?? entry?.date);
            if (span) addChipForSpan(span, chip);
          });
        }
      }

      if (allowedTypes.includes("guestroom") && evt?.guestroom?._id) {
        const id = evt.guestroom._id;
        const span = normalizeSpan(evt?.guestroom?.date, evt?.guestroom?.date);
        if (span) {
          const chip = {
            key: `guestroom:${id}`,
            typeKey: "guestroom",
            label: "Guest Room",
            eventName,
            basicEvent: basic,
            endformStatus,
            guestDoc: evt.guestroom,
          };
          addChipForSpan(span, chip);
        }
      }

      if (allowedTypes.includes("communication") && evt?.communicationform?._id) {
        const id = evt.communicationform._id;
        const span = normalizeSpan(basic?.startDate || evt?.startDate, basic?.endDate || evt?.endDate || basic?.startDate || evt?.startDate);
        if (span) {
          const chip = {
            key: `communication:${id}`,
            typeKey: "communication",
            label: "Communication",
            eventName,
            basicEvent: basic,
            endformStatus,
            communicationDoc: evt.communicationform,
          };
          addChipForSpan(span, chip);
        }
      }
    }

    return map;
  }, [visibleEvents, userDept]);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const navigatePeriod = (direction) => {
    const delta = direction === "next" ? 1 : -1;

    if (viewMode === "week") {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + delta * 7);
      setCurrentDate(next);
      return;
    }

    // month + list behave like month navigation
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + delta,
        1
      )
    );
  };

  const toDateKey = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatListDate = (dateObj) => {
    try {
      return dateObj.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(dateObj);
    }
  };

  const getDayBoxClassForDate = (dateObj) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(dateObj);
    d.setHours(0, 0, 0, 0);
    const isToday = d.getTime() === today.getTime();

    return `relative h-32 bg-white border-b border-r p-2 transition-colors ${
      isToday ? "bg-blue-50" : ""
    } hover:bg-gray-50 cursor-pointer`;
  };

  const getDayClass = (dayNum) => {
    const isToday =
      new Date().getDate() === dayNum &&
      new Date().getMonth() === currentDate.getMonth() &&
      new Date().getFullYear() === currentDate.getFullYear();

    return `relative h-32 bg-white border-b border-r p-2 transition-colors ${
      isToday ? "bg-blue-50" : ""
    } hover:bg-gray-50 cursor-pointer`;
  };

  const handleOpenChip = (chip) => {
    if (!chip) return;

    const payload = {
      basicEvent: chip.basicEvent || {},
    };

    if (chip.typeKey === "event") {
      // Basic event details only
    } else if (chip.typeKey === "transport") {
      payload.transport = chip.transportDoc ? [chip.transportDoc] : [];
    } else if (chip.typeKey === "food") {
      payload.foodform = chip.foodDoc || null;
    } else if (chip.typeKey === "guestroom") {
      payload.guestform = chip.guestDoc || {};
    } else if (chip.typeKey === "communication") {
      payload.communicationform = chip.communicationDoc || {};
    }

    setSelectedEvent(payload);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedEvent(null);
  };

  const getChipText = (chip) => {
    const name = chip?.eventName || "";
    const label = chip?.label || "";
    if (!label) return name;
    if (!name) return label;
    return `${label}: ${name}`;
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = firstDayOfMonth + daysInMonth;
    const weeks = Math.ceil(totalDays / 7);

    for (let i = 0; i < weeks * 7; i++) {
      const dayNum = i - firstDayOfMonth + 1;
      const isValidDay = dayNum > 0 && dayNum <= daysInMonth;

      const dayKey = isValidDay
        ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
        : "";
      const chipsForDay = isValidDay ? chipsByDayKey.get(dayKey) || [] : [];

      days.push(
        <div key={i} className={getDayClass(dayNum)}>
          {isValidDay && (
            <>
              <span className="absolute top-2  text-sm text-gray-500">
                {dayNum}
              </span>
              <div className="mt-6 max-h-[5.5rem] overflow-y-auto pr-1">
                {chipsForDay.map((chip) => (
                  <div
                    key={chip.key}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenChip(chip);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenChip(chip);
                      }
                    }}
                    title={getChipText(chip)}
                    className={`${getChipColorClasses(chip)} text-xs px-2 py-1 rounded mb-1 truncate`}
                  >
                    {getChipText(chip)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }
    return days;
  };

  const renderWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(startOfWeek);
      dateObj.setDate(startOfWeek.getDate() + i);
      const dayKey = toDateKey(dateObj);
      const chipsForDay = chipsByDayKey.get(dayKey) || [];

      days.push(
        <div key={dayKey} className={getDayBoxClassForDate(dateObj)}>
          <span className="absolute top-2 text-sm text-gray-500">
            {dateObj.getDate()}
          </span>
          <div className="mt-6 max-h-[5.5rem] overflow-y-auto pr-1">
            {chipsForDay.map((chip) => (
              <div
                key={chip.key}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenChip(chip);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenChip(chip);
                  }
                }}
                title={getChipText(chip)}
                className={`${getChipColorClasses(chip)} text-xs px-2 py-1 rounded mb-1 truncate`}
              >
                {getChipText(chip)}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderListView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    monthStart.setHours(0, 0, 0, 0);
    monthEnd.setHours(0, 0, 0, 0);

    const rows = [];
    const cursor = new Date(monthStart);

    while (cursor <= monthEnd) {
      const dayKey = toDateKey(cursor);
      const chipsForDay = chipsByDayKey.get(dayKey) || [];
      if (chipsForDay.length > 0) {
        rows.push(
          <div key={dayKey} className="border-b border-slate-200 py-3">
            <div className="text-sm font-semibold text-slate-700">
              {formatListDate(cursor)}
            </div>
            <div className="mt-2 space-y-1">
              {chipsForDay.map((chip) => (
                <div
                  key={chip.key}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenChip(chip);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleOpenChip(chip);
                    }
                  }}
                  title={getChipText(chip)}
                  className={`${getChipColorClasses(chip)} text-xs px-2 py-1 rounded truncate`}
                >
                  {getChipText(chip)}
                </div>
              ))}
            </div>
          </div>
        );
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (rows.length === 0) {
      return (
        <div className="px-6 py-8 text-sm text-slate-500">No requests in this month.</div>
      );
    }

    return <div className="px-6">{rows}</div>;
  };

  return (
    <div className=" ">
      <div className=" ml-20 px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigatePeriod("prev")}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {currentDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <button
                  onClick={() => navigatePeriod("next")}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>

                {isLoading && (
                  <span className="text-sm text-gray-500">Loading…</span>
                )}
                {!isLoading && loadError && (
                  <span className="text-sm text-red-600">{loadError}</span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode("month")}
                  className={`p-2 rounded ${
                    viewMode === "month"
                      ? "bg-blue-100 text-blue-600"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`p-2 rounded ${
                    viewMode === "week"
                      ? "bg-blue-100 text-blue-600"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <CalendarDays className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${
                    viewMode === "list"
                      ? "bg-blue-100 text-blue-600"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {viewMode !== "list" && (
            <div className="flex flex-col flex-1 mt-4">
              <div className="grid grid-cols-7 bg-gray-50">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-sm font-semibold text-gray-600 border-b border-r"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 flex-1">
                {viewMode === "week" ? renderWeekDays() : renderCalendarDays()}
              </div>
            </div>
          )}

          {viewMode === "list" && (
            <div className="mt-2 max-h-[70vh] overflow-y-auto">
              {renderListView()}
            </div>
          )}
        </div>
      </div>

      {isPopupOpen && selectedEvent && (
        <EndPopup event={selectedEvent} onClose={closePopup} isOpen={isPopupOpen} />
      )}
    </div>
  );
};

export default CalenderUI;
