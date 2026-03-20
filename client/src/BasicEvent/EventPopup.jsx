import React, { useState, useEffect } from "react";

const EventTypePopup = ({ data, HandelChange, onclose, ClosingProperty }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("");
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [manualEventType, setManualEventType] = useState("");
  const handleClose = () => {
    if (onclose && typeof onclose === "function") {
      console.log("function passing while clicking");
      onclose(ClosingProperty);
    }
  };
  const filteredEventTypes = Array.isArray(data)
    ? data.filter((eventType) =>
        eventType.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleEventTypeSelect = (eventType) => {
    setSelectedEventType(eventType);
    HandelChange(eventType);
  };

  const handleOkButtonClick = () => {
    if (isOtherSelected && manualEventType) {
      HandelChange(manualEventType);
    } else if (selectedEventType) {
      HandelChange(selectedEventType);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-[#00000020] bg-opacity-50"
      onClick={handleClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Event Type"
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {filteredEventTypes.map((eventType, index) => (
            <li
              key={index}
              className="cursor-pointer px-4 py-2 hover:bg-gray-200"
              onClick={() => handleEventTypeSelect(eventType)}
            >
              {eventType}
            </li>
          ))}
        </ul>

        <div className="flex justify-between mt-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            onClick={(e) => {
              e.preventDefault();
              handleOkButtonClick();
              handleClose();
            }}
          >
            OK
          </button>
          <button
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
            onClick={(e) => {
              setIsOtherSelected(true);
              e.preventDefault();
            }}
          >
            Other
          </button>
        </div>

        {isOtherSelected && (
          <div className="mt-4">
            <input
              type="text"
              value={manualEventType}
              onChange={(e) => setManualEventType(e.target.value)}
              placeholder="Enter Event Type"
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventTypePopup;
