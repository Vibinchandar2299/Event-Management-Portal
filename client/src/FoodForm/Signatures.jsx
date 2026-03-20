import React from 'react';

const Signatures = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="mt-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Amenities Incharge</label>
        <input
          type="text"
          name="amenitiesIncharge"
          value={formData.amenitiesIncharge}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Sign of OS</label>
        <input
          type="text"
          name="signOfOS"
          value={formData.signOfOS}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Signature of Faculty Member/Staff</label>
          <input
            type="text"
            name="facultySignature"
            value={formData.facultySignature}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Recommended by Dean/HOD/Section Head</label>
          <input
            type="text"
            name="recommendedBy"
            value={formData.recommendedBy}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Clearance from Dean IQAC</label>
          <input
            type="text"
            name="deanClearance"
            value={formData.deanClearance}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default Signatures;