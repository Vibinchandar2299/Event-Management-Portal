import React from "react";

const EventBasic = ({ eventData }) => {
  console.log("=== EventBasic Debug ===");
  console.log("eventData:", eventData);
  console.log("eventData type:", typeof eventData);
  console.log("eventData keys:", eventData ? Object.keys(eventData) : "No data");
  
  const eventsArray = Array.isArray(eventData) ? eventData : [eventData];
  console.log("events data inside the EventBasic1 popup : ", eventsArray);

  return (
    <div>
      <h1 className="main-heading">Event Basic</h1>
      <table>
        <thead>
          <tr>
            <th>Department</th>
            <th>Event Venue</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Name of the Event</th>
            <th>Type of the Event</th>
          </tr>
        </thead>
        <tbody>
          {eventsArray.length > 0 ? (
            eventsArray.map((event, index) => (
              <tr key={index}>
                <td>
                  {event.academicdepartment
                    ? event.academicdepartment.join(", ")
                    : "N/A"}
                </td>
                <td>{event.eventVenue || "N/A"}</td>
                <td>{event.startDate || "N/A"}</td>
                <td>{event.endDate || "N/A"}</td>
                <td>{event.startTime || "N/A"}</td>
                <td>{event.endTime || "N/A"}</td>
                <td>{event.eventName || "N/A"}</td>
                <td>{event.eventType || "N/A"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                No events available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EventBasic;
