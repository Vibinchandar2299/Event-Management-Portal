import React, { useEffect } from "react";

function toDateInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

const BasicInfo = ({ formData, setFormData }) => {
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
    <div className="space-y-4 xl:w-full mb-6">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            IQAC Number
          </label>
          <input
            type="text"
            name="iqacNumber"
            value={formData.iqacNumber || ""}
            onChange={handleChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
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
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Department/Centre
          </label>
          <input
            type="text"
            name="department"
            value={formData.department || ""}
            onChange={handleChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Requestor Name
          </label>
          <input
            type="text"
            name="requestorName"
            value={formData.requestorName || ""}
            onChange={handleChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Emp ID
          </label>
          <input
            type="text"
            name="empId"
            value={formData.empId || ""}
            onChange={handleChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Designation & Department
          </label>
          <input
            type="text"
            name="designationDepartment"
            value={formData.designationDepartment || ""}
            onChange={handleChange}
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
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
            className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfo;
