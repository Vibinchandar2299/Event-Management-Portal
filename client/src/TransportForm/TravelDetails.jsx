import React, { useState, useEffect } from "react";

function toDatetimeLocal(date) {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function TravelDetails({ data, setDetails }) {
  const [travelData, setTravelData] = useState({
    pickUpDateTime: "",
    pickUpLocation: "",
    dropDateTime: "",
    dropLocation: "",
    numberOfPassengers: "",
    vehicleType: "",
    specialRequirements: "",
  });

  useEffect(() => {
    if (data) {
      setTravelData(data);
    }
  }, [data]);

  const vehicles = [
    "Baleno",
    "Innova (New)",
    "Innova (Old)",
    "Eco Sport",
    "Ciaz",
    "Bus",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...travelData, [name]: value };
    setTravelData(updatedData);
    setDetails(updatedData); // Use updatedData instead of travelData
  };

  return (
    <div className="gap-4 grid grid-cols-3">
      <div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Pick Up Date & Time
          </label>
          <input
            type="datetime-local"
            name="pickUpDateTime"
            value={toDatetimeLocal(travelData.pickUpDateTime)}
            onChange={handleInputChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Pick Up Location
          </label>
          <input
            type="text"
            name="pickUpLocation"
            value={travelData.pickUpLocation}
            onChange={handleInputChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          />
        </div>
      </div>
      <div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Drop Date & Time
          </label>
          <input
            type="datetime-local"
            name="dropDateTime"
            value={toDatetimeLocal(travelData.dropDateTime)}
            onChange={handleInputChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Drop Location
          </label>
          <input
            type="text"
            name="dropLocation"
            value={travelData.dropLocation}
            onChange={handleInputChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          />
        </div>
      </div>
      <div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Number of Passengers
          </label>
          <input
            type="number"
            name="numberOfPassengers"
            value={travelData.numberOfPassengers}
            onChange={handleInputChange}
            min="1"
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Type of Vehicle
          </label>
          <select
            name="vehicleType"
            value={travelData.vehicleType}
            onChange={handleInputChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          >
            <option value="">Select vehicle type</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle} value={vehicle}>
                {vehicle}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Special Requirements
        </label>
        <input
          type="text"
          name="specialRequirements"
          value={travelData.specialRequirements}
          onChange={handleInputChange}
          className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
        />
      </div>
    </div>
  );
}
