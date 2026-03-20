import React, { useState, useEffect } from "react";

function toDateInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function BasicDetails({ data, setDetails }) {
  const [formState, setFormState] = useState({
    iqacNumber: "",
    requisitionDate: "",
    departmentName: "",
    requestorName: "",
    empId: "",
    designation: "",
    mobileNumber: "",
  });

  // Update local state when data prop changes
  useEffect(() => {
    if (data) {
      setFormState(prev => ({
        ...prev,
        ...data
      }));
    }
  }, [data]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("common_data"));
    if (local) {
      const eventData = local;
      const organizers = eventData.organizers || {};

      const newState = {
        iqacNumber: eventData.iqacNumber || "",
        requisitionDate: eventData.startDate || "",
        departmentName: eventData.departments ? eventData.departments.join(", ") : "",
        requestorName: organizers.name || "",
        empId: organizers.employeeId || "",
        designation: organizers.designation || "",
        mobileNumber: organizers.phone || "",
      };

      setFormState(newState);
      setDetails(newState);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newState = { ...formState, [name]: value };
    setFormState(newState);
    setDetails(newState);
  };

  return (
    <div className="xl:w-full">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            IQAC Number
          </label>
          <input
            type="text"
            name="iqacNumber"
            value={formState.iqacNumber}
            onChange={handleChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
            placeholder="1/2024-25/"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Employee ID
          </label>
          <input
            type="text"
            name="empId"
            value={formState.empId}
            onChange={handleChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Requestor Name
          </label>
          <input
            type="text"
            name="requestorName"
            value={formState.requestorName}
            onChange={handleChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Requisition Date
          </label>
          <input
            type="date"
            name="requisitionDate"
            value={toDateInputValue(formState.requisitionDate)}
            onChange={handleChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name of the Department/Centre
          </label>
          <input
            type="text"
            name="departmentName"
            value={formState.departmentName}
            onChange={handleChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
            required
          />
        </div>
      </div>
    </div>
  );
}
