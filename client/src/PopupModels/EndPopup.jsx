import React, { useEffect, useState } from "react";
import EventBasic from "./EventBasic";
import EventBasic2 from "./EventBasic2";
import CommunicationMedia from "./CommunicationMedia";
import AmenitiesForm from "./AmenitiesForm";
import Guestroom from "./GuestRoom";
import TransportRequisition from "./TransportRequisition";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { updateEvent } from "../redux/eventsSlice";

const EndPopup = ({ event, onClose, isOpen }) => {
  const [formattedEvent, setFormattedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    const processEventData = async () => {
      console.log("=== EndPopup Debug ===");
      console.log("isOpen:", isOpen);
      console.log("Raw event data:", event);
      console.log("Event type:", typeof event);
      console.log("Event keys:", event ? Object.keys(event) : "No event");

      if (!isOpen) {
        console.log("Popup is not open, returning");
        return;
      }

      if (!event) {
        console.error("No event data provided");
        setError("No event data provided");
        setLoading(false);
        return;
      }

      try {
        console.log("Processing event data...");
        
        // Format the event data to match the expected field names
        const formatted = {
          basicEvent: {
            eventName: event.eventName || event.basicEvent?.eventName || event.eventdata?.eventName || "N/A",
            eventType: event.eventType || event.basicEvent?.eventType || event.eventdata?.eventType || "N/A",
            startDate: event.startDate || event.basicEvent?.startDate || event.eventdata?.startDate || "N/A",
            endDate: event.endDate || event.basicEvent?.endDate || event.eventdata?.endDate || "N/A",
            startTime: event.startTime || event.basicEvent?.startTime || event.eventdata?.startTime || "N/A",
            endTime: event.endTime || event.basicEvent?.endTime || event.eventdata?.endTime || "N/A",
            eventVenue: event.eventVenue || event.basicEvent?.eventVenue || event.eventdata?.eventVenue || event.venue || "N/A",
            academicdepartment: event.academicdepartment || event.basicEvent?.academicdepartment || event.eventdata?.academicdepartment || ["N/A"],
            expectedGuests: event.expectedGuests || event.basicEvent?.expectedGuests || event.eventdata?.expectedGuests || "N/A",
            budget: event.budget || event.basicEvent?.budget || event.eventdata?.budget || "N/A",
            description: event.description || event.basicEvent?.description || event.eventdata?.description || "N/A",
            status: event.status || event.basicEvent?.status || event.eventdata?.status || "N/A",
            // Add missing fields for EventBasic2
            iqacNumber: event.iqacNumber || event.basicEvent?.iqacNumber || event.eventdata?.iqacNumber || "N/A",
            organizers: event.organizers || event.basicEvent?.organizers || event.eventdata?.organizers || [],
            resourcePersons: event.resourcePersons || event.basicEvent?.resourcePersons || event.eventdata?.resourcePersons || [],
            year: event.year || event.basicEvent?.year || event.eventdata?.year || "N/A",
            categories: event.categories || event.basicEvent?.categories || event.eventdata?.categories || [],
            professional: event.professional || event.basicEvent?.professional || event.eventdata?.professional || [],
            logos: event.logos || event.basicEvent?.logos || event.eventdata?.logos || [],
            departments: event.departments || event.basicEvent?.departments || event.eventdata?.departments || []
          },
          transport: Array.isArray(event.transport) ? event.transport : [event.transport].filter(Boolean),
          foodform: event.foodForm || event.foodform || null,
          guestform: event.guestform || {},
          communicationdata: event.communicationdata || event.communicationform || {}
        };
        
        console.log("=== EndPopup Data Processing Debug ===");
        console.log("Original event data:", event);
        console.log("Original event keys:", Object.keys(event));
        console.log("Formatted basic event:", formatted.basicEvent);
        console.log("Formatted transport:", formatted.transport);
        console.log("Formatted foodform:", formatted.foodform);
        console.log("Formatted guestform:", formatted.guestform);
        console.log("Formatted communicationdata:", formatted.communicationdata);

        // Process transport data
        if (formatted.transport && formatted.transport.length > 0) {
          formatted.transport = formatted.transport.map(transport => ({
            ...transport,
            travelDetails: {
              ...transport.travelDetails,
              pickUpDateTime: transport.travelDetails?.pickUpDateTime ? new Date(transport.travelDetails.pickUpDateTime).toISOString() : null,
              dropDateTime: transport.travelDetails?.dropDateTime ? new Date(transport.travelDetails.dropDateTime).toISOString() : null
            }
          }));
        }

        // Process food form data
        if (formatted.foodform) {
          console.log("Raw food form data:", formatted.foodform);
          console.log("Food form data type:", typeof formatted.foodform);
          console.log("Food form data keys:", Object.keys(formatted.foodform));

          // If foodform is an ID, fetch the actual food form data
          if (typeof formatted.foodform === 'string') {
            try {
              const foodResponse = await axios.get(
                `${import.meta.env.VITE_API_URL}/food/${formatted.foodform}`
              );
              formatted.foodform = foodResponse.data;
              console.log("Fetched food form data:", foodResponse.data);
            } catch (error) {
              console.error("Error fetching food form data:", error);
              formatted.foodform = {};
            }
          }

          // Create a deep copy to avoid read-only property issues
          const foodFormCopy = JSON.parse(JSON.stringify(formatted.foodform));

          // Patch: Ensure all dateObj.date are objects with start/end
          if (Array.isArray(foodFormCopy.dates)) {
            foodFormCopy.dates = foodFormCopy.dates.map(dateObj => {
              if (typeof dateObj.date === 'string') {
                return {
                  ...dateObj,
                  date: { start: dateObj.date, end: dateObj.date }
                };
              }
              return dateObj;
            });
          }

          // Create a new food form object with the correct structure
          const newFoodForm = {
            ...foodFormCopy,
            dates: Array.isArray(foodFormCopy.dates) 
              ? foodFormCopy.dates 
              : typeof foodFormCopy.dates === 'object'
                ? Object.entries(foodFormCopy.dates || {}).map(([date, _]) => ({
                    date: date,
                    foodDetails: foodFormCopy.foodDetails?.[date] || {}
                  }))
                : []
          };

          formatted.foodform = newFoodForm;
          
          console.log("=== Food Form Processing Debug ===");
          console.log("Original food form dates:", formatted.foodform.dates);
          console.log("Original food form foodDetails:", formatted.foodform.foodDetails);
          console.log("Processed food form:", newFoodForm);
        }

        console.log("Processed food form data:", formatted.foodform);
        console.log("Formatted event data:", formatted);
        console.log("Basic event data:", formatted.basicEvent);
        console.log("Food form data:", formatted.foodform);
        console.log("Transport data:", formatted.transport);
        console.log("Guest room data:", formatted.guestform);
        console.log("Communication data:", formatted.communicationdata);
        
        // Additional debugging for guest room data
        if (formatted.guestform) {
          console.log("Guest room data structure:", Object.keys(formatted.guestform));
          console.log("Guest room data values:", formatted.guestform);
        }
        
        setFormattedEvent(formatted);
        setLoading(false);
      } catch (err) {
        console.error("Error formatting event data:", err);
        setError("Failed to format event data: " + err.message);
        setLoading(false);
      }
    };

    processEventData();
  }, [event, isOpen]);

  // Debug render
  console.log("EndPopup rendering with:", {
    isOpen,
    loading,
    error,
    hasFormattedEvent: !!formattedEvent,
    formattedEventData: formattedEvent
  });

  if (!isOpen) {
    console.log("Popup is not open, returning null");
    return null;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Loading Event Details...</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!formattedEvent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-red-500">No event data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Event Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {formattedEvent.basicEvent && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Basic Event Information</h3>
              <EventBasic eventData={formattedEvent.basicEvent} />
            </div>
          )}

          {formattedEvent.basicEvent && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Additional Event Information</h3>
              <EventBasic2 eventData={formattedEvent.basicEvent} />
            </div>
          )}

          {formattedEvent.communicationdata && Object.keys(formattedEvent.communicationdata).length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Communication Details</h3>
              <CommunicationMedia Communicationform={formattedEvent.communicationdata} />
            </div>
          )}

          {formattedEvent.transport && formattedEvent.transport.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Transport Details</h3>
              <TransportRequisition transportData={formattedEvent.transport} />
            </div>
          )}

          {formattedEvent.foodform && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Food and Amenities</h3>
              <AmenitiesForm foodFormData={formattedEvent.foodform} />
            </div>
          )}

          {formattedEvent.guestform && Object.keys(formattedEvent.guestform).length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Guest Room Details</h3>
              <Guestroom guestroomData={formattedEvent.guestform} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EndPopup;
