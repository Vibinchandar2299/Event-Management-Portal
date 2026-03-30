import React, { useState, useEffect } from "react";

export function EventDetails({ data, setDetails, disabled = false }) {
  const [eventData, setEventData] = useState({
    eventName: "",
    eventType: "",
    travellerDetails: "",
  });
  useEffect(() => {
    setEventData(data);
  }, [data]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...eventData, [name]: value };
    setEventData(updatedData);

    // Update parent state
    setDetails(updatedData);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Name of the Event
        </label>
        <input
          type="text"
          name="eventName"
          value={eventData.eventName}
          onChange={handleInputChange}
          disabled={disabled}
          className="mt-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Type of the Event
        </label>
        <input
          type="text"
          name="eventType"
          value={eventData.eventType}
          onChange={handleInputChange}
          disabled={disabled}
          className="mt-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Details of the Traveller
        </label>
        <textarea
          name="travellerDetails"
          value={eventData.travellerDetails}
          onChange={handleInputChange}
          disabled={disabled}
          className="mt-1"
          rows={3}
        />
      </div>
    </div>
  );
}
