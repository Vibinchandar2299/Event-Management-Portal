import React, { useEffect, useState } from "react";

export function DriverDetails({ data, setDetails }) {
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
    <div className="">
      <h3 className="text-lg font-medium text-gray-900">
        Driver Information (if required)
      </h3>
      <div className="grid grid-cols-3">
        <div className="">
          <h1 className="text-sm font-medium text-gray-700">Name</h1>
          <input
            type="text"
            name="name"
            value={driverInfo.name}
            onChange={handleInputChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          />
        </div>
        <div>
          <h1 className="text-sm font-medium text-gray-700">Mobile Number</h1>
          <input
            type="tel"
            name="mobileNumber"
            value={driverInfo.mobileNumber}
            onChange={handleInputChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          />
        </div>
      </div>
    </div>
  );
}
