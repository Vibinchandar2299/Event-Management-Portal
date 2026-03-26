import React from "react";

const AmenitiesForm = ({ foodFormData }) => {
  // Ensure foodFormData exists and has the correct structure
  if (!foodFormData || !foodFormData.dates) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No food details available</p>
      </div>
    );
  }

  // Extract dates and food details - handle both array and object formats
  let dates = foodFormData.dates || [];
  
  // If dates is an object, convert it to array format
  if (typeof dates === 'object' && !Array.isArray(dates)) {
    dates = Object.entries(dates).map(([dateKey, dateValue]) => ({
      date: dateKey,
      foodDetails: foodFormData.foodDetails?.[dateKey] || {}
    }));
  }

  // Get all food details
  const foodDetails = dates.map(date => date.foodDetails || {});

  // Extract unique meal types
  const mealTypes = foodDetails.reduce((acc, details) => {
    if (!details) return acc;
    Object.keys(details).forEach(meal => {
      if (!acc.includes(meal)) acc.push(meal);
    });
    return acc;
  }, []);

  // Extract extra info
  const requestorName = foodFormData.requestorName || '';
  const department = foodFormData.department || foodFormData["department/centre"] || '';
  const startDate = foodFormData.startDate || '';
  const endDate = foodFormData.endDate || '';

  return (
    <div className="space-y-4">
      <h1 className="text-base font-semibold text-slate-800">Amenities Form</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {requestorName && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <span className="font-semibold">Requestor Name:</span> {requestorName}
          </div>
        )}
        {department && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <span className="font-semibold">Department/Centre:</span> {department}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              {dates.map((date, idx) => (
                <React.Fragment key={idx}>
                  <th className="px-3 py-2 text-left font-semibold">Start Date</th>
                  <th className="px-3 py-2 text-left font-semibold">End Date</th>
                  <th className="px-3 py-2 text-left font-semibold">Participants Veg</th>
                  <th className="px-3 py-2 text-left font-semibold">Participants NonVeg</th>
                  <th className="px-3 py-2 text-left font-semibold">Guest/VIP Veg</th>
                  <th className="px-3 py-2 text-left font-semibold">Guest/VIP NonVeg</th>
                </React.Fragment>
              ))}
            </tr>
            <tr className="bg-slate-50 text-slate-600">
              <th className="px-3 py-2 text-left"></th>
              {dates.map((date, idx) => (
                <React.Fragment key={idx}>
                  <th className="px-3 py-2 text-left">
                    {date.date && typeof date.date === 'object' && date.date.start
                      ? new Date(date.date.start).toLocaleDateString()
                      : (typeof date.date === 'string' && date.date ? new Date(date.date).toLocaleDateString() : '-')}
                  </th>
                  <th className="px-3 py-2 text-left">
                    {date.date && typeof date.date === 'object' && date.date.end
                      ? new Date(date.date.end).toLocaleDateString()
                      : (typeof date.date === 'string' && date.date ? new Date(date.date).toLocaleDateString() : '-')}
                  </th>
                  <th colSpan={4}></th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {mealTypes.length > 0 ? (
              mealTypes.map((mealType) => (
                <tr key={mealType}>
                  <td className="px-3 py-2 font-medium">{mealType}</td>
                  {dates.map((date, idx) => {
                    const dateFoodDetails = foodDetails[idx]?.[mealType] || {};
                    return (
                      <React.Fragment key={idx}>
                        <td colSpan={2}></td>
                        <td className="px-3 py-2">{dateFoodDetails.participants?.Veg || "0"}</td>
                        <td className="px-3 py-2">{dateFoodDetails.participants?.NonVeg || "0"}</td>
                        <td className="px-3 py-2">{dateFoodDetails.guest?.Veg || "0"}</td>
                        <td className="px-3 py-2">{dateFoodDetails.guest?.NonVeg || "0"}</td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={dates.length > 0 ? dates.length * 6 + 1 : 7} className="px-3 py-6 text-center text-slate-500">
                  No Food Details Available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AmenitiesForm;
