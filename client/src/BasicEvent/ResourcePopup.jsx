import React, { useState } from "react";

const ResourcePersonsForm = ({ resourcePersons, setResourcePersons }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    const updatedResourcePersons = [...resourcePersons];
    updatedResourcePersons[index][name] = value;
    setResourcePersons(updatedResourcePersons);
  };

  const addResourcePerson = () => {
    setResourcePersons([...resourcePersons, { name: "", affiliation: "" }]);
  };

  const removeResourcePerson = (index) => {
    const updatedResourcePersons = resourcePersons.filter(
      (_, i) => i !== index
    );
    setResourcePersons(updatedResourcePersons);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsPopupOpen(true)}
        className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
      >
        Add Resource Person
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
            <h2 className="text-xl font-semibold mb-4">
              Enter Resource Persons
            </h2>

            <div className="overflow-y-auto max-h-96">
              {resourcePersons.map((resourcePerson, index) => (
                <div key={index} className="mb-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">
                      Resource Person {index + 1}
                    </h3>
                    {resourcePersons.length > 0 && index >= 0 && (
                      <button
                        type="button"
                        onClick={() => removeResourcePerson(index)}
                        className="text-red-500 text-lg font-bold hover:text-red-700"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium">
                        Resource Person Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={resourcePerson.name}
                        onChange={(e) => handleInputChange(index, e)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">
                        Affiliation
                      </label>
                      <input
                        type="text"
                        name="affiliation"
                        value={resourcePerson.affiliation}
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
              onClick={addResourcePerson}
              className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
            >
              Add Another Resource Person
            </button>

            <div className="mt-6">
              <button
                onClick={(e) => {
                  e.preventDefault();
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

export default ResourcePersonsForm;
