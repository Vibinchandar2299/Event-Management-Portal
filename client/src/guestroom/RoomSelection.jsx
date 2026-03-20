import React from "react";
import { Bed } from "lucide-react";

const RoomSelection = ({ selectedRooms = [], onRoomChange }) => {
  // Ensure selectedRooms is always an array
  const safeSelectedRooms = Array.isArray(selectedRooms) ? selectedRooms : [];

  const rooms = [
    { id: "suite1", label: "Suite Room 1" },
    { id: "suite2", label: "Suite Room 2" },
    { id: "suite3", label: "Suite Room 3" },
    { id: "mainBlock3", label: "Main Block III Floor" },
    { id: "mainBlock2", label: "Main Block II Floor" },
    { id: "girlsHostel", label: "Girls Hostel" },
    { id: "eBlock", label: "E - Block" },
    { id: "cBlock", label: "C - Block" },
  ];

  const handleRoomToggle = (roomId) => {
    console.log("Room Selection: ", roomId);
    onRoomChange(roomId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Bed className="h-5 w-5" />
        Room Selection (Select Multiple)
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <label
            key={room.id}
            className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors group
              ${
                safeSelectedRooms.includes(room.id)
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-300"
              }`}
          >
            <input
              type="checkbox"
              checked={safeSelectedRooms.includes(room.id)}
              onChange={() => handleRoomToggle(room.id)}
              className="absolute h-4 w-4 top-2 right-2 text-indigo-600 focus:ring-indigo-500"
            />
            <span
              className={`text-sm ${
                safeSelectedRooms.includes(room.id)
                  ? "text-indigo-700"
                  : "text-gray-700"
              } text-center`}
            >
              {room.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default RoomSelection;
