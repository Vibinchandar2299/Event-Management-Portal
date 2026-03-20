import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  Grid3X3,
} from "lucide-react";

const CalenderUI = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");

  const sampleEvents = [
    { id: 1, name: "Team Meeting", startDate: "2025-01-25", endDate: "2025-01-26" },
    { id: 2, name: "Project Demo", startDate: "2025-01-27", endDate: "2025-01-28" },
    { id: 3, name: "Hackathon", startDate: "2025-01-29", endDate: "2025-02-01" },
  ];

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

  const isDateInRange = (date, startDate, endDate) => {
    const current = new Date(date).setHours(0, 0, 0, 0);
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(0, 0, 0, 0);
    return current >= start && current <= end;
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = firstDayOfMonth + daysInMonth;
    const weeks = Math.ceil(totalDays / 7);

    for (let i = 0; i < weeks * 7; i++) {
      const dayNum = i - firstDayOfMonth + 1;
      const isValidDay = dayNum > 0 && dayNum <= daysInMonth;

      const eventsForDay = sampleEvents.filter(
        (event) =>
          isValidDay &&
          isDateInRange(
            new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum),
            event.startDate,
            event.endDate
          )
      );

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
                    key={event.id}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mb-1"
                  >
                    {event.name}
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
    </div>
  );
};

export default CalenderUI;
