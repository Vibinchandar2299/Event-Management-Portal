import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";

// Sample data - in a real EventController, this would come from an API
const initialData = [
  {
    id: 1,
    name: "Alexander Mitchell",
    email: "alex.mitchell@example.com",
    phone: "+1 (555) 123-4567",
    totalEvents: 28,
    department: "Engineering",
    designation: "Senior Developer",
  },
  {
    id: 2,
    name: "Sarah Williams",
    email: "sarah.w@example.com",
    phone: "+1 (555) 234-5678",
    totalEvents: 15,
    department: "Marketing",
    designation: "Marketing Manager",
  },
  {
    id: 3,
    name: "James Rodriguez",
    email: "james.r@example.com",
    phone: "+1 (555) 345-6789",
    totalEvents: 42,
    department: "Sales",
    designation: "Sales Director",
  },
  {
    id: 4,
    name: "Emily Chen",
    email: "emily.chen@example.com",
    phone: "+1 (555) 456-7890",
    totalEvents: 33,
    department: "Product",
    designation: "Product Owner",
  },
  {
    id: 5,
    name: "Michael Brown",
    email: "michael.b@example.com",
    phone: "+1 (555) 567-8901",
    totalEvents: 19,
    department: "Engineering",
    designation: "Frontend Developer",
  },
  {
    id: 1,
    name: "Alexander Mitchell",
    email: "alex.mitchell@example.com",
    phone: "+1 (555) 123-4567",
    totalEvents: 28,
    department: "Engineering",
    designation: "Senior Developer",
  },
  {
    id: 2,
    name: "Sarah Williams",
    email: "sarah.w@example.com",
    phone: "+1 (555) 234-5678",
    totalEvents: 15,
    department: "Marketing",
    designation: "Marketing Manager",
  },
  {
    id: 3,
    name: "James Rodriguez",
    email: "james.r@example.com",
    phone: "+1 (555) 345-6789",
    totalEvents: 42,
    department: "Sales",
    designation: "Sales Director",
  },
  {
    id: 4,
    name: "Emily Chen",
    email: "emily.chen@example.com",
    phone: "+1 (555) 456-7890",
    totalEvents: 33,
    department: "Product",
    designation: "Product Owner",
  },
  {
    id: 5,
    name: "Michael Brown",
    email: "michael.b@example.com",
    phone: "+1 (555) 567-8901",
    totalEvents: 19,
    department: "Engineering",
    designation: "Frontend Developer",
  },
  {
    id: 1,
    name: "Alexander Mitchell",
    email: "alex.mitchell@example.com",
    phone: "+1 (555) 123-4567",
    totalEvents: 28,
    department: "Engineering",
    designation: "Senior Developer",
  },
  {
    id: 2,
    name: "Sarah Williams",
    email: "sarah.w@example.com",
    phone: "+1 (555) 234-5678",
    totalEvents: 15,
    department: "Marketing",
    designation: "Marketing Manager",
  },
  {
    id: 3,
    name: "James Rodriguez",
    email: "james.r@example.com",
    phone: "+1 (555) 345-6789",
    totalEvents: 42,
    department: "Sales",
    designation: "Sales Director",
  },
  {
    id: 4,
    name: "Emily Chen",
    email: "emily.chen@example.com",
    phone: "+1 (555) 456-7890",
    totalEvents: 33,
    department: "Product",
    designation: "Product Owner",
  },
  {
    id: 5,
    name: "Michael Brown",
    email: "michael.b@example.com",
    phone: "+1 (555) 567-8901",
    totalEvents: 19,
    department: "Engineering",
    designation: "Frontend Developer",
  },
];

function EventController() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.email.toLowerCase().includes(searchLower) ||
        item.phone.toLowerCase().includes(searchLower)
      );
    });
  }, [searchTerm]);

  return (
    <div className="ml- bg-gradient-to-br from-gray-50 to-gray-100">
      <div className=" mx-auto  sm:px-6 lg:px-8 ">
        <div className="bg-white rounded-xl overflow-hidden ">
          {/* Header */}
          <div className=" py-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-2xl font-semibold text-gray-800">
              Teaching Staffs
            </h2>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto h-[450px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Phone
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Total Events
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Department
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Designation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((person) => (
                  <tr
                    key={person.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {person.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {person.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {person.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {person.totalEvents}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {person.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {person.designation}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer with results count */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredData.length} of {initialData.length} results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventController;
