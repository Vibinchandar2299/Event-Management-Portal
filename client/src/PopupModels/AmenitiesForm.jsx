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
    <div>
      <h1 className="main-heading">Amenities Form</h1>
      {/* Only Requestor Name and Department/Centre at the top */}
      <div className="mb-4">
        {requestorName && (
          <div><span className="font-semibold">Requestor Name:</span> {requestorName}</div>
        )}
        {department && (
          <div><span className="font-semibold">Department/Centre:</span> {department}</div>
        )}
      </div>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            {dates.map((date, idx) => (
              <React.Fragment key={idx}>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Participants Veg</th>
                <th>Participants NonVeg</th>
                <th>Guest/VIP Veg</th>
                <th>Guest/VIP NonVeg</th>
              </React.Fragment>
            ))}
          </tr>
          <tr>
            <th></th>
            {dates.map((date, idx) => (
              <React.Fragment key={idx}>
                <th>{date.date && typeof date.date === 'object' && date.date.start
                  ? new Date(date.date.start).toLocaleDateString()
                  : (typeof date.date === 'string' && date.date ? new Date(date.date).toLocaleDateString() : '-')}</th>
                <th>{date.date && typeof date.date === 'object' && date.date.end
                  ? new Date(date.date.end).toLocaleDateString()
                  : (typeof date.date === 'string' && date.date ? new Date(date.date).toLocaleDateString() : '-')}</th>
                <th colSpan={4}></th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {mealTypes.length > 0 ? (
            mealTypes.map((mealType) => (
              <tr key={mealType}>
                <td>{mealType}</td>
                {dates.map((date, idx) => {
                  const dateFoodDetails = foodDetails[idx]?.[mealType] || {};
                  return (
                    <React.Fragment key={idx}>
                      <td colSpan={2}></td>
                      <td>{dateFoodDetails.participants?.Veg || "0"}</td>
                      <td>{dateFoodDetails.participants?.NonVeg || "0"}</td>
                      <td>{dateFoodDetails.guest?.Veg || "0"}</td>
                      <td>{dateFoodDetails.guest?.NonVeg || "0"}</td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={dates.length > 0 ? dates.length * 6 + 1 : 7}>No Food Details Available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AmenitiesForm;
