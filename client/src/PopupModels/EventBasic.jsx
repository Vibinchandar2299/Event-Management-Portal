import React from "react";

const EventBasic = ({ eventData }) => {
  console.log("=== EventBasic Debug ===");
  console.log("eventData:", eventData);
  console.log("eventData type:", typeof eventData);
  console.log("eventData keys:", eventData ? Object.keys(eventData) : "No data");
  
  const eventsArray = Array.isArray(eventData) ? eventData : [eventData];
  console.log("events data inside the EventBasic1 popup : ", eventsArray);

  const normalizeKey = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  const formatDepartment = (event) => {
    const primary = Array.isArray(event?.departments) && event.departments.length > 0
      ? event.departments
      : Array.isArray(event?.academicdepartment)
        ? event.academicdepartment
        : [];

    const seen = new Set();
    const unique = [];
    for (const item of primary) {
      const s = String(item || "").trim();
      if (!s) continue;
      const k = normalizeKey(s);
      if (seen.has(k)) continue;
      seen.add(k);
      unique.push(s);
    }
    return unique.length > 0 ? unique.join(", ") : "N/A";
  };

  return (
    <div className="space-y-3">
      <h1 className="text-base font-semibold text-slate-800">Event Basic</h1>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Department</th>
              <th className="px-3 py-2 text-left font-semibold">Event Venue</th>
              <th className="px-3 py-2 text-left font-semibold">Start Date</th>
              <th className="px-3 py-2 text-left font-semibold">End Date</th>
              <th className="px-3 py-2 text-left font-semibold">Start Time</th>
              <th className="px-3 py-2 text-left font-semibold">End Time</th>
              <th className="px-3 py-2 text-left font-semibold">Name of the Event</th>
              <th className="px-3 py-2 text-left font-semibold">Type of the Event</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {eventsArray.length > 0 ? (
              eventsArray.map((event, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-3 py-2 align-top">
                    {formatDepartment(event)}
                  </td>
                  <td className="px-3 py-2 align-top">{event.eventVenue || "N/A"}</td>
                  <td className="px-3 py-2 align-top">{event.startDate || "N/A"}</td>
                  <td className="px-3 py-2 align-top">{event.endDate || "N/A"}</td>
                  <td className="px-3 py-2 align-top">{event.startTime || "N/A"}</td>
                  <td className="px-3 py-2 align-top">{event.endTime || "N/A"}</td>
                  <td className="px-3 py-2 align-top">{event.eventName || "N/A"}</td>
                  <td className="px-3 py-2 align-top">{event.eventType || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-3 py-6 text-center text-slate-500">
                  No events available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventBasic;
