import React from "react";

const Guestroom = ({ guestroomData }) => {
  if (!guestroomData || Object.keys(guestroomData).length === 0) {
    return (
      <div className="text-gray-500 italic">
        No guest room booking details available
      </div>
    );
  }

  const date = new Date(guestroomData.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const roomLabels = {
    suite1: "Suite Room 1",
    suite2: "Suite Room 2",
    suite3: "Suite Room 3",
    mainBlock3: "Main Block III Floor",
    mainBlock2: "Main Block II Floor",
    girlsHostel: "Girls Hostel",
    eBlock: "E - Block",
    cBlock: "C - Block",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Department/Centre</h4>
          <p className="mt-1 text-sm font-medium text-slate-700">{guestroomData.department || "N/A"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requestor Name</h4>
          <p className="mt-1 text-sm font-medium text-slate-700">{guestroomData.requestorName || "N/A"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Employee ID</h4>
          <p className="mt-1 text-sm font-medium text-slate-700">{guestroomData.empId || "N/A"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile Number</h4>
          <p className="mt-1 text-sm font-medium text-slate-700">{guestroomData.mobile || "N/A"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Designation</h4>
          <p className="mt-1 text-sm font-medium text-slate-700">{guestroomData.designation || "N/A"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date</h4>
          <p className="mt-1 text-sm font-medium text-slate-700">{formattedDate}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Number of Guests</h4>
          <p className="mt-1 text-sm font-medium text-slate-700">{guestroomData.guestCount || "N/A"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Number of Days</h4>
          <p className="mt-1 text-sm font-medium text-slate-700">{guestroomData.stayDays ?? "N/A"}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purpose</h4>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{guestroomData.purpose || "N/A"}</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Rooms</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {guestroomData.selectedRooms && guestroomData.selectedRooms.length > 0 ? (
            guestroomData.selectedRooms.map((roomId, index) => (
              <div key={index} className="rounded-md border border-slate-200 bg-white p-2 text-sm font-medium text-slate-700">
                {roomLabels[roomId] || roomId}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 italic">No rooms selected</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Guestroom;
