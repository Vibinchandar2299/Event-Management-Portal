import React, { useEffect, useState } from 'react';
import AmenitiesForm from './AmenitiesForm';

const EndPopup = ({ event, onClose, isOpen }) => {
  const [formattedEventData, setFormattedEventData] = useState(null);
  const [hasFormattedEvent, setHasFormattedEvent] = useState(false);

  useEffect(() => {
    if (event && !formattedEventData) {
      console.log("Processing event data...");
      console.log("Raw event data:", event);
      
      // Handle both flat and nested data structures
      let basicEventData = {};
      let transportData = [];
      let foodFormData = {};
      let guestFormData = {};
      let communicationData = {};

      // Check if data is nested (newly created events)
      if (event.basicEvent) {
        // Nested structure - extract from basicEvent
        basicEventData = {
          eventName: event.basicEvent.eventName || event.basicEvent.eventname,
          eventType: event.basicEvent.eventType || event.basicEvent.eventtype,
          startDate: event.basicEvent.startDate || event.basicEvent.startdate,
          endDate: event.basicEvent.endDate || event.basicEvent.enddate,
          startTime: event.basicEvent.startTime || event.basicEvent.starttime,
          endTime: event.basicEvent.endTime || event.basicEvent.endtime,
          venue: event.basicEvent.venue || event.basicEvent.eventVenue,
          academicdepartment: event.basicEvent.academicdepartment,
          expectedGuests: event.basicEvent.expectedGuests || event.basicEvent.expectedguests,
          budget: event.basicEvent.budget,
          description: event.basicEvent.description,
          status: event.basicEvent.status
        };
        
        transportData = event.transport || [];
        foodFormData = event.foodform || event.foodForm || {};
        guestFormData = event.guestform || event.guestForm || {};
        communicationData = event.communicationform || event.communicationForm || event.communicationdata || {};
      } else {
        // Flat structure - use event directly
        basicEventData = {
          eventName: event.eventName || event.eventname,
          eventType: event.eventType || event.eventtype,
          startDate: event.startDate || event.startdate,
          endDate: event.endDate || event.enddate,
          startTime: event.startTime || event.starttime,
          endTime: event.endTime || event.endtime,
          venue: event.venue || event.eventVenue,
          academicdepartment: event.academicdepartment,
          expectedGuests: event.expectedGuests || event.expectedguests,
          budget: event.budget,
          description: event.description,
          status: event.status
        };
        
        transportData = event.transport || [];
        foodFormData = event.foodForm || event.foodform || {};
        guestFormData = event.guestform || event.guestForm || {};
        communicationData = event.communicationdata || event.communicationForm || event.communicationform || {};
      }

      // Format the event data
      const formatted = {
        basicEvent: basicEventData,
        transport: transportData,
        foodform: foodFormData,
        guestform: guestFormData,
        communicationdata: communicationData
      };

      // Format food form data
      if (formatted.foodform) {
        const foodData = formatted.foodform;
        console.log("Raw food form data:", foodData);

        // Do NOT transform dates array; pass as-is
        // If dates is not an array, try to convert it to an array
        if (!Array.isArray(foodData.dates) && typeof foodData.dates === 'object' && foodData.dates !== null) {
          // Convert object to array
          foodData.dates = Object.entries(foodData.dates).map(([key, value]) => ({
            date: value.date || key,
            foodDetails: foodData.foodDetails?.[key] || {}
          }));
        }

        formatted.foodform = foodData;
        console.log("Formatted food form data:", formatted.foodform);
      }

      console.log("Formatted event data:", formatted);
      console.log("Basic event data:", formatted.basicEvent);
      console.log("Food form data:", formatted.foodform);
      console.log("Transport data:", formatted.transport);
      console.log("Guest room data:", formatted.guestform);
      console.log("Communication data:", formatted.communicationdata);

      setFormattedEventData(formatted);
      setHasFormattedEvent(true);
    }
  }, [event, formattedEventData]);

  if (!isOpen || !hasFormattedEvent) return null;

  // Debug log to check rendering and foodform prop
  console.log("EndPopup rendering with:", { isOpen, loading: false, error: null, hasFormattedEvent, formattedEventData });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Event Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Event Information */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Event Name</p>
                <p className="font-medium">{formattedEventData.basicEvent.eventName || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-600">Event Type</p>
                <p className="font-medium">{formattedEventData.basicEvent.eventType || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-600">Start Date</p>
                <p className="font-medium">{formattedEventData.basicEvent.startDate || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-600">End Date</p>
                <p className="font-medium">{formattedEventData.basicEvent.endDate || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-600">Venue</p>
                <p className="font-medium">{formattedEventData.basicEvent.venue || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-medium">{formattedEventData.basicEvent.status || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Food Form Details */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Food Details</h3>
            {console.log("Passing foodform to AmenitiesForm:", formattedEventData?.foodform)}
            <AmenitiesForm foodFormData={formattedEventData.foodform} />
          </div>

          {/* Transport Details */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Transport Details</h3>
            {formattedEventData.transport && formattedEventData.transport.length > 0 ? (
              formattedEventData.transport.map((transport, index) => (
                <div key={index} className="mb-4">
                  <p><strong>Date:</strong> {transport.date}</p>
                  <p><strong>Time:</strong> {transport.time}</p>
                  <p><strong>From:</strong> {transport.from}</p>
                  <p><strong>To:</strong> {transport.to}</p>
                  <p><strong>Vehicle Type:</strong> {transport.vehicleType}</p>
                  <p><strong>Number of Vehicles:</strong> {transport.numberOfVehicles}</p>
                </div>
              ))
            ) : (
              <p>No transport details available</p>
            )}
          </div>

          {/* Guest Room Details */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Guest Room Details</h3>
            {formattedEventData.guestform && Object.keys(formattedEventData.guestform).length > 0 ? (
              <div>
                <p><strong>Date:</strong> {formattedEventData.guestform.date}</p>
                <p><strong>Department:</strong> {formattedEventData.guestform.department}</p>
                <p><strong>Designation:</strong> {formattedEventData.guestform.designation}</p>
                <p><strong>Number of Rooms:</strong> {formattedEventData.guestform.numberOfRooms}</p>
              </div>
            ) : (
              <p>No guest room details available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndPopup; 