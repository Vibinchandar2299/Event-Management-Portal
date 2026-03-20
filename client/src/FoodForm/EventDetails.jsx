import React from "react";

const EventDetails = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-4 mb-6 grid grid-cols-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Name of the Event
        </label>
        <input
          type="text"
          name="eventName"
          value={formData.eventName}
          onChange={handleChange}
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
          value={formData.eventType}
          onChange={handleChange}
          className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
        />
      </div>
    </div>
  );
};

export default EventDetails;
