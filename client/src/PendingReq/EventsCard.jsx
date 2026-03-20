import { useState, useEffect } from "react";
import {jwtDecode} from "jwt-decode";
import axios from "axios";
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  MapPinIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Modal from 'react-modal';

import EndPopup from "../PopupModels/EndPopup";
import Forms from "../Components/Form";
import { toast,ToastContainer } from "react-toastify";
import { setEventData, resetEventState, clearEventData } from "../redux/EventSlice";

const EventsCard = ({ Events, EventPopup, onEventUpdate }) => {
  console.log("=== EventsCard Component Loading ===");
  console.log("Events received:", Events);
  console.log("EventPopup received:", EventPopup);
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [role, setRole] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [approvalStatuses, setApprovalStatuses] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("=== Checking Token ===");
    console.log("Token exists:", !!token);
    if (token) {
      const decodedToken = jwtDecode(token);
      const storedDept = localStorage.getItem("user_dept");
      console.log("JWT Token Department:", decodedToken.dept);
      console.log("LocalStorage Department:", storedDept);
      setRole("Media");
      // Use stored department from localStorage as fallback
      setUserDepartment(decodedToken.dept || storedDept || "");
      console.log("Set User Department to:", decodedToken.dept || storedDept || "");
    } else {
      console.log("No token found");
    }
  }, []);

  // Fetch approval statuses for all events
  useEffect(() => {
    const fetchApprovalStatuses = async () => {
      console.log("=== Fetching Approval Statuses ===");
      console.log("Events to check:", Events.length);
      const statuses = {};
      for (const event of Events) {
        console.log(`Checking event ${event._id}:`, event.eventName);
        try {
          const response = await axios.get(
            `/api/endform/approvals/${event._id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            }
          );
          statuses[event._id] = response.data.approvals;
          console.log(`Approval status for ${event._id}:`, response.data.approvals);
        } catch (error) {
          console.error(`Error fetching approval status for event ${event._id}:`, error);
          statuses[event._id] = {
            communication: { approved: false },
            food: { approved: false },
            transport: { approved: false },
            guestroom: { approved: false },
            iqac: { approved: false }
          };
        }
      }
      console.log("Final approval statuses:", statuses);
      setApprovalStatuses(statuses);
    };

    if (Events.length > 0) {
      fetchApprovalStatuses();
    }
  }, [Events]);

  // Add effect to refresh event data when popup is closed
  useEffect(() => {
    if (!isPopupOpen && selectedEvent) {
      // Refresh event data
      handleViewDetails(selectedEvent._id);
      // Notify parent component to refresh event list
      if (onEventUpdate) {
        onEventUpdate();
      }
    }
  }, [isPopupOpen]);

  // Helper to fetch and format event data for both details and edit
  const formatAndFetchEventData = async (eventData) => {
    // Use existing nested structure if present
    let basicEvent = eventData.basicEvent || null;
    let communicationform = eventData.communicationform || null;
    let foodform = eventData.foodform || null;
    let transport = eventData.transport || null;
    let guestroom = eventData.guestform || null;

    // If any are just IDs (strings), fetch the full object
    if (basicEvent && typeof basicEvent === 'string') {
      try {
        const basicResp = await axios.get(
          `/api/event/${basicEvent}`
        );
        basicEvent = basicResp.data;
        console.log("Fetched basic event data:", basicEvent);
      } catch (e) { 
        console.error("Error fetching basic event data:", e);
        basicEvent = {}; 
      }
    }
    if (communicationform && typeof communicationform === 'string') {
      try {
        const commResp = await axios.get(
          `/api/media/${communicationform}`
        );
        communicationform = commResp.data;
        console.log("Fetched communication form data:", communicationform);
      } catch (e) { 
        console.error("Error fetching communication form data:", e);
        communicationform = {}; 
      }
    }
    if (foodform && typeof foodform === 'string') {
      try {
        const foodResp = await axios.get(
          `/api/food/${foodform}`
        );
        // Unwrap the data property if present
        foodform = foodResp.data.data || foodResp.data;
      } catch (e) { foodform = {}; }
    }
    if (guestroom && typeof guestroom === 'string') {
      try {
        const guestResp = await axios.get(
          `/api/guestroom/bookings/${guestroom}`
        );
        guestroom = guestResp.data;
      } catch (e) { guestroom = {}; }
    }
    // If transport is an array of IDs, fetch all
    if (Array.isArray(transport) && transport.length > 0 && typeof transport[0] === 'string') {
      try {
        const transResp = await axios.get(
          `/api/transport/transports`,
          { params: { ids: transport.join(',') } }
        );
        transport = transResp.data;
      } catch (e) { /* fallback to IDs */ }
    }
    // If any are still null, try fallback to alternative keys
    if (!basicEvent && eventData.eventName) basicEvent = eventData;
    if (!basicEvent && eventData.basicEvent) basicEvent = eventData.basicEvent;
    if (!basicEvent && eventData.eventdata) basicEvent = eventData.eventdata;
    
    // Debug: Log the basic event data
    console.log("=== Basic Event Debug ===");
    console.log("basicEvent:", basicEvent);
    console.log("eventData.eventName:", eventData.eventName);
    console.log("eventData.eventType:", eventData.eventType);
    console.log("eventData.eventVenue:", eventData.eventVenue);
    console.log("eventData.basicEvent:", eventData.basicEvent);
    console.log("eventData.eventdata:", eventData.eventdata);
    
    if (!communicationform && (eventData.communicationdata || eventData.communicationForm || eventData.communicationform)) communicationform = eventData.communicationdata || eventData.communicationForm || eventData.communicationform;
    if (!foodform && (eventData.foodForm || eventData.foodform)) foodform = eventData.foodForm || eventData.foodform;
    if (!guestroom && eventData.guestform) guestroom = eventData.guestform;
    if (!transport && eventData.transport) transport = eventData.transport;

    // Ensure all data is properly formatted
    console.log("=== formatAndFetchEventData Debug ===");
    console.log("Final basicEvent:", basicEvent);
    console.log("Final communicationform:", communicationform);
    console.log("Final foodform:", foodform);
    console.log("Final guestroom:", guestroom);
    console.log("Final transport:", transport);

    return {
      basicEvent,
      communicationform: communicationform, // Keep original field name for forms
      foodform,
      transport,
      guestform: guestroom
    };
  };

  const handleViewDetails = async (eventId) => {
    console.log("=== HANDLE VIEW DETAILS CALLED ===");
    console.log("EventId:", eventId);
    try {
      let eventData;
      const eventInPopup = EventPopup.find(
        (event) => event._id === eventId || event.basicEvent?._id === eventId
      );
      console.log("Event in popup found:", !!eventInPopup);
      if (eventInPopup) {
        eventData = eventInPopup;
        console.log("Using event data from EventPopup");
      } else {
        console.log("Fetching event data from API");
        const response = await axios.get(
          `/api/event/${eventId}`
        );
        eventData = response.data;
        console.log("Fetched event data from API:", eventData);
      }
      const formattedEvent = await formatAndFetchEventData(eventData);
      console.log("[DETAILS] Event object dispatched to Redux:", formattedEvent);
      console.log("[DETAILS] Basic event data:", formattedEvent.basicEvent);
      console.log("[DETAILS] Food form data:", formattedEvent.foodform);
      console.log("[DETAILS] Communication data:", formattedEvent.communicationform);
      console.log("[DETAILS] Guest room data in formatted event:", formattedEvent.guestform);
      dispatch(setEventData(formattedEvent));
      localStorage.setItem('currentEventData', JSON.stringify(formattedEvent));
      setSelectedEvent(formattedEvent);
      setIsPopupOpen(true);
      console.log("=== POPUP SHOULD BE OPEN NOW ===");
    } catch (error) {
      console.error("Error in handleViewDetails:", error);
      toast.error("Failed to fetch event details");
    }
  };

  const handleEditClick = async (eventId) => {
    console.log("Edit clicked for eventId:", eventId);
    let eventData;
    
    try {
      // Clear Redux state first to ensure clean slate
      dispatch(resetEventState());
      
      // Clear localStorage to prevent old data from interfering
      localStorage.removeItem("common_data");
      localStorage.removeItem("basicEvent");
      localStorage.removeItem("iqacno");
      localStorage.removeItem("foodForm");
      localStorage.removeItem("guestRoomForm");
      localStorage.removeItem("transportForm");
      localStorage.removeItem("communicationForm");
      localStorage.removeItem("currentEventData");
      localStorage.removeItem("basicEventId");
      localStorage.removeItem("foodFormId");
      localStorage.removeItem("guestRoomFormId");
      localStorage.removeItem("transportFormId");
      localStorage.removeItem("communicationFormId");
      
      // Set edit mode flag to distinguish from new event creation
      localStorage.setItem('isEditMode', 'true');
      
      // Try to get the event data from the current events list first
      const currentEvent = EventPopup.find(event => event._id === eventId);
      console.log("Current event from EventPopup:", currentEvent);
      
      if (currentEvent) {
        eventData = currentEvent;
        console.log("Using event data from EventPopup");
      } else {
        // Fetch the complete endform data for this specific event
        console.log("Fetching from API endpoint:", `/api/endform/event/${eventId}`);
        const response = await axios.get(
          `/api/endform/event/${eventId}`
        );
        eventData = response.data;
        console.log("Fetched event data from API:", eventData);
      }
      
      console.log("Fetched event data for editing:", eventData);
      
      const formattedEvent = await formatAndFetchEventData(eventData);
      console.log("[EDIT] Event object dispatched to Redux:", formattedEvent);
      
      // Set the new event data in Redux
      dispatch(setEventData(formattedEvent));
      localStorage.setItem('currentEventData', JSON.stringify(formattedEvent));
      
      // Store the endform ID for forms to fetch data
      if (eventData._id) {
        localStorage.setItem('endformId', eventData._id);
        console.log("Stored endformId:", eventData._id);
      }
      
      // Store the current event ID for forms to check if there's an active event
      if (eventData._id) {
        localStorage.setItem('currentEventId', eventData._id);
        console.log("Stored currentEventId:", eventData._id);
      }
      
      // Store individual form data in localStorage for proper prefill
      if (formattedEvent.basicEvent) {
        localStorage.setItem('basicEvent', JSON.stringify(formattedEvent.basicEvent));
        localStorage.setItem('basicEventId', formattedEvent.basicEvent._id);
        console.log("Stored basicEvent:", formattedEvent.basicEvent);
      }
      if (formattedEvent.foodform) {
        localStorage.setItem('foodForm', JSON.stringify(formattedEvent.foodform));
        localStorage.setItem('foodFormId', formattedEvent.foodform._id);
        console.log("Stored foodForm:", formattedEvent.foodform);
        console.log("foodForm data structure:", Object.keys(formattedEvent.foodform));
        console.log("foodForm sample values:", {
          iqacNumber: formattedEvent.foodform.iqacNumber,
          requisitionDate: formattedEvent.foodform.requisitionDate,
          department: formattedEvent.foodform.department,
          requestorName: formattedEvent.foodform.requestorName
        });
      }
      if (formattedEvent.guestform) {
        localStorage.setItem('guestRoomForm', JSON.stringify(formattedEvent.guestform));
        localStorage.setItem('guestRoomFormId', formattedEvent.guestform._id);
        console.log("Stored guestRoomForm:", formattedEvent.guestform);
        console.log("guestRoomForm data structure:", Object.keys(formattedEvent.guestform));
        console.log("guestRoomForm sample values:", {
          department: formattedEvent.guestform.department,
          requestorName: formattedEvent.guestform.requestorName,
          date: formattedEvent.guestform.date,
          guestCount: formattedEvent.guestform.guestCount
        });
      }
      if (formattedEvent.transport && formattedEvent.transport.length > 0) {
        localStorage.setItem('transportForm', JSON.stringify(formattedEvent.transport));
        localStorage.setItem('transportFormId', formattedEvent.transport[0]._id);
        console.log("Stored transportForm:", formattedEvent.transport);
        console.log("transportForm data structure:", Object.keys(formattedEvent.transport[0]));
        console.log("transportForm sample values:", {
          departmentName: formattedEvent.transport[0].departmentName,
          requestorName: formattedEvent.transport[0].requestorName,
          eventName: formattedEvent.transport[0].eventDetails?.eventName
        });
      }
      if (formattedEvent.communicationform) {
        localStorage.setItem('communicationForm', JSON.stringify(formattedEvent.communicationform));
        localStorage.setItem('communicationFormId', formattedEvent.communicationform._id);
        console.log("Stored communicationForm:", formattedEvent.communicationform);
        console.log("communicationForm data structure:", Object.keys(formattedEvent.communicationform));
        console.log("communicationForm sample values:", {
          photography: formattedEvent.communicationform.cameraAction?.photography,
          videography: formattedEvent.communicationform.cameraAction?.videography,
          eventPoster: formattedEvent.communicationform.eventPoster
        });
      }
      
      console.log("=== EDIT DEBUG ===");
      console.log("endformId in localStorage:", localStorage.getItem('endformId'));
      console.log("communicationForm in localStorage:", localStorage.getItem('communicationForm'));
      console.log("foodForm in localStorage:", localStorage.getItem('foodForm'));
      console.log("guestRoomForm in localStorage:", localStorage.getItem('guestRoomForm'));
      console.log("transportForm in localStorage:", localStorage.getItem('transportForm'));
      console.log("All localStorage keys:", Object.keys(localStorage));
      
      navigate('/forms');
    } catch (error) {
      console.error("Error fetching event for editing:", error);
      console.error("Error details:", error.response?.data || error.message);
      console.error("Error status:", error.response?.status);
      toast.error("Failed to fetch event for editing");
    }
  };

  // Handle approval for different departments
  const handleApproval = async (eventId, department) => {
    try {
      const response = await axios.post(
        `/api/endform/approve/${department}/${eventId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      
      toast.success(response.data.message);
      
      // Refresh approval statuses
      const statusResponse = await axios.get(
        `/api/endform/approvals/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      
      setApprovalStatuses(prev => ({
        ...prev,
        [eventId]: statusResponse.data.approvals
      }));
      
      // Refresh event list
      if (onEventUpdate) {
        onEventUpdate();
      }
    } catch (error) {
      console.error(`Error approving ${department}:`, error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(`Failed to approve ${department} department`);
      }
    }
  };

  // Check if user can approve for a specific department
  const canApproveDepartment = (department) => {
    const departmentMap = {
      'communication': 'Media',
      'food': 'Food',
      'transport': 'Transport',
      'guestroom': 'Guest Deparment',
      'iqac': 'IQAC'
    };
    const canApprove = userDepartment === departmentMap[department];
    console.log(`Checking approval for ${department}:`, {
      userDepartment,
      requiredDepartment: departmentMap[department],
      canApprove
    });
    return canApprove;
  };

  // Check if all approvals are complete
  const isAllApproved = (eventId) => {
    const status = approvalStatuses[eventId];
    if (!status) return false;
    return status.communication?.approved && 
           status.food?.approved && 
           status.transport?.approved && 
           status.guestroom?.approved && 
           status.iqac?.approved;
  };

  // Check if any approval is pending
  const hasPendingApprovals = (eventId) => {
    const status = approvalStatuses[eventId];
    if (!status) return true;
    return !status.communication?.approved || 
           !status.food?.approved || 
           !status.transport?.approved || 
           !status.guestroom?.approved || 
           !status.iqac?.approved;
  };

  const handlePosterUpload = async (eventId, file) => {
    try {
      const formData = new FormData();
      formData.append("poster", file);
      formData.append("eventId", eventId);

      const response = await axios.post(
        `/api/event/upload-poster`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Poster uploaded successfully!");
      console.log(response.data);
    } catch (error) {
      console.error("Poster upload failed", error);
    }
  };

  const closePopup = () => {
    console.log("Closing popup, current selected event:", selectedEvent);
    setIsPopupOpen(false);
    setIsEditMode(false);
    setSelectedEvent(null);
    // Clear the stored data when closing
    localStorage.removeItem("common_data");
    localStorage.removeItem("basicEvent");
    localStorage.removeItem("iqacno");
    // Trigger a refresh of the event list
    if (onEventUpdate) {
      onEventUpdate();
    }
  };

  const handleDownloadPdf = async (eventId, customUrl = null) => {
    try {
      console.log('Starting PDF download for event:', eventId);
      
      // Show loading state
      toast.info('Generating PDF...', { autoClose: 2000 });
      
      // Use custom URL if provided, otherwise use default pattern
      const apiUrl = customUrl || `/api/common/download-event-pdf?eventId=${eventId}`;
      
      console.log('Full API URL:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        responseType: 'blob',
        timeout: 30000, // 30 second timeout
      });
      
      console.log('Response received:', response);
      console.log('Response data size:', response.data?.size);
      
      // Check if response is valid
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty PDF data');
      }
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event-${eventId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('PDF downloaded successfully!', { autoClose: 3000 });
      
    } catch (error) {
      console.error('PDF download error:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      
      let errorMessage = 'Failed to download PDF';
      
      if (error.response) {
        // Server responded with error
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 404) {
          errorMessage = 'Event not found';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error while generating PDF';
        } else {
          errorMessage = `Download failed (${error.response.status})`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error - please check your connection';
      } else if (error.code === 'ECONNABORTED') {
        // Timeout
        errorMessage = 'Download timed out - please try again';
      }
      
      toast.error(errorMessage, { autoClose: 5000 });
    }
  };

  // Function to handle deleting events
  const handleDeleteEvent = async (eventId) => {
    console.log("=== DELETE EVENT DEBUG ===");
    console.log("Event ID received:", eventId);
    console.log("Event ID type:", typeof eventId);
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete this event? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log("Making delete request to:", `/api/endform/${eventId}`);
      const response = await axios.delete(
        `/api/endform/${eventId}`
      );
      
      console.log("Delete response:", response);
      
      if (response.status === 200) {
        toast.success("Event deleted successfully!");
        // Refresh the event list
        if (onEventUpdate) {
          onEventUpdate();
        }
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      
      let errorMessage = "Failed to delete event";
      if (error.response?.status === 404) {
        errorMessage = "Event not found";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error while deleting event";
      }
      
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup useEffect that runs when the component unmounts
      const endformId = localStorage.getItem('endformId');
      const currentEventId = localStorage.getItem('currentEventId');
      if (!endformId || !currentEventId) {
        dispatch(clearEventData());
      }
    };
  }, [dispatch]);

  return (
    <div>
      <ToastContainer/>
      

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Events.map((event) => {
          // Always use the most complete data for display
          const eventName = event.eventName || event.basicEvent?.eventName || "";
          const eventType = event.eventType || event.basicEvent?.eventType || "";
          const participants = event.participants || event.basicEvent?.participants || "";
          const description = event.description || event.basicEvent?.description || "";
          const eventVenue = event.eventVenue || event.basicEvent?.eventVenue || event.venue || event.basicEvent?.venue || "";
          const startDate = event.startDate || event.basicEvent?.startDate || "";
          const organizers = event.organizers || event.basicEvent?.organizers || [];
          const eventId = event._id;
          const status = approvalStatuses[eventId];
          const isPending = hasPendingApprovals(eventId);
          const isApproved = isAllApproved(eventId);
          
          console.log("=== Rendering Event ===");
          console.log("Event ID:", eventId);
          console.log("Event Name:", eventName);
          console.log("User Department:", userDepartment);
          console.log("Approval Status:", status);
          console.log("Can approve guestroom:", canApproveDepartment('guestroom'));
          console.log("Guestroom approved:", status?.guestroom?.approved);
          console.log("Event for Approval:", event);
          return (
            <div
              key={event._id || event.id || Math.random().toString(36).substr(2, 9)}
              className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all border-2 ${
                isPending ? 'border-red-300' : isApproved ? 'border-green-300' : 'border-gray-200'
              } group`}
            >
              <div className="relative">
                <img
                  src={event.poster ? 
                    (event.poster.startsWith('http') ? 
                      event.poster : 
                      `http://localhost:8000${event.poster}`) 
                    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='}
                  alt={event.eventName || 'Event Image'}
                  className="w-full h-72 object-contain object-center rounded-t-xl bg-gray-100"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                  }}
                />
                <span
                  className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium ${
                    event.status === "Upcoming"
                      ? "bg-blue-100 text-blue-600"
                      : event.status === "Ongoing"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {event.status}
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-purple-600">
                    {eventType}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UsersIcon className="h-5 w-5" />
                    <span>{participants}</span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {eventName}
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                    <span>{startDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-gray-500" />
                    <span>{description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-gray-500" />
                    <span>{eventVenue}</span>
                  </div>
                </div>

                {/* Approval Status Display */}
                {status && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Approval Status:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        {status.communication?.approved ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className={status.communication?.approved ? "text-green-600" : "text-red-600"}>
                          Communication
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {status.food?.approved ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className={status.food?.approved ? "text-green-600" : "text-red-600"}>
                          Food
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {status.transport?.approved ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className={status.transport?.approved ? "text-green-600" : "text-red-600"}>
                          Transport
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {status.guestroom?.approved ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className={status.guestroom?.approved ? "text-green-600" : "text-red-600"}>
                          Guest Deparment
                        </span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        {status.iqac?.approved ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className={status.iqac?.approved ? "text-green-600" : "text-red-600"}>
                          IQAC
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://source.unsplash.com/random/100x100/?logo"
                      alt="Organizer"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-sm text-gray-600">Organized by</p>
                      <p className="font-medium">{organizers[0]?.name || 'N/A'}</p>
                    </div>
                  </div>
                  {/* Guest Department approval button - hover visible */}
                  {userDepartment === 'Guest Deparment' && !status?.guestroom?.approved && (
                    <button
                      onClick={() => handleApproval(eventId, 'guestroom')}
                      className="px-3 py-1 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Approve Guest Deparment
                    </button>
                  )}
                  
                  <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-end">

                    
                    {/* Approval Button */}
                    {console.log(`Rendering approval buttons for event ${eventId}:`, {
                      userDepartment,
                      canApproveCommunication: canApproveDepartment('communication'),
                      canApproveFood: canApproveDepartment('food'),
                      canApproveTransport: canApproveDepartment('transport'),
                      canApproveGuestroom: canApproveDepartment('guestroom'),
                      status
                    })}
                    {canApproveDepartment('communication') && !status?.communication?.approved && (
                      <button
                        onClick={() => handleApproval(eventId, 'communication')}
                        className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                      >
                        Approve Communication
                      </button>
                    )}
                    {canApproveDepartment('food') && !status?.food?.approved && (
                      <button
                        onClick={() => handleApproval(eventId, 'food')}
                        className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg"
                      >
                        Approve Food
                      </button>
                    )}
                    {canApproveDepartment('transport') && !status?.transport?.approved && (
                      <button
                        onClick={() => handleApproval(eventId, 'transport')}
                        className="px-3 py-1 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
                      >
                        Approve Transport
                      </button>
                    )}

                    {canApproveDepartment('iqac') && 
                     status?.communication?.approved && 
                     status?.food?.approved && 
                     status?.transport?.approved && 
                     status?.guestroom?.approved && 
                     !status?.iqac?.approved && (
                      <button
                        onClick={() => handleApproval(eventId, 'iqac')}
                        className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg"
                      >
                        Final IQAC Approval
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        // Use the same ID resolution logic as PDF download
                        const id = event._id || event.eventdata || event.basicEvent?._id || event.id || event.endformId;
                        console.log("Delete button clicked for event:", event);
                        console.log("Available IDs:", {
                          _id: event._id,
                          eventdata: event.eventdata,
                          basicEventId: event.basicEvent?._id,
                          id: event.id,
                          endformId: event.endformId
                        });
                        console.log("Selected ID for deletion:", id);
                        
                        if (!id) {
                          console.error("No valid ID found for deletion");
                          toast.error("Cannot delete: Event ID not found");
                          return;
                        }
                        
                        handleDeleteEvent(id);
                      }}
                      className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        if (event._id) {
                          handleEditClick(event._id);
                        } else {
                          console.warn('No event ID found for event:', event);
                          toast.warn('Cannot edit: Event is missing its ID.');
                        }
                      }}
                      className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        console.log("=== DETAILS BUTTON CLICKED ===");
                        console.log("Event ID:", event._id);
                        handleViewDetails(event._id);
                      }}
                      className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    >
                      Details
                    </button>
                    {/* Debug log for transport */}
                    {console.log('Transport data:', event.transport)}
                    <label className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer">
                      Upload Poster
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          handlePosterUpload(event._id, e.target.files[0])
                        }
                      />
                    </label>
                    <button
                      onClick={() => {
                        console.log('=== DOWNLOAD PDF DEBUG ===');
                        console.log('Using relative API URLs with proxy configuration');
                        console.log('Full event object:', event);
                        console.log('event._id:', event._id);
                        console.log('event.basicEvent?._id:', event.basicEvent?._id);
                        console.log('event.id:', event.id);
                        console.log('event.eventdata:', event.eventdata);
                        console.log('Available IDs in event:', {
                          _id: event._id,
                          id: event.id,
                          basicEventId: event.basicEvent?._id,
                          endformId: event.endformId,
                          eventdata: event.eventdata
                        });
                        
                        // Try multiple possible ID fields - prioritize endform ID
                        const id = event._id || event.eventdata || event.basicEvent?._id || event.id || event.endformId;
                        console.log('Selected ID for download:', id);
                        
                        if (!id) {
                          toast.error('No valid event ID found for PDF download');
                          return;
                        }
                        
                        // Use the proxy configuration from vite.config.js
                        const pdfUrl = `/api/common/download-event-pdf?eventId=${id}`;
                        console.log('PDF URL:', pdfUrl);
                        handleDownloadPdf(id, pdfUrl);
                      }}
                      className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isPopupOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <EndPopup 
            event={selectedEvent} 
            onClose={closePopup}
            isOpen={isPopupOpen}
          />
        </div>
      )}
    </div>
  );
};

export default EventsCard;
