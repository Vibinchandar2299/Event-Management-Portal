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

  useEffect(() => {
    const controller = new AbortController();

    const fetchEvents = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/event", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: controller.signal,
        });

        const data = res?.data;
        const list = Array.isArray(data) ? data : data?.events || [];
        setEvents(Array.isArray(list) ? list : []);
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
  }, []);

  const eventsByDayKey = useMemo(() => {
    const map = new Map();

    const toKey = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const addEventToDay = (dayKey, evt) => {
      const existing = map.get(dayKey);
      if (existing) existing.push(evt);
      else map.set(dayKey, [evt]);
    };

    for (const evt of events) {
      const start = evt?.startDate;
      const end = evt?.endDate || evt?.startDate;
      if (!start) continue;

      const startDate = new Date(start);
      const endDate = new Date(end);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) continue;

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < startDate) continue;

      // Add the event to each day it spans
      const cursor = new Date(startDate);
      while (cursor <= endDate) {
        addEventToDay(toKey(cursor), evt);
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return map;
  }, [events]);

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

  const navigateMonth = (direction) => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + (direction === "next" ? 1 : -1),
        1
      )
    );
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

  const handleOpenEvent = async (eventId) => {
    if (!eventId) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/event/${eventId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      setSelectedEvent(res?.data || null);
      setIsPopupOpen(true);
    } catch (err) {
      console.error("Failed to load event details:", err);
      toast.error("Failed to load event details");
    }
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedEvent(null);
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
      const eventsForDay = isValidDay ? eventsByDayKey.get(dayKey) || [] : [];

      days.push(
        <div key={i} className={getDayClass(dayNum)}>
          {isValidDay && (
            <>
              <span className="absolute top-2  text-sm text-gray-500">
                {dayNum}
              </span>
              <div className="mt-6">
                {eventsForDay.map((event) => (
                  <div
                    key={event._id || event.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEvent(event._id || event.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenEvent(event._id || event.id);
                      }
                    }}
                    title={event.eventName || event.name || ""}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mb-1 truncate"
                  >
                    {event.eventName || event.name}
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

  return (
    <div className=" ">
      <div className=" ml-20 px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateMonth("prev")}
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
                  onClick={() => navigateMonth("next")}
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
              {renderCalendarDays()}
            </div>
          </div>
        </div>
      </div>

      {isPopupOpen && selectedEvent && (
        <EndPopup event={selectedEvent} onClose={closePopup} isOpen={isPopupOpen} />
      )}
    </div>
  );
};

export default CalenderUI;
