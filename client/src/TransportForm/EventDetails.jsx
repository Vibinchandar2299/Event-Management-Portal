import React, { useState, useEffect } from "react";

export function EventDetails({ data, setDetails }) {
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
    <div className="space-y-4 grid grid-cols-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Name of the Event/Purpose
        </label>
        <input
          type="text"
          name="eventName"
          value={eventData.eventName}
          onChange={handleInputChange}
          className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
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
          className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
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
          className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          rows={3}
        />
      </div>
    </div>
  );
}
