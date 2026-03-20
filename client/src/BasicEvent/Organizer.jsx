import React, { useState } from "react";

const OrganizersForm = ({ organizers, setOrganizers }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    const updatedOrganizers = [...organizers];
    updatedOrganizers[index][name] = value;
    setOrganizers(updatedOrganizers);
  };

  const addOrganizer = () => {
    setOrganizers([
      ...organizers,
      { employeeId: "", name: "", designation: "", phone: "" },
    ]);
  };

  const removeOrganizer = (index) => {
    if (organizers.length > 1) {
      const updatedOrganizers = organizers.filter((_, i) => i !== index);
      setOrganizers(updatedOrganizers);
    }
  };

  return (
    <div className="">
      <button
        type="button"
        onClick={() => setIsPopupOpen(true)}
        className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
      >
        Add Organizer
      </button>

      {isPopupOpen && (
        <div className="bg-[#00000064] fixed inset-0 flex items-center justify-center">
          <div className="relative bg-white p-6 w-full max-w-2xl rounded-lg shadow-lg">
            <button
              onClick={() => setIsPopupOpen(false)}
              className="absolute top-2 right-2 text-red-500 text-xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Enter Organizers</h2>

            <div className="overflow-y-auto max-h-96">
              {Array.isArray(organizers) &&
                organizers.map((organizer, index) => (
                  <div key={index} className="mb-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        Organizer {index + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeOrganizer(index)}
                        className="text-red-500 text-lg font-bold hover:text-red-700"
                        disabled={organizers.length <= 1} // Disable button when only one organizer is left
                      >
                        &times;
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium">
                          Employee ID
                        </label>
                        <input
                          type="text"
                          name="employeeId"
                          value={organizer.employeeId}
                          onChange={(e) => handleInputChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">
                          Organizer Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={organizer.name}
                          onChange={(e) => handleInputChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">
                          Designation
                        </label>
                        <input
                          type="text"
                          name="designation"
                          value={organizer.designation}
                          onChange={(e) => handleInputChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          name="phone"
                          value={organizer.phone}
                          onChange={(e) => handleInputChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <button
              type="button"
              onClick={addOrganizer}
              className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
            >
              Add Another Organizer
            </button>

            <div className="mt-6">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Save button clicked");
                }}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizersForm;
