import React from "react";

const TransportRequisition = ({ transportData }) => {
  return (
    <div>
      <h1 className="main-heading">Transport Requisition Form</h1>
      <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Event Requisitor Name</th>
            <th>Details of the Traveller</th>
            <th>Pick up Date & Time</th>
            <th>Pick up Location</th>
            <th>Drop Date & Time</th>
            <th>Drop Location</th>
            <th>No. of Passengers</th>
            <th>Type of Vehicle</th>
            <th>Special Requirements</th>
            <th>Driver Information</th>
          </tr>
        </thead>
        <tbody>
          {transportData.map((data, index) => (
            <tr key={index}>
              <td>{data.eventDetails?.eventName || "N/A"}</td>
              <td>{data.eventDetails?.travellerDetails || "N/A"}</td>
              <td>
                {new Date(
                  data.travelDetails?.pickUpDateTime
                ).toLocaleString() || "N/A"}
              </td>
              <td>{data.travelDetails?.pickUpLocation || "N/A"}</td>
              <td>
                {new Date(data.travelDetails?.dropDateTime).toLocaleString() ||
                  "N/A"}
              </td>
              <td>{data.travelDetails?.dropLocation || "N/A"}</td>
              <td>{data.travelDetails?.numberOfPassengers || "N/A"}</td>
              <td>{data.travelDetails?.vehicleType || "N/A"}</td>
              <td>{data.travelDetails?.specialRequirements || "N/A"}</td>
              <td>
                <table
                  border="1"
                  style={{ width: "100%", borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Mobile No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{data.driverDetails?.name || "N/A"}</td>
                      <td>{data.driverDetails?.mobileNumber || "N/A"}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransportRequisition;
