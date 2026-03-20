import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  CalendarDays,
  Phone,
  BookOpen,
  MapPin,
  Import,
} from "lucide-react";
import axios from "axios";
import RoomSelection from "./RoomSelection";
import FormInput from "./FormInput";
import EventTypeSelection from "./EventTypeSelection";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { setEventData, clearEventData } from "../redux/EventSlice";
import { toast } from "react-toastify";

function toDateInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

const BookingForm = ({ eventData = {}, nextForm }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  
  // Check if there's an active event at the very beginning
  const endformId = localStorage.getItem('endformId');
  const currentEventId = localStorage.getItem('currentEventId');
  const hasActiveEvent = currentEventId; // Allow new event creation with just currentEventId
  
  // For new event creation, allow access to the form even without currentEventId
  // The form will be populated when the Basic Event Form creates the event
  const isNewEventCreation = !endformId && !currentEventId;
  
  // Only read from Redux if there's an active event AND it's an existing event (has endformId)
  const event = useSelector((state) => {
    if (!hasActiveEvent || !endformId) return null; // Don't read from Redux for new events
    return state.event?.event || null;
  });
  
  const guestroomData = useSelector((state) => {
    if (!hasActiveEvent || !endformId) return null; // Don't read from Redux for new events
    return state.event?.event?.guestform || null;
  });
  
  console.log("Guest Room Data in the Booking Form:", guestroomData);
  console.log("Current event data:", event);
  console.log('GuestRoom received eventData:', eventData);

  const [formData, setFormData] = useState({
    department: "",
    requestorName: "",
    empId: "",
    mobile: "",
    designation: "",
    purpose: "",
    date: "",
    guestCount: "",
    eventType: "",
    selectedRooms: [],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [commId, setCommId] = useState('');
  
  // Define canEdit at the top to avoid temporal dead zone
  const userDept = (localStorage.getItem("user_dept") || "").toLowerCase();
  const canEdit = userDept === "guestroom" || userDept === "guest department" || userDept === "guest deparment" || userDept === "iqac" || userDept === "system admin" || userDept === "communication";

  // Debug: Log form data changes
  useEffect(() => {
    console.log("Form data changed:", formData);
    console.log("canEdit:", canEdit);
    console.log("userDept:", userDept);
    console.log("Raw user_dept from localStorage:", localStorage.getItem("user_dept"));
  }, [formData, canEdit, userDept]);

  useEffect(() => {
    // Only prefill from eventData prop if we're NOT in edit mode
    const isEditMode = localStorage.getItem('isEditMode') === 'true';
    const endformId = localStorage.getItem('endformId');
    
    // Skip this effect if we're editing an existing event
    if (isEditMode || endformId) {
      console.log("GuestRoom - Skipping eventData prop effect due to edit mode or existing event");
      return;
    }
    
    console.log("eventData prop changed:", eventData);
    if (eventData && Object.keys(eventData).length > 0) {
      const formattedDate = eventData.date 
        ? new Date(eventData.date).toISOString().split('T')[0]
        : '';
      console.log("Setting form data from eventData prop:", eventData);
      setFormData(prevData => ({
        ...prevData,
        ...eventData,
        date: formattedDate,
        selectedRooms: eventData.selectedRooms || [],
      }));
      console.log("Set isEditMode to true from eventData prop");
    }
  }, [eventData]);

  // Reset form when starting a new event
  useEffect(() => {
    const currentEventId = localStorage.getItem("currentEventId");
    const guestRoomFormId = localStorage.getItem("guestRoomFormId");
    const isEditMode = localStorage.getItem('isEditMode') === 'true';
    const endformId = localStorage.getItem('endformId');
    
    // Skip this effect if we're editing an existing event
    if (isEditMode || endformId) {
      console.log("GuestRoom - Skipping reset effect due to edit mode or existing event");
      return;
    }
    
    // If we have a currentEventId but no guestRoomFormId, we're creating a new event
    if (currentEventId && !guestRoomFormId) {
      console.log("New event creation detected, resetting form data");
      setFormData({
        department: "",
        requestorName: "",
        empId: "",
        mobile: "",
        designation: "",
        purpose: "",
        date: "",
        guestCount: "",
        eventType: "",
        selectedRooms: [],
      });
    }
  }, [location.pathname]);

  useEffect(() => {
    // Only read from common_data if we're NOT in edit mode and NOT creating a new event
    const isEditMode = localStorage.getItem('isEditMode') === 'true';
    const endformId = localStorage.getItem('endformId');
    const currentEventId = localStorage.getItem('currentEventId');
    
    // Skip this effect if we're editing an existing event
    if (isEditMode || endformId) {
      console.log("GuestRoom - Skipping common_data effect due to edit mode or existing event");
      return;
    }
    
    const local = JSON.parse(localStorage.getItem("common_data"));

    if (local) {
      const eventData = local;
      // Format the date to yyyy-MM-dd
      const formattedDate = eventData.startDate 
        ? new Date(eventData.startDate).toISOString().split('T')[0]
        : '';

      setFormData((prevData) => ({
        ...prevData,
        iqacNumber: eventData.iqacNumber || "",
        eventName: eventData.eventName || "",
        eventType: eventData.eventType?.trim()
          ? eventData.eventType
          : "common event",
        date: formattedDate,
        department: eventData.departments
          ? eventData.departments.join(", ")
          : "",
        requestorName: eventData.organizers.name || "",
        empId: eventData.organizers.employeeId || "",
        designation: eventData.organizers.designation || "",
        mobile: eventData.organizers.phone || "",
        purpose: eventData.description,
      }));
    }
  }, [location.pathname]);

  useEffect(() => {
    // Check if there's an active event first
    const endformId = localStorage.getItem("endformId");
    const guestRoomFormId = localStorage.getItem("guestRoomFormId");
    const currentEventId = localStorage.getItem("currentEventId");
    const isEditMode = localStorage.getItem('isEditMode') === 'true';
    
    console.log("=== GUEST ROOM FORM DEBUG ===");
    console.log("endformId:", endformId);
    console.log("currentEventId:", currentEventId);
    console.log("isEditMode:", isEditMode);
    console.log("All localStorage keys:", Object.keys(localStorage));
    console.log("guestRoomForm in localStorage:", localStorage.getItem('guestRoomForm'));
    console.log("guestRoomFormId in localStorage:", localStorage.getItem('guestRoomFormId'));
    
    // Check if we're in edit mode or have an active event
    if (!currentEventId && !endformId && !isEditMode) {
      console.log("GuestRoom - No active event found, starting with empty form for new event creation");
      // For new event creation, start with empty form
      setFormData({
        department: "",
        requestorName: "",
        empId: "",
        mobile: "",
        designation: "",
        purpose: "",
        date: "",
        guestCount: "",
        eventType: "",
        selectedRooms: [],
      });
      return;
    }
    
    // If we have an endformId OR isEditMode is true OR currentEventId, this is an existing event being edited
    if (endformId || isEditMode || currentEventId) {
      // Check if we have unsaved changes (user was actively editing)
      const existingFormData = localStorage.getItem('guestRoomForm');
      const hasUnsavedChanges = localStorage.getItem('guestRoomHasUnsavedChanges') === 'true';
      
      if (existingFormData && hasUnsavedChanges) {
        console.log("Using existing form data from localStorage (unsaved changes)");
        const parsedData = JSON.parse(existingFormData);
        setFormData(prevData => ({
          ...prevData,
          ...parsedData,
          date: parsedData.date ? new Date(parsedData.date).toISOString().split('T')[0] : '',
          selectedRooms: parsedData.selectedRooms || [],
        }));
        return; // Don't fetch from server if we have unsaved changes
      }
      
      // Check if we have guest room form data in localStorage (set by Edit button)
      const storedGuestRoomForm = localStorage.getItem('guestRoomForm');
      console.log("GuestRoom - Checking for stored guest room form data");
      console.log("GuestRoom - storedGuestRoomForm exists:", !!storedGuestRoomForm);
      console.log("GuestRoom - All localStorage keys:", Object.keys(localStorage));
      console.log("GuestRoom - guestRoomForm value:", storedGuestRoomForm);
      if (storedGuestRoomForm) {
        try {
          console.log("GuestRoom - Using stored guest room form data from localStorage");
          console.log("GuestRoom - Raw stored data:", storedGuestRoomForm);
          const parsedGuestData = JSON.parse(storedGuestRoomForm);
          console.log("GuestRoom - Parsed guest room data:", parsedGuestData);
          console.log("GuestRoom - Parsed data keys:", Object.keys(parsedGuestData));
          console.log("GuestRoom - Sample values:", {
            department: parsedGuestData.department,
            requestorName: parsedGuestData.requestorName,
            date: parsedGuestData.date,
            guestCount: parsedGuestData.guestCount
          });
          
          // Check if we have valid guest room data
          if (!parsedGuestData || Object.keys(parsedGuestData).length === 0) {
            console.log("GuestRoom - No valid guest room data found in localStorage, skipping");
            return;
          }
          
          // Format the data to match our form structure
          const formattedData = {
            department: parsedGuestData.department || "",
            requestorName: parsedGuestData.requestorName || "",
            empId: parsedGuestData.empId || "",
            mobile: parsedGuestData.mobile || "",
            designation: parsedGuestData.designation || "",
            purpose: parsedGuestData.purpose || "",
            date: parsedGuestData.date ? new Date(parsedGuestData.date).toISOString().split('T')[0] : "",
            guestCount: parsedGuestData.guestCount || "",
            eventType: parsedGuestData.eventType || "",
            selectedRooms: parsedGuestData.selectedRooms || [],
            _id: parsedGuestData._id || "",
          };
          
          console.log("GuestRoom - Final formatted data:", formattedData);
          setFormData(formattedData);
          console.log("GuestRoom - Set form data with localStorage data:", formattedData);
          return;
        } catch (error) {
          console.error("GuestRoom - Error parsing stored guest room form data:", error);
        }
      } else {
        console.log("GuestRoom - No guestRoomForm data found in localStorage");
      }
      
      // Only fetch data if there's an actual event being created and no localStorage data
      const fetchAndPrefill = async () => {
        try {
          console.log("GuestRoom - Fetching data for editing from endformId:", endformId);
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/endform/${endformId}`);
          console.log("GuestRoom - Response from endform:", response.data);
          
          if (response.data && response.data.guestform) {
            const guestData = response.data.guestform;
            console.log("GuestRoom - Found guest room data:", guestData);
            
            // Format the data to match our form structure
            const formattedData = {
              department: guestData.department || "",
              requestorName: guestData.requestorName || "",
              empId: guestData.empId || "",
              mobile: guestData.mobile || "",
              designation: guestData.designation || "",
              purpose: guestData.purpose || "",
              date: guestData.date ? new Date(guestData.date).toISOString().split('T')[0] : "",
              guestCount: guestData.guestCount || "",
              eventType: guestData.eventType || "",
              selectedRooms: guestData.selectedRooms || [],
              _id: guestData._id || "",
            };
            
            setFormData(formattedData);
            console.log("GuestRoom - Set form data with formatted data:", formattedData);
          } else {
            console.log("GuestRoom - No existing guest room data found, starting with empty form");
            setFormData({
              department: "",
              requestorName: "",
              empId: "",
              mobile: "",
              designation: "",
              purpose: "",
              date: "",
              guestCount: "",
              eventType: "",
              selectedRooms: [],
            });
          }
        } catch (error) {
          console.error("GuestRoom - Error fetching guest room data:", error);
          setFormData({
            department: "",
            requestorName: "",
            empId: "",
            mobile: "",
            designation: "",
            purpose: "",
            date: "",
            guestCount: "",
            eventType: "",
            selectedRooms: [],
          });
        }
      };
      fetchAndPrefill();
    } else {
      // This is a new event creation - ensure form is empty
      console.log("GuestRoom - New event creation, starting with empty form");
      setFormData({
        department: "",
        requestorName: "",
        empId: "",
        mobile: "",
        designation: "",
        purpose: "",
        date: "",
        guestCount: "",
        eventType: "",
        selectedRooms: [],
      });
    }
  }, [location.pathname]);

  // Add a function to refresh form data from backend
  const refreshFormData = async () => {
    const endformId = localStorage.getItem("endformId");
    const guestRoomFormId = localStorage.getItem("guestRoomFormId");
    
    console.log("Refreshing form data - endformId:", endformId, "guestRoomFormId:", guestRoomFormId);
    
    if (!endformId && !guestRoomFormId) return;
    
    try {
      // First try to get data from Endform
      if (endformId) {
        console.log("Fetching from Endform...");
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/endform/${endformId}`);
        console.log("Endform response:", response.data);
        if (response.data && response.data.guestform) {
          const guestData = response.data.guestform;
          console.log("Found guest data in Endform:", guestData);
          setFormData(prevData => ({
            ...prevData,
            ...guestData,
            date: guestData.date ? new Date(guestData.date).toISOString().split('T')[0] : '',
            selectedRooms: guestData.selectedRooms || [],
          }));
          return;
        }
      }
      
      // If Endform doesn't have data, try direct guest room fetch
      if (guestRoomFormId) {
        console.log("Fetching from direct guest room...");
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/guestroom/bookings/${guestRoomFormId}`);
        console.log("Direct guest room response:", response.data);
        if (response.data) {
          const guestData = response.data;
          console.log("Found guest data from direct fetch:", guestData);
          setFormData(prevData => ({
            ...prevData,
            ...guestData,
            date: guestData.date ? new Date(guestData.date).toISOString().split('T')[0] : '',
            selectedRooms: guestData.selectedRooms || [],
          }));
        }
      }
    } catch (err) {
      console.error("Error refreshing form data:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Mark that there are unsaved changes
    localStorage.setItem('guestRoomHasUnsavedChanges', 'true');
  };

  const handleRoomChange = (roomId) => {
    console.log("Room Id in the Index form:", roomId);
    setFormData((prev) => {
      const updatedSelectedRooms = prev.selectedRooms.includes(roomId)
        ? prev.selectedRooms.filter((id) => id !== roomId)
        : [...prev.selectedRooms, roomId];

      console.log("Updated selectedRooms:", updatedSelectedRooms);
      return {
        ...prev,
        selectedRooms: updatedSelectedRooms,
      };
    });
    
    // Mark that there are unsaved changes
    localStorage.setItem('guestRoomHasUnsavedChanges', 'true');
  };

  const handleSubmit = async (e) => {
    console.log("=== GUEST ROOM FORM SUBMIT CALLED ===");
    console.log("canEdit:", canEdit);
    console.log("userDept:", userDept);
    
    if (!canEdit) {
      console.log("User cannot edit, returning");
      return;
    }
    
    if (e && e.preventDefault) {
      e.preventDefault();
      console.log("preventDefault called");
    } else {
      console.log("No event object or preventDefault not available");
    }
    
    setIsLoading(true);

    // Frontend validation for required field
    if (!formData.eventType || formData.eventType.trim() === "") {
      toast.error("Event Type is required.");
      setIsLoading(false);
      return;
    }

    try {
      // Check if we have guest room data from Redux or localStorage
      const guestRoomFromStorage = JSON.parse(localStorage.getItem("guestRoomForm")) || {};
      const guestRoomId = localStorage.getItem("guestRoomFormId");
      
      const isUpdating = (localStorage.getItem('isEditMode') === 'true' || localStorage.getItem('endformId')) && (guestroomData?._id || guestRoomId);
      console.log("isEditMode:", isUpdating);
      console.log("guestroomData:", guestroomData);
      console.log("guestRoomFromStorage:", guestRoomFromStorage);
      console.log("guestRoomId:", guestRoomId);
      console.log("isUpdating:", isUpdating);
      
      let url;
      let method;

      if (isUpdating) {
        const updateId = guestroomData?._id || guestRoomId;
        url = `${import.meta.env.VITE_API_URL}/guestroom/bookings/${updateId}`;
        method = 'PUT';
      } else {
        url = `${import.meta.env.VITE_API_URL}/guestroom/bookings`;
        method = 'POST';
      }

      // Format the date before sending
      const submitData = {
        ...formData,
        date: formData.date ? new Date(formData.date).toISOString() : null
      };

      console.log("Submitting guest room data:", submitData);
      console.log("Is update mode:", isUpdating);
      console.log("Request URL:", url);
      console.log("Request method:", method);

      // Get authentication token
      const token = localStorage.getItem('token');
      console.log("Auth token:", token ? "Present" : "Missing");

      const response = await axios({
        method,
        url,
        data: submitData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Server response status:", response.status);
      console.log("Server response data:", response.data);

      if (response.data) {
        // The backend sends the booking object directly
        const updatedBooking = response.data;
        
        if (updatedBooking._id) {
          // Update localStorage with the response data from backend
          const guestRoom = {
            ...updatedBooking
          };
          localStorage.setItem("guestRoomForm", JSON.stringify(guestRoom));
          localStorage.setItem('guestRoomFormId', updatedBooking._id);
          
          // Clear the unsaved changes flag since data was successfully saved
          localStorage.removeItem('guestRoomHasUnsavedChanges');

          if (isUpdating) {
            toast.success("Guest room updated successfully");
            
            // Update the form data with the response from server
            setFormData(prevData => ({
              ...prevData,
              ...updatedBooking,
              date: updatedBooking.date ? new Date(updatedBooking.date).toISOString().split('T')[0] : '',
              selectedRooms: updatedBooking.selectedRooms || [],
            }));
            
            // Update Redux state with the latest guest room data
            const currentEvent = event || {};
            const updatedEvent = {
              ...currentEvent,
              guestform: updatedBooking
            };
            dispatch(setEventData(updatedEvent));
            
            // Update the main event to link the updated guest room form
            const eventId = localStorage.getItem("currentEventId");
            if (eventId) {
              // Check if eventId is a valid MongoDB ObjectId (24 hex characters)
              const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(eventId);
              if (!isValidObjectId) {
                console.error('Invalid event ID format:', eventId);
                toast.error('Invalid event ID. Please start from the Basic Event form.');
                return;
              }
              
              try {
                await axios.put(
                  `${import.meta.env.VITE_API_URL}/event/${eventId}`,
                  { guestform: updatedBooking._id }
                );
              } catch (err) {
                console.error('Failed to link updated guest room form to main event:', err);
                toast.error('Failed to link guest room form to main event. Please contact support if this persists.');
              }
                         } else {
               console.error('No event ID found in basicEvent');
               toast.error('No event ID found. Please start from the Basic Event form and create an event first.');
               return;
             }
            
            // Update the Endform with the updated guest room form ID
            const endformId = localStorage.getItem('endformId');
            if (endformId) {
              try {
                await axios.put(
                  `${import.meta.env.VITE_API_URL}/endform/${endformId}`,
                  { guestform: updatedBooking._id }
                );
              } catch (err) {
                console.error('Failed to link updated guest room form to endform:', err);
              }
            }
            
            // Refresh form data from backend after successful update
            await refreshFormData();
            
            // Navigate after successful update
            setTimeout(() => {
              if (nextForm) {
                navigate(nextForm);
              } else {
                console.log("Navigating to end form");
                navigate("/forms/end");
              }
            }, 1000);
          } else {
            toast.success("Guest room form saved successfully");
            
            // After creating the guest room form, save the ID for EndForm
            const subFormId = updatedBooking._id;
            
            // Save the guestRoomFormId for EndForm
            if (subFormId) {
              localStorage.setItem('guestRoomFormId', subFormId);
              console.log('Saved guestRoomFormId to localStorage:', subFormId);
            } else {
              console.error('No guest room subFormId after creation!');
            }
            
            // Only try to update End Form if it exists (for existing events)
            const endformId = localStorage.getItem('endformId');
            if (subFormId && endformId) {
              console.log('About to PUT to Endform:', { endformId, subFormId });
              try {
                await axios.put(
                  `${import.meta.env.VITE_API_URL}/endform/${endformId}`,
                  { guestform: subFormId }
                );
                console.log('Successfully updated End Form with guest room ID');
              } catch (err) {
                console.error('Failed to update Endform with guest room ID:', err);
                // Don't show error toast for new events - this is expected
                if (endformId) {
                  toast.error('Failed to link guest room form to event. Please contact support if this persists.');
                }
              }
            } else {
              if (!subFormId) {
                console.error('No guest room subFormId after creation!');
              }
              if (!endformId) {
                console.log('No endformId in localStorage - this is expected for new events');
              }
            }
            
            // Always try to update the main event with the new guestform ID
            const eventId = localStorage.getItem("currentEventId");
            if (subFormId && eventId) {
              // Check if eventId is a valid MongoDB ObjectId (24 hex characters)
              const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(eventId);
              if (!isValidObjectId) {
                console.error('Invalid event ID format:', eventId);
                toast.error('Invalid event ID. Please start from the Basic Event form.');
                return;
              }
              
              try {
                await axios.put(
                  `${import.meta.env.VITE_API_URL}/event/${eventId}`,
                  { guestform: subFormId }
                );
              } catch (err) {
                console.error('Failed to link guest room form to main event:', err);
                toast.error('Failed to link guest room form to main event. Please contact support if this persists.');
              }
                         } else if (!eventId) {
               console.error('No event ID found in basicEvent');
               toast.error('No event ID found. Please start from the Basic Event form and create an event first.');
               return;
             }
            
            setTimeout(() => {
              if (nextForm) {
                navigate(nextForm);
              } else {
                console.log("Navigating to end form");
                navigate("/forms/end");
              }
            }, 1000);
          }
        } else {
          console.error("No ID in response:", response.data);
          toast.success("Guest room form updated successfully");
        }
      } else {
        console.error("Invalid response:", response);
        toast.error("Failed to save form. Invalid server response.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.message || "There was an error submitting the form. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const endformId = localStorage.getItem('endformId');
    const currentEventId = localStorage.getItem('currentEventId');
    if (!endformId || !currentEventId) {
      dispatch(clearEventData());
      localStorage.removeItem('guestRoomFormId');
      localStorage.removeItem('guestRoomForm');
      // Also clear the form state
      setFormData({
        department: "",
        requestorName: "",
        empId: "",
        mobile: "",
        designation: "",
        purpose: "",
        date: "",
        guestCount: "",
        eventType: "",
        selectedRooms: [],
      });
    }
  }, []);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      const endformId = localStorage.getItem('endformId');
      const currentEventId = localStorage.getItem('currentEventId');
      if (!endformId || !currentEventId) {
        dispatch(clearEventData());
      }
    };
  }, []);

  console.log("=== GUEST ROOM FORM RENDER DEBUG ===");
  console.log("formData:", formData);
  console.log("canEdit:", canEdit);
  console.log("userDept:", userDept);
  console.log("department value:", formData.department);
  console.log("requestorName value:", formData.requestorName);
  console.log("guestRoomForm in localStorage:", localStorage.getItem('guestRoomForm'));
  console.log("isEditMode in localStorage:", localStorage.getItem('isEditMode'));
  console.log("endformId in localStorage:", localStorage.getItem('endformId'));
  console.log("currentEventId in localStorage:", localStorage.getItem('currentEventId'));
  
  return (
    <div className="min-h-screen px-2 py-4 sm:px-4 lg:px-6">
      {isLoading && (
        <div className="flex h-screen items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-indigo-500"></div>
        </div>
      )}

      <div className="max-w-full mx-auto">
        <div className="overflow-hidden">
          <div className="mb-6 rounded-xl bg-indigo-100/70 px-4 py-3 text-sm font-medium text-indigo-800">
            Form 5: Guest House Booking
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="xl:grid xl:grid-cols-3 gap-6">
              <FormInput
                icon={<BookOpen />}
                label="Department/Centre"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="Enter department name"
                disabled={!canEdit}
              />

              <FormInput
                icon={<Users />}
                label="Requestor Name"
                name="requestorName"
                value={formData.requestorName}
                onChange={handleInputChange}
                placeholder="Enter your name"
                disabled={!canEdit}
              />

              <FormInput
                label="Employee ID"
                name="empId"
                value={formData.empId}
                onChange={handleInputChange}
                placeholder="Enter employee ID"
                disabled={!canEdit}
              />

              <FormInput
                icon={<Phone />}
                label="Mobile Number"
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder="Enter mobile number"
                disabled={!canEdit}
              />

              <FormInput
                icon={<MapPin />}
                label="Designation & Department"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                placeholder="Enter designation"
                className="md:col-span-2"
                disabled={!canEdit}
              />

              <div className="">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className="border border-black p-2 rounded focus:outline-none focus:ring-2 focus:ring-black w-96"
                  rows={3}
                  placeholder="Enter purpose of booking"
                  disabled={!canEdit}
                />
              </div>

              <FormInput
                icon={<CalendarDays />}
                label="Date"
                name="date"
                type="date"
                value={toDateInputValue(formData.date)}
                onChange={handleInputChange}
                disabled={!canEdit}
              />

              <FormInput
                icon={<Users />}
                label="Number of Guests"
                name="guestCount"
                type="number"
                min="1"
                value={formData.guestCount}
                onChange={handleInputChange}
                placeholder="Enter number of guests"
                disabled={!canEdit}
              />

              <FormInput
                label="Event Type"
                name="eventType"
                value={formData.eventType}
                onChange={handleInputChange}
                placeholder="Enter event type"
                disabled={!canEdit}
              />
            </div>

            <RoomSelection
              selectedRooms={formData.selectedRooms || []}
              onRoomChange={handleRoomChange}
              disabled={!canEdit}
            />

            <div className="mt-8 flex justify-end p-6">
              <button
                type="submit"
                className="h-10 rounded-md bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                disabled={!canEdit}
              >
                Save and Go Next
              </button>
            </div>
          </form>

          {["guestroom", "guest deparment", "system admin", "iqac", "IQAC"].includes((userDept || "").toLowerCase()) && (
            <div className="mt-2 flex justify-end gap-4">
              <button
                type="button"
                className="h-10 rounded-md border border-indigo-300 bg-white px-6 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                onClick={() => {
                  if (guestroomData) {
                    setFormData({
                      ...formData,
                      ...guestroomData,
                      selectedRooms: guestroomData.selectedRooms || [],
                    });
                  }
                }}
                disabled={!canEdit}
              >
                Load Existing Guest Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
