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

  const rootFoodDetails =
    foodFormData.foodDetails && typeof foodFormData.foodDetails === "object"
      ? foodFormData.foodDetails
      : {};

  // Extract dates and food details - handle both array and object formats
  let dates = foodFormData.dates || [];

  // If dates is an object, convert it to array format
  if (typeof dates === "object" && !Array.isArray(dates)) {
    dates = Object.entries(dates).map(([dateKey, dateValue]) => ({
      date: dateValue?.date || dateKey,
      foodDetails: dateValue?.foodDetails || rootFoodDetails[dateKey] || {},
    }));
  }

  // Fallback: if no usable dates, derive from root foodDetails keys
  if ((!Array.isArray(dates) || dates.length === 0) && Object.keys(rootFoodDetails).length > 0) {
    dates = Object.entries(rootFoodDetails).map(([dateKey, details]) => ({
      date: dateKey,
      foodDetails: details || {},
    }));
  }

  const getDateKey = (dateEntry) => {
    if (!dateEntry) return "";
    if (typeof dateEntry.date === "string") return dateEntry.date;
    if (dateEntry.date && typeof dateEntry.date === "object") {
      return dateEntry.date.start || dateEntry.date.end || "";
    }
    return "";
  };

  // Get all food details with fallback to root foodDetails by date key
  const foodDetails = dates.map((dateEntry) => {
    if (dateEntry?.foodDetails && Object.keys(dateEntry.foodDetails).length > 0) {
      return dateEntry.foodDetails;
    }
    const dateKey = getDateKey(dateEntry);
    return rootFoodDetails[dateKey] || {};
  });

  // Extract unique meal types
  const mealTypes = foodDetails.reduce((acc, details) => {
    if (!details) return acc;
    Object.keys(details).forEach((meal) => {
      if (meal === "_id" || meal === "id" || meal === "__v") return;
      const normalizedMeal =
        meal === "Morning Refreshment"
          ? "MorningRefreshment"
          : meal === "Evening Refreshment"
          ? "EveningRefreshment"
          : meal;
      if (!acc.includes(normalizedMeal)) acc.push(normalizedMeal);
    });
    return acc;
  }, []);

  const getMealData = (dateFoodDetails, mealType) => {
    if (!dateFoodDetails) return {};
    const aliases = {
      MorningRefreshment: ["MorningRefreshment", "Morning Refreshment"],
      EveningRefreshment: ["EveningRefreshment", "Evening Refreshment"],
    };
    const candidates = aliases[mealType] || [mealType];
    for (const key of candidates) {
      if (dateFoodDetails[key]) return dateFoodDetails[key];
    }
    return {};
  };

  // Extract extra info
  const requestorName = foodFormData.requestorName || '';
  const department = foodFormData.department || foodFormData["department/centre"] || '';
  const startDate = foodFormData.startDate || '';
  const endDate = foodFormData.endDate || '';

  const getCount = (dateFoodDetails, mealType, section, key) => {
    const mealData = getMealData(dateFoodDetails, mealType);
    const sectionData = mealData?.[section];
    if (sectionData == null) return "0";

    if (typeof sectionData === "number" || typeof sectionData === "string") {
      return sectionData || "0";
    }

    const direct = sectionData?.[key];
    const spaced = key === "NonVeg" ? sectionData?.["Non Veg"] : sectionData?.[key];
    const compact = key === "Non Veg" ? sectionData?.NonVeg : sectionData?.[key];
    const total = sectionData?.total;

    return direct ?? spaced ?? compact ?? total ?? "0";
  };

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
                  <td className="px-3 py-2 font-medium">
                    {mealType === "MorningRefreshment"
                      ? "Morning Refreshment"
                      : mealType === "EveningRefreshment"
                      ? "Evening Refreshment"
                      : mealType}
                  </td>
                  {dates.map((date, idx) => {
                    const dateFoodDetails = foodDetails[idx] || {};
                    return (
                      <React.Fragment key={idx}>
                        <td colSpan={2}></td>
                        <td className="px-3 py-2">{getCount(dateFoodDetails, mealType, "participants", "Veg")}</td>
                        <td className="px-3 py-2">{getCount(dateFoodDetails, mealType, "participants", "Non Veg")}</td>
                        <td className="px-3 py-2">{getCount(dateFoodDetails, mealType, "guest", "Veg")}</td>
                        <td className="px-3 py-2">{getCount(dateFoodDetails, mealType, "guest", "Non Veg")}</td>
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
