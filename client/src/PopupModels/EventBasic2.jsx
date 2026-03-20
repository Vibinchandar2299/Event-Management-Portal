import React from "react";

const EventBasic2 = ({ eventData }) => {
  console.log("=== EventBasic2 Debug ===");
  console.log("eventData:", eventData);
  console.log("eventData type:", typeof eventData);
  console.log("eventData keys:", eventData ? Object.keys(eventData) : "No data");
  console.log("organizers:", eventData?.organizers);
  console.log("resourcePersons:", eventData?.resourcePersons);
  console.log("iqacNumber:", eventData?.iqacNumber);
  
  // Helper function to safely join arrays
  const safeJoin = (data, separator = ", ") => {
    if (!data) return "N/A";
    if (Array.isArray(data)) {
      return data.length > 0 ? data.join(separator) : "N/A";
    }
    // If it's a string, return it directly
    if (typeof data === 'string') {
      return data || "N/A";
    }
    // If it's an object, try to convert to string
    if (typeof data === 'object') {
      return JSON.stringify(data) || "N/A";
    }
    return "N/A";
  };

  // Helper function to safely check if data is an array
  const safeArray = (data) => {
    return Array.isArray(data) ? data : [];
  };
  
  return (
    <div>
      <h1 className="main-heading">Event Basic 2</h1>
      <table>
        <thead>
          <tr>
            <th>Organizers</th>
            <th>Year</th>
            <th>Categories</th>
            <th>Professional Societies</th>
            <th>Resource Persons</th>
            <th>Logo</th>
            <th>Description</th>
            <th>IQAC Number</th>
            <th>Status</th>
            <th>Departments</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {/* Organizers */}
            <td>
              <table className="nested-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Phone No.</th>
                  </tr>
                </thead>
                <tbody>
                  {safeArray(eventData?.organizers).map((organizer, index) => (
                    <tr key={index}>
                      <td>{organizer.employeeId || organizer.employeeid || "N/A"}</td>
                      <td>{organizer.name || "N/A"}</td>
                      <td>{organizer.designation || "N/A"}</td>
                      <td>{organizer.phone || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>

            {/* Year */}
            <td>{eventData?.year || "N/A"}</td>

            {/* Categories */}
            <td>{safeJoin(eventData?.categories)}</td>

            {/* Professional Societies */}
            <td>{safeJoin(eventData?.professional)}</td>

            {/* Resource Persons */}
            <td>
              <table className="nested-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Affiliation</th>
                  </tr>
                </thead>
                <tbody>
                  {safeArray(eventData?.resourcePersons).map((person, index) => (
                    <tr key={index}>
                      <td>{person.name || "N/A"}</td>
                      <td>{person.affiliation || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>

            {/* Logos */}
            <td>{safeJoin(eventData?.logos)}</td>

            {/* Description */}
            <td>{eventData?.description || "N/A"}</td>

            {/* IQAC Number */}
            <td>{eventData?.iqacNumber || "N/A"}</td>

            {/* Status */}
            <td>{eventData?.status || "N/A"}</td>

            {/* Departments */}
            <td>{safeJoin(eventData?.departments)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default EventBasic2;
