import React from "react";

const EventDetails = ({ formData, setFormData, disabled = false }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Name of the Event
        </label>
        <input
          type="text"
          name="eventName"
          value={formData.eventName}
          onChange={handleChange}
          autoComplete="off"
          disabled={disabled}
          className="w-full"
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
          autoComplete="off"
          disabled={disabled}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default EventDetails;
