import React from "react";

const TransportRequisition = ({ transportData }) => {
  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-base font-semibold text-slate-800">Transport Requisition Form</h1>

      {Array.isArray(transportData) && transportData.length > 0 ? (
        <div className="space-y-4">
          {transportData.map((data, index) => (
            <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <h2 className="text-sm font-semibold text-slate-800">Transport Request {index + 1}</h2>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  {data.travelDetails?.vehicleType || "Vehicle N/A"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-medium text-slate-500">Event Requisitor Name</p>
                  <p className="mt-1 font-medium">{data.eventDetails?.eventName || "N/A"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-medium text-slate-500">Traveller Details</p>
                  <p className="mt-1 font-medium">{data.eventDetails?.travellerDetails || "N/A"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-medium text-slate-500">Pick up Date & Time</p>
                  <p className="mt-1 font-medium">{formatDateTime(data.travelDetails?.pickUpDateTime)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-medium text-slate-500">Drop Date & Time</p>
                  <p className="mt-1 font-medium">{formatDateTime(data.travelDetails?.dropDateTime)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-medium text-slate-500">Pick up Location</p>
                  <p className="mt-1 font-medium">{data.travelDetails?.pickUpLocation || "N/A"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-medium text-slate-500">Drop Location</p>
                  <p className="mt-1 font-medium">{data.travelDetails?.dropLocation || "N/A"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-medium text-slate-500">No. of Passengers</p>
                  <p className="mt-1 font-medium">{data.travelDetails?.numberOfPassengers || "N/A"}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-medium text-slate-500">Special Requirements</p>
                  <p className="mt-1 font-medium">{data.travelDetails?.specialRequirements || "N/A"}</p>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <p className="text-xs font-medium text-slate-500">Driver Information</p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <p><span className="font-medium">Name:</span> {data.driverDetails?.name || "N/A"}</p>
                  <p><span className="font-medium">Mobile No.:</span> {data.driverDetails?.mobileNumber || "N/A"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No transport details available
        </div>
      )}
    </div>
  );
};

export default TransportRequisition;
