import React, { useEffect } from "react";

function toDateInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

const BasicInfo = ({ formData, setFormData, disabled = false }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  useEffect(() => {
    console.log("Form Data Updated:", formData);
  }, [formData]);

  return (
    <div className="mb-6 w-full space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            IQAC Number
          </label>
          <input
            type="text"
            name="iqacNumber"
            value={formData.iqacNumber || ""}
            onChange={handleChange}
            placeholder="Enter IQAC number"
            autoComplete="off"
            disabled={disabled}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Employee ID
          </label>
          <input
            type="text"
            name="empId"
            value={formData.empId || ""}
            onChange={handleChange}
            placeholder="Enter employee ID"
            autoComplete="off"
            disabled={disabled}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Requestor Name
          </label>
          <input
            type="text"
            name="requestorName"
            value={formData.requestorName || ""}
            onChange={handleChange}
            placeholder="Enter your name"
            autoComplete="off"
            disabled={disabled}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Mobile Number
          </label>
          <input
            type="tel"
            name="mobileNumber"
            value={formData.mobileNumber || ""}
            onChange={handleChange}
            placeholder="Enter mobile number"
            autoComplete="off"
            disabled={disabled}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Requestor Designation
          </label>
          <input
            type="text"
            name="designationDepartment"
            value={formData.designationDepartment || ""}
            onChange={handleChange}
            placeholder="Enter designation"
            autoComplete="off"
            disabled={disabled}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Requisition Date
          </label>
          <input
            type="date"
            name="requisitionDate"
            value={toDateInputValue(formData.requisitionDate)}
            onChange={handleChange}
            autoComplete="off"
            disabled={disabled}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Event Requestor Department
          </label>
          <input
            type="text"
            name="department"
            value={formData.department || ""}
            onChange={handleChange}
            placeholder="Enter department name"
            autoComplete="off"
            disabled={disabled}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;
