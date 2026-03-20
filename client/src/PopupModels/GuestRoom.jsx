import React from "react";

const Guestroom = ({ guestroomData }) => {
  if (!guestroomData || Object.keys(guestroomData).length === 0) {
    return (
      <div className="text-gray-500 italic">
        No guest room booking details available
      </div>
    );
  }

  const date = new Date(guestroomData.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const roomLabels = {
    suite1: "Suite Room 1",
    suite2: "Suite Room 2",
    suite3: "Suite Room 3",
    mainBlock3: "Main Block III Floor",
    mainBlock2: "Main Block II Floor",
    girlsHostel: "Girls Hostel",
    eBlock: "E - Block",
    cBlock: "C - Block",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-gray-700">Department/Centre</h4>
          <p className="text-gray-600">{guestroomData.department || "N/A"}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700">Requestor Name</h4>
          <p className="text-gray-600">{guestroomData.requestorName || "N/A"}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700">Employee ID</h4>
          <p className="text-gray-600">{guestroomData.empId || "N/A"}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700">Mobile Number</h4>
          <p className="text-gray-600">{guestroomData.mobile || "N/A"}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700">Designation</h4>
          <p className="text-gray-600">{guestroomData.designation || "N/A"}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700">Date</h4>
          <p className="text-gray-600">{formattedDate}</p>
        </div>
        <div>
          <h4 className="font-semibold text-gray-700">Number of Guests</h4>
          <p className="text-gray-600">{guestroomData.guestCount || "N/A"}</p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Purpose</h4>
        <p className="text-gray-600">{guestroomData.purpose || "N/A"}</p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Selected Rooms</h4>
        <div className="grid grid-cols-2 gap-2">
          {guestroomData.selectedRooms && guestroomData.selectedRooms.length > 0 ? (
            guestroomData.selectedRooms.map((roomId, index) => (
              <div key={index} className="bg-gray-50 p-2 rounded">
                {roomLabels[roomId] || roomId}
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No rooms selected</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Guestroom;
