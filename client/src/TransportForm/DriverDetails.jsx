import React, { useEffect, useState } from "react";

export function DriverDetails({ data, setDetails, disabled = false }) {
  const [driverInfo, setDriverInfo] = useState({
    name: "",
    mobileNumber: "",
  });
  useEffect(() => {
    setDriverInfo(data);
  }, [data]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const updatedInfo = { ...driverInfo, [name]: value };
    setDriverInfo(updatedInfo);
    setDetails(updatedInfo);
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900">
        Driver Information (if required)
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <h1 className="text-sm font-medium text-gray-700">Name</h1>
          <input
            type="text"
            name="name"
            value={driverInfo.name}
            onChange={handleInputChange}
            placeholder="Enter driver name"
            disabled={disabled}
            className="mt-1"
          />
        </div>
        <div>
          <h1 className="text-sm font-medium text-gray-700">Mobile Number</h1>
          <input
            type="tel"
            name="mobileNumber"
            value={driverInfo.mobileNumber}
            onChange={handleInputChange}
            placeholder="Enter mobile number"
            disabled={disabled}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
}
