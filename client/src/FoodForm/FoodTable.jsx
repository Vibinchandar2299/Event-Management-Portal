import React, { useCallback } from "react";

function toDateInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

const FoodTable = ({ formData, setFormData, disabled = false }) => {
  // Get all actual date keys (start dates) from formData.dates
  const dateKeys = Object.keys(formData.dates || {});

  const handleDateChange = (oldKey, field, value) => {
    // Debug log
    console.log("handleDateChange", { oldKey, field, value, prevDates: formData.dates });

    if (field === "start") {
      const newKey = value;
      setFormData((prev) => {
        const newDates = { ...prev.dates };
        const newFoodDetails = { ...prev.foodDetails };
        // Preserve the end date if it was set and not equal to the old start
        let newEnd = newDates[oldKey]?.end;
        if (!newEnd || newEnd === oldKey) {
          newEnd = value;
        }
        // Move the date entry
        newDates[newKey] = { ...newDates[oldKey], start: value, end: newEnd };
        delete newDates[oldKey];
        // Move the foodDetails entry
        if (newFoodDetails[oldKey]) {
          newFoodDetails[newKey] = newFoodDetails[oldKey];
          delete newFoodDetails[oldKey];
        }
        // Debug log after change
        setTimeout(() => {
          console.log("AFTER DATE CHANGE:", JSON.stringify(newDates, null, 2));
        }, 0);
        return {
          ...prev,
          dates: newDates,
          foodDetails: newFoodDetails,
        };
      });
    } else {
      // Just update the end date for the current key
      setFormData((prev) => {
        const updatedDates = {
          ...prev.dates,
          [oldKey]: {
            ...prev.dates[oldKey],
            end: value,
          },
        };
        // Debug log after change
        setTimeout(() => {
          console.log("AFTER DATE CHANGE:", JSON.stringify(updatedDates, null, 2));
        }, 0);
        return {
          ...prev,
          dates: updatedDates,
        };
      });
    }
  };

  const handleChange = useCallback((date, mealType, menuType, category, value) => {
    setFormData((prev) => ({
      ...prev,
      foodDetails: {
        ...prev.foodDetails,
        [date]: {
          ...prev.foodDetails[date],
          [mealType]: {
            ...prev.foodDetails[date]?.[mealType],
            [menuType]: {
              ...prev.foodDetails[date]?.[mealType]?.[menuType],
              [category]: value,
            },
          },
        },
      },
    }));
  }, [setFormData]);

  // For demonstration, allow up to 4 date slots
  while (dateKeys.length < 4) {
    dateKeys.push("");
  }

  const meals = [
    {
      label: "Breakfast",
      key: "Breakfast",
      types: [
        { label: "Veg", key: "Veg" },
        { label: "Non Veg", key: "NonVeg" },
      ],
    },
    {
      label: "Morning Refreshment",
      key: "MorningRefreshment",
      types: [{ label: "Total", key: "total" }],
    },
    {
      label: "Lunch",
      key: "Lunch",
      types: [
        { label: "Veg", key: "Veg" },
        { label: "Non Veg", key: "NonVeg" },
      ],
    },
    {
      label: "Evening Refreshment",
      key: "EveningRefreshment",
      types: [{ label: "Total", key: "total" }],
    },
    {
      label: "Dinner",
      key: "Dinner",
      types: [
        { label: "Veg", key: "Veg" },
        { label: "Non Veg", key: "NonVeg" },
      ],
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
        <thead>
          <tr>
            <th className="px-4 py-2 bg-gray-100 text-left font-medium">
              Type
            </th>
            {dateKeys.map((dateKey, index) => (
              <React.Fragment key={dateKey || index}>
                <th colSpan="2" className="px-4 py-2 bg-gray-100 text-center font-medium">
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-gray-500">Start Date</label>
                    <input
                      type="date"
                      value={toDateInputValue(formData.dates?.[dateKey]?.start)}
                      onChange={(e) => handleDateChange(dateKey, "start", e.target.value)}
                       disabled={disabled}
                      className="w-40 p-1 border rounded text-sm"
                    />
                  </div>
                  <div className="flex flex-col items-center mt-2">
                    <label className="text-xs text-gray-500">End Date</label>
                    <input
                      type="date"
                      value={toDateInputValue(formData.dates?.[dateKey]?.end)}
                      onChange={(e) => handleDateChange(dateKey, "end", e.target.value)}
                       disabled={disabled}
                      className="w-40 p-1 border rounded text-sm"
                    />
                  </div>
                </th>
              </React.Fragment>
            ))}
          </tr>
          <tr>
            <th className="px-4 py-2 bg-gray-50">Meal</th>
            {dateKeys.map((dateKey, index) => (
              <React.Fragment key={dateKey || index}>
                <th className="px-2 py-1 text-gray-700 bg-gray-50 text-center">
                  Participants
                </th>
                <th className="px-2 py-1 text-gray-700 bg-gray-50 text-center">
                  Guest/VIP
                </th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {meals.map((meal) => (
            <React.Fragment key={meal.key}>
              {meal.types.length > 1 ? (
                meal.types.map((type) => (
                  <tr
                    key={`${meal.key}-${type.key}`}
                    className="odd:bg-white even:bg-gray-50"
                  >
                    <td className="px-4 py-2 text-gray-800">
                      {`${meal.label} - ${type.label}`}
                    </td>
                    {dateKeys.map((dateKey, idx) => (
                      <React.Fragment key={dateKey || idx}>
                        <td className="px-2 py-1 text-center">
                          <input
                            type="number"
                            min="0"
                            className="w-20 p-1 border rounded text-sm"
                            disabled={disabled}
                            value={
                              formData.foodDetails?.[dateKey]?.[meal.key]
                                ?.participants?.[type.key] || ""
                            }
                            onChange={(e) =>
                              handleChange(
                                dateKey,
                                meal.key,
                                "participants",
                                type.key,
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <input
                            type="number"
                            min="0"
                            className="w-20 p-1 border rounded text-sm"
                            disabled={disabled}
                            value={
                              formData.foodDetails?.[dateKey]?.[meal.key]
                                ?.guest?.[type.key] || ""
                            }
                            onChange={(e) =>
                              handleChange(
                                dateKey,
                                meal.key,
                                "guest",
                                type.key,
                                e.target.value
                              )
                            }
                          />
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                ))
              ) : (
                <tr className="odd:bg-white even:bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">{meal.label}</td>
                  {dateKeys.map((dateKey, idx) => (
                    <React.Fragment key={dateKey || idx}>
                      <td className="px-2 py-1 text-center">
                        <input
                          type="number"
                          min="0"
                          className="w-20 p-1 border rounded text-sm"
                          disabled={disabled}
                          value={
                            formData.foodDetails?.[dateKey]?.[meal.key]
                              ?.participants?.total || ""
                          }
                          onChange={(e) =>
                            handleChange(
                              dateKey,
                              meal.key,
                              "participants",
                              "total",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <input
                          type="number"
                          min="0"
                          className="w-20 p-1 border rounded text-sm"
                          disabled={disabled}
                          value={
                            formData.foodDetails?.[dateKey]?.[meal.key]?.guest?.total ||
                            ""
                          }
                          onChange={(e) =>
                            handleChange(
                              dateKey,
                              meal.key,
                              "guest",
                              "total",
                              e.target.value
                            )
                          }
                        />
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-4 text-center">
        Note: Please ensure you enter only numeric values for the participants
        and guest menus.
      </p>
    </div>
  );
};

export default React.memo(FoodTable);
