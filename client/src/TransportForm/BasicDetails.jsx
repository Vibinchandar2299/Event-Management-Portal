import React, { useState, useEffect } from "react";

function toDateInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function BasicDetails({ data, setDetails, disabled = false }) {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newState = { ...formState, [name]: value };
    setFormState(newState);
    setDetails(newState);
  };

  return (
    <div className="xl:w-full">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            IQAC Number
          </label>
          <input
            type="text"
            name="iqacNumber"
            value={formState.iqacNumber}
            onChange={handleChange}
            placeholder="Enter IQAC number"
            disabled={disabled}
            className="mt-1"
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
            placeholder="Enter employee ID"
            disabled={disabled}
            className="mt-1"
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
            placeholder="Enter your name"
            disabled={disabled}
            className="mt-1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Requestor Mobile Number
          </label>
          <input
            type="tel"
            name="mobileNumber"
            value={formState.mobileNumber}
            onChange={handleChange}
            placeholder="Enter mobile number"
            disabled={disabled}
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Requestor Designation
          </label>
          <input
            type="text"
            name="designation"
            value={formState.designation}
            onChange={handleChange}
            placeholder="Enter designation"
            disabled={disabled}
            className="mt-1"
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
            disabled={disabled}
            className="mt-1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Requestor Department
          </label>
          <input
            type="text"
            name="departmentName"
            value={formState.departmentName}
            onChange={handleChange}
            placeholder="Enter department name"
            disabled={disabled}
            className="mt-1"
            required
          />
        </div>
      </div>
    </div>
  );
}
