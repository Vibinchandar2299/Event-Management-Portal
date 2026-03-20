import React, { useMemo } from 'react';

const AmenitiesForm = ({ foodFormData }) => {
  // Debug log to inspect incoming data
  console.log("AmenitiesForm received foodFormData:", foodFormData);
  // Ensure foodFormData is properly formatted
  const formattedData = useMemo(() => {
    if (!foodFormData) return { dates: [], foodDetails: {} };

    // Handle the actual food form structure with dates array
    if (Array.isArray(foodFormData.dates)) {
      const processedDates = foodFormData.dates.filter(dateObj => dateObj && dateObj.date);
      return {
        ...foodFormData,
        dates: processedDates
      };
    }

    // If dates is an object, convert it to the expected format
    if (typeof foodFormData.dates === 'object' && foodFormData.dates !== null) {
      const datesArray = Object.entries(foodFormData.dates).map(([dateKey, dateValue]) => ({
        date: { start: dateKey, end: dateKey },
        foodDetails: foodFormData.foodDetails?.[dateKey] || {}
      }));
      return {
        ...foodFormData,
        dates: datesArray
      };
    }

    return { dates: [], foodDetails: {} };
  }, [foodFormData]);

  // Get all dates with their food details
  const datesWithFoodDetails = useMemo(() => {
    if (!formattedData.dates || !Array.isArray(formattedData.dates)) {
      return [];
    }
    
    const processed = formattedData.dates
      .filter(dateObj => dateObj && dateObj.date)
      .map(dateObj => ({
        date: dateObj.date,
        foodDetails: dateObj.foodDetails || {}
      }));
    
    // Debug log to inspect processed dates
    console.log("AmenitiesForm processed datesWithFoodDetails:", processed);
    return processed;
  }, [formattedData]);

  if (!datesWithFoodDetails || datesWithFoodDetails.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No food details available</p>
      </div>
    );
  }

  const renderFoodDetails = (foodDetails) => {
    if (!foodDetails || Object.keys(foodDetails).length === 0) {
      return <p className="text-gray-500">No food details for this date</p>;
    }

    return Object.entries(foodDetails).map(([mealType, mealData]) => (
      <div key={mealType} className="border rounded p-3 mb-3">
        <h4 className="font-medium text-blue-600">{mealType}</h4>
        {mealData && typeof mealData === 'object' && (
          <div className="ml-4">
            {Object.entries(mealData).map(([category, categoryData]) => (
              <div key={category} className="mt-2">
                <h5 className="font-medium text-gray-700">{category}</h5>
                {categoryData && typeof categoryData === 'object' && (
                  <div className="ml-4">
                    {Object.entries(categoryData).map(([type, value]) => (
                      <div key={type} className="text-sm">
                        <span className="font-medium">{type}:</span> {value || 'N/A'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      {datesWithFoodDetails.map((dateObj, index) => {
        const dateKey = dateObj.date?.start ? 
          `${new Date(dateObj.date.start).toLocaleDateString()}${dateObj.date.end && dateObj.date.end !== dateObj.date.start ? ` - ${new Date(dateObj.date.end).toLocaleDateString()}` : ''}` : 
          'Unknown Date';
        
        return (
          <div key={index} className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Date: {dateKey}</h3>
            <div className="space-y-2">
              {renderFoodDetails(dateObj.foodDetails)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AmenitiesForm; 