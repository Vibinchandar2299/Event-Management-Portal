import React from "react";

const EventBasic2 = ({ eventData }) => {
  console.log("=== EventBasic2 Debug ===");
  console.log("eventData:", eventData);
  console.log("eventData type:", typeof eventData);
  console.log("eventData keys:", eventData ? Object.keys(eventData) : "No data");
  console.log("organizers:", eventData?.organizers);
  console.log("resourcePersons:", eventData?.resourcePersons);
  console.log("iqacNumber:", eventData?.iqacNumber);
  
  // Helper function to safely join arrays
  const safeJoin = (data, separator = ", ") => {
    if (!data) return "N/A";
    if (Array.isArray(data)) {
      return data.length > 0 ? data.join(separator) : "N/A";
    }
    // If it's a string, return it directly
    if (typeof data === 'string') {
      return data || "N/A";
    }
    // If it's an object, try to convert to string
    if (typeof data === 'object') {
      return JSON.stringify(data) || "N/A";
    }
    return "N/A";
  };

  // Helper function to safely check if data is an array
  const safeArray = (data) => {
    return Array.isArray(data) ? data : [];
  };
  
  return (
    <div className="space-y-4">
      <h1 className="text-base font-semibold text-slate-800">Event Basic 2</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Year</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{eventData?.year || "N/A"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">IQAC Number</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{eventData?.iqacNumber || "N/A"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Status</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{eventData?.status || "N/A"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Organizers</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-2 py-2 text-left">Employee ID</th>
                  <th className="px-2 py-2 text-left">Name</th>
                  <th className="px-2 py-2 text-left">Designation</th>
                  <th className="px-2 py-2 text-left">Phone No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {safeArray(eventData?.organizers).length > 0 ? (
                  safeArray(eventData?.organizers).map((organizer, index) => (
                    <tr key={index}>
                      <td className="px-2 py-2">{organizer.employeeId || organizer.employeeid || "N/A"}</td>
                      <td className="px-2 py-2">{organizer.name || "N/A"}</td>
                      <td className="px-2 py-2">{organizer.designation || "N/A"}</td>
                      <td className="px-2 py-2">{organizer.phone || "N/A"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-2 py-4 text-center text-slate-500">No organizers added</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Resource Persons</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-2 py-2 text-left">Name</th>
                  <th className="px-2 py-2 text-left">Affiliation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {safeArray(eventData?.resourcePersons).length > 0 ? (
                  safeArray(eventData?.resourcePersons).map((person, index) => (
                    <tr key={index}>
                      <td className="px-2 py-2">{person.name || "N/A"}</td>
                      <td className="px-2 py-2">{person.affiliation || "N/A"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="px-2 py-4 text-center text-slate-500">No resource persons added</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Categories</p>
          <p className="mt-1 text-sm text-slate-700">{safeJoin(eventData?.categories)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Professional Societies</p>
          <p className="mt-1 text-sm text-slate-700">{safeJoin(eventData?.professional)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Departments</p>
          <p className="mt-1 text-sm text-slate-700">{safeJoin(eventData?.departments)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-500">Logo</p>
          <p className="mt-1 text-sm text-slate-700">{safeJoin(eventData?.logos)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-medium text-slate-500">Description</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{eventData?.description || "N/A"}</p>
      </div>
    </div>
  );
};

export default EventBasic2;
