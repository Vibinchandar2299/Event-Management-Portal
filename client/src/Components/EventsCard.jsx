import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EndPopup from "../PopupModels/EndPopup";

const EventsCard = ({ event }) => {
  const navigate = useNavigate();
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    console.log("=== EventsCard Debug ===");
    console.log("Event data received:", JSON.stringify(event, null, 2));
    console.log("Current popup state:", isPopupOpen);
    setIsPopupOpen(true);
    console.log("Popup state after setting:", true);
  };

  const handleClosePopup = () => {
    console.log("Closing popup");
    setIsPopupOpen(false);
  };

  const handleCardClick = () => {
    navigate(`/event/${event._id}`);
  };

  // Debug render
  console.log("EventsCard rendering with popup state:", isPopupOpen);

  return (
    <div className="relative">
      <div
        onClick={handleCardClick}
        className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-300"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.eventName}</h3>
            <p className="text-gray-600">{event.eventType}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            event.status === "pending" ? "bg-yellow-100 text-yellow-800" :
            "bg-red-100 text-red-800"
          }`}>
            {event.status}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-gray-600">
            <span className="font-medium">Date:</span> {new Date(event.startDate).toLocaleDateString()}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Time:</span> {event.startTime}
          </p>
          <p className="text-gray-600">
            <span className="font-medium">Venue:</span> {event.venue}
          </p>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={handleDetailsClick}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300"
          >
            Details
          </button>
        </div>
      </div>

      {isPopupOpen && (
        <EndPopup
          event={event}
          onClose={handleClosePopup}
          isOpen={isPopupOpen}
        />
      )}
    </div>
  );
};

export default EventsCard; 