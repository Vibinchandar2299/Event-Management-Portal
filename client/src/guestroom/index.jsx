import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  CalendarDays,
  Phone,
  BookOpen,
  MapPin,
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

  const getBasicSourceData = () => {
    try {
      const hasFormsFlowSession = sessionStorage.getItem('formsFlowActive') === 'true';
      if (!hasFormsFlowSession) {
        return {};
      }

      const currentEventData = JSON.parse(localStorage.getItem("currentEventData") || "null");
      const basicFromCurrent = currentEventData?.basicEvent || null;
      const basicFromStorage = JSON.parse(localStorage.getItem("basicEvent") || "null");
      const basicFromCommon = JSON.parse(localStorage.getItem("common_data") || "null");

      const hasUsableBasicData = (obj) => {
        if (!obj || typeof obj !== "object") return false;
        return Boolean(
          obj.iqacNumber ||
          obj.eventName ||
          obj.eventType ||
          obj.departments ||
          obj.organizers
        );
      };

      if (hasUsableBasicData(basicFromCurrent)) return basicFromCurrent;
      if (hasUsableBasicData(basicFromStorage)) return basicFromStorage;
      if (hasUsableBasicData(basicFromCommon)) return basicFromCommon;
      return {};
    } catch {
      return {};
    }
  };

  const getPrimaryOrganizer = (source) => {
    if (Array.isArray(source?.organizers) && source.organizers.length > 0) {
      return source.organizers[0] || {};
    }
    if (source?.organizers && typeof source.organizers === "object") {
      return source.organizers;
    }
    return {};
  };

  const getAutofilledGuestBase = () => {
    const basic = getBasicSourceData();
    const organizer = getPrimaryOrganizer(basic);
    const departmentValue = Array.isArray(basic.departments)
      ? basic.departments.join(", ")
      : (basic.departments || basic.department || "");

    return {
      iqacNumber: basic.iqacNumber || "",
      eventName: basic.eventName || "",
      department: departmentValue,
      requestorName: organizer.name || basic.requestorName || "",
      empId: organizer.employeeId || basic.empId || "",
      mobile: organizer.phone || basic.mobileNumber || basic.mobile || "",
      designation: organizer.designation || basic.designation || "",
      purpose: basic.description || "",
      date: basic.startDate ? new Date(basic.startDate).toISOString().split("T")[0] : "",
      guestCount: "",
      eventType: basic.eventType || "",
      selectedRooms: [],
    };
  };
  
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
    iqacNumber: "",
    eventName: "",
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
  const isEditMode = localStorage.getItem('isEditMode') === 'true';
  const [isFormEditable, setIsFormEditable] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);

  const hasMeaningfulGuestData = (data) => {
    if (!data || typeof data !== 'object') return false;
    if (Array.isArray(data)) return data.length > 0;
    const selectedRooms = Array.isArray(data.selectedRooms) ? data.selectedRooms : [];
    return Boolean(
      data.iqacNumber ||
      data.eventName ||
      data.department ||
      data.requestorName ||
      data.empId ||
      data.mobile ||
      data.designation ||
      data.purpose ||
      data.date ||
      data.guestCount ||
      data.eventType ||
      selectedRooms.length > 0
    );
  };

  const safeParseJSON = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    setIsFormEditable(!isEditMode);
  }, [isEditMode]);

  const handleEditToggle = () => {
    if (!isFormEditable && formData) {
      setOriginalFormData(JSON.parse(JSON.stringify(formData)));
      setIsFormEditable(true);
    }
  };

  const handleCancel = () => {
    if (originalFormData) {
      setFormData(originalFormData);
    }
    setIsFormEditable(false);
  };
  
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

  // Persist an actual draft only after the user starts editing.
  useEffect(() => {
    if (localStorage.getItem('guestRoomHasUnsavedChanges') === 'true') {
      localStorage.setItem('guestRoomFormData', JSON.stringify(formData));
    }
  }, [formData]);

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
    const hasFormsFlowSession = sessionStorage.getItem('formsFlowActive') === 'true';
    
    // Skip this effect if we're editing an existing event
    if (isEditMode || endformId) {
      console.log("GuestRoom - Skipping reset effect due to edit mode or existing event");
      return;
    }

    // Outside an active in-tab forms session, never hydrate from cached Basic data.
    if (!hasFormsFlowSession) {
      return;
    }
    
    // If we have a currentEventId but no guestRoomFormId, we're creating a new event
    if (currentEventId && !guestRoomFormId) {
      console.log("New event creation detected, applying Basic Event autofill");
      setFormData(getAutofilledGuestBase());
    }
  }, [location.pathname]);

  useEffect(() => {
    // Only read from common_data if we're NOT in edit mode and NOT creating a new event
    const isEditMode = localStorage.getItem('isEditMode') === 'true';
    const endformId = localStorage.getItem('endformId');
    const currentEventId = localStorage.getItem('currentEventId');
    const hasFormsFlowSession = sessionStorage.getItem('formsFlowActive') === 'true';
    
    // Skip this effect if we're editing an existing event
    if (isEditMode || endformId) {
      console.log("GuestRoom - Skipping common_data effect due to edit mode or existing event");
      return;
    }

    // Never hydrate from common_data unless the user is actively inside this tab's forms flow.
    if (!hasFormsFlowSession) {
      return;
    }

    // Do not prefill from common_data unless a new basic event is active.
    if (!currentEventId) {
      return;
    }
    
    const local = JSON.parse(localStorage.getItem("common_data"));

    if (local) {
      const eventData = local;
      const primaryOrganizer = Array.isArray(eventData.organizers)
        ? (eventData.organizers[0] || {})
        : (eventData.organizers || {});
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
        requestorName: primaryOrganizer.name || "",
        empId: primaryOrganizer.employeeId || "",
        designation: primaryOrganizer.designation || "",
        mobile: primaryOrganizer.phone || "",
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
    const hasFormsFlowSession = sessionStorage.getItem('formsFlowActive') === 'true';
    const createFlowEventId = sessionStorage.getItem('createFlowEventId');
    
    console.log("=== GUEST ROOM FORM DEBUG ===");
    console.log("endformId:", endformId);
    console.log("currentEventId:", currentEventId);
    console.log("isEditMode:", isEditMode);
    console.log("All localStorage keys:", Object.keys(localStorage));
    console.log("guestRoomForm in localStorage:", localStorage.getItem('guestRoomForm'));
    console.log("guestRoomFormId in localStorage:", localStorage.getItem('guestRoomFormId'));

    // Direct deep visit (without an active flow session) should always start empty.
    if (!isEditMode && !endformId && !hasFormsFlowSession) {
      console.log('GuestRoom - Direct visit detected without active forms flow; clearing guest cache and starting empty');
      ['guestRoomForm', 'guestRoomFormId', 'guestRoomFormData', 'guestRoomHasUnsavedChanges'].forEach((key) => localStorage.removeItem(key));
      setFormData({
        iqacNumber: "",
        eventName: "",
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

    // If this tab did not create the currentEventId, do not hydrate create-flow data.
    if (currentEventId && !endformId && !isEditMode) {
      const isBoundToThisTab = !!createFlowEventId && String(createFlowEventId) === String(currentEventId);
      if (!isBoundToThisTab) {
        console.log('GuestRoom - Create context not bound to this tab; clearing guest cache and starting empty');
        ['guestRoomForm', 'guestRoomFormId', 'guestRoomFormData', 'guestRoomHasUnsavedChanges'].forEach((key) => localStorage.removeItem(key));
        setFormData({
          iqacNumber: "",
          eventName: "",
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
    }
    
    // No active flow yet: keep empty form.
    if (!currentEventId && !endformId && !isEditMode) {
      console.log("GuestRoom - No active event found, starting with empty form for new event creation");
      setFormData({
        iqacNumber: "",
        eventName: "",
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

    // New event flow after Basic Event save: currentEventId exists, but no endform yet
    if (currentEventId && !endformId && !isEditMode) {
      const storedGuestRoomForm = localStorage.getItem('guestRoomForm');
      if (storedGuestRoomForm) {
        try {
          const parsedGuestData = JSON.parse(storedGuestRoomForm);
          if (parsedGuestData && Object.keys(parsedGuestData).length > 0) {
            setFormData({
              iqacNumber: parsedGuestData.iqacNumber || "",
              eventName: parsedGuestData.eventName || "",
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
            });
            return;
          }
        } catch (error) {
          console.error("GuestRoom - Error parsing stored guest room data in creation flow:", error);
        }
      }
      console.log("GuestRoom - Applying Basic Event autofill for new flow");
      setFormData(getAutofilledGuestBase());
      return;
    }
    
    // Existing flow: only use edit mode or endform-linked prefill.
    if (endformId || isEditMode) {
      // Check if we have unsaved changes (user was actively editing)
      const existingFormData = localStorage.getItem('guestRoomFormData') || localStorage.getItem('guestRoomForm');
      const hasUnsavedChanges = localStorage.getItem('guestRoomHasUnsavedChanges') === 'true';
      
      if (existingFormData && hasUnsavedChanges) {
        console.log("Using existing form data from localStorage (unsaved changes)");
        const parsedData = safeParseJSON(existingFormData) || {};

        // Ignore empty drafts; they should never block server prefill.
        if (hasMeaningfulGuestData(parsedData)) {
          setFormData(prevData => ({
            ...prevData,
            ...parsedData,
            date: parsedData.date ? new Date(parsedData.date).toISOString().split('T')[0] : '',
            selectedRooms: parsedData.selectedRooms || [],
          }));
          return; // Don't fetch from server if we have real unsaved changes
        }

        console.log('GuestRoom - Unsaved-changes flag set but draft is empty; clearing flag and continuing prefill');
        localStorage.removeItem('guestRoomHasUnsavedChanges');
        localStorage.removeItem('guestRoomFormData');
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
          if (!hasMeaningfulGuestData(parsedGuestData)) {
            console.log("GuestRoom - No valid guest room data found in localStorage, continuing to fetch");
          } else {
            // Format the data to match our form structure
            const formattedData = {
              iqacNumber: parsedGuestData.iqacNumber || "",
              eventName: parsedGuestData.eventName || "",
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
          }
        } catch (error) {
          console.error("GuestRoom - Error parsing stored guest room form data:", error);
        }
      } else {
        console.log("GuestRoom - No guestRoomForm data found in localStorage");
      }
      
      // Only fetch data if there's an actual event being created and no localStorage data
      const fetchAndPrefill = async () => {
        try {
          const liveEndformId = localStorage.getItem('endformId');
          const liveGuestRoomFormId = localStorage.getItem('guestRoomFormId');

          let guestData = null;

          if (liveEndformId) {
            console.log("GuestRoom - Fetching data for editing from endformId:", liveEndformId);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/endform/${liveEndformId}`);
            console.log("GuestRoom - Response from endform:", response.data);

            const guestRef = response?.data?.guestform;
            if (guestRef && typeof guestRef === 'object' && hasMeaningfulGuestData(guestRef)) {
              guestData = guestRef;
            } else if (guestRef && typeof guestRef === 'string') {
              console.log('GuestRoom - endform.guestform is an id; fetching booking by id');
              const bookingRes = await axios.get(`${import.meta.env.VITE_API_URL}/guestroom/bookings/${guestRef}`);
              guestData = bookingRes?.data || null;
            }
          }

          if (!guestData && liveGuestRoomFormId) {
            console.log('GuestRoom - Fetching booking by guestRoomFormId:', liveGuestRoomFormId);
            const bookingRes = await axios.get(`${import.meta.env.VITE_API_URL}/guestroom/bookings/${liveGuestRoomFormId}`);
            guestData = bookingRes?.data || null;
          }

          if (guestData && hasMeaningfulGuestData(guestData)) {
            console.log("GuestRoom - Found guest room data:", guestData);
            
            // Format the data to match our form structure
            const formattedData = {
              iqacNumber: guestData.iqacNumber || "",
              eventName: guestData.eventName || "",
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

            // Clear any stale unsaved flag after successful prefill.
            localStorage.removeItem('guestRoomHasUnsavedChanges');
            localStorage.removeItem('guestRoomFormData');
          } else {
            console.log("GuestRoom - No existing guest room data found; applying Basic Event autofill");
            setFormData(getAutofilledGuestBase());
          }
        } catch (error) {
          console.error("GuestRoom - Error fetching guest room data:", error);
          setFormData(getAutofilledGuestBase());
        }
      };
      fetchAndPrefill();
    } else {
      // This is a new event creation - ensure form is empty
      console.log("GuestRoom - New event creation, starting with empty form");
      setFormData({
        iqacNumber: "",
        eventName: "",
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
        const guestRef = response?.data?.guestform;
        if (guestRef && typeof guestRef === 'object' && hasMeaningfulGuestData(guestRef)) {
          console.log("Found guest data in Endform:", guestRef);
          setFormData(prevData => ({
            ...prevData,
            ...guestRef,
            date: guestRef.date ? new Date(guestRef.date).toISOString().split('T')[0] : '',
            selectedRooms: guestRef.selectedRooms || [],
          }));
          return;
        }

        if (guestRef && typeof guestRef === 'string') {
          console.log('Endform guestform is id; fetching booking by id:', guestRef);
          const bookingRes = await axios.get(`${import.meta.env.VITE_API_URL}/guestroom/bookings/${guestRef}`);
          const guestData = bookingRes?.data;
          if (guestData && hasMeaningfulGuestData(guestData)) {
            setFormData(prevData => ({
              ...prevData,
              ...guestData,
              date: guestData.date ? new Date(guestData.date).toISOString().split('T')[0] : '',
              selectedRooms: guestData.selectedRooms || [],
            }));
            return;
          }
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
    
    // Frontend validation for required fields (backend requires all of these)
    const requiredFields = {
      department: (formData.department || '').toString().trim(),
      requestorName: (formData.requestorName || '').toString().trim(),
      empId: (formData.empId || '').toString().trim(),
      mobile: (formData.mobile || '').toString().trim(),
      designation: (formData.designation || '').toString().trim(),
      purpose: (formData.purpose || '').toString().trim(),
      eventType: (formData.eventType || '').toString().trim(),
      guestCount: formData.guestCount,
      date: formData.date,
    };

    const missing = [];
    if (!requiredFields.department) missing.push('Event Requestor Department');
    if (!requiredFields.requestorName) missing.push('Event Requestor Name');
    if (!requiredFields.empId) missing.push('Employee ID');
    if (!requiredFields.mobile) missing.push('Event Requestor Mobile Number');
    if (!requiredFields.designation) missing.push('Event Requestor Designation');
    if (!requiredFields.purpose) missing.push('Purpose');
    if (!requiredFields.eventType) missing.push('Event Type');

    const guestCountNumber = Number(requiredFields.guestCount);
    if (!Number.isFinite(guestCountNumber) || guestCountNumber <= 0) missing.push('Number of Guests');

    const dateObj = requiredFields.date ? new Date(requiredFields.date) : null;
    const isValidDate = dateObj && !Number.isNaN(dateObj.getTime());
    if (!isValidDate) missing.push('Requisition Date');

    if (missing.length > 0) {
      toast.error(`Please fill required fields: ${missing.join(', ')}`);
      return;
    }

    setIsLoading(true);

    try {
      const isEditFlow = localStorage.getItem('isEditMode') === 'true' || Boolean(localStorage.getItem('endformId'));
      const guestRoomFromStorage = safeParseJSON(localStorage.getItem("guestRoomForm")) || {};
      const guestRoomIdFromKey = localStorage.getItem("guestRoomFormId");
      const reduxGuestId = typeof guestroomData === 'string' ? guestroomData : guestroomData?._id;

      let updateId = reduxGuestId || guestRoomIdFromKey || guestRoomFromStorage?._id || null;

      // If we're in edit flow but still can't resolve an id, try reading it from EndForm.
      if (isEditFlow && !updateId) {
        const liveEndformId = localStorage.getItem('endformId');
        if (liveEndformId) {
          try {
            const endRes = await axios.get(`${import.meta.env.VITE_API_URL}/endform/${liveEndformId}`);
            const guestRef = endRes?.data?.guestform;
            if (typeof guestRef === 'string') {
              updateId = guestRef;
            } else if (guestRef && typeof guestRef === 'object') {
              updateId = guestRef._id || null;
            }
          } catch (err) {
            console.error('GuestRoom - Failed to resolve booking id from endform:', err);
          }
        }
      }

      const isUpdating = isEditFlow && Boolean(updateId);
      console.log("isEditFlow:", isEditFlow);
      console.log("guestroomData:", guestroomData);
      console.log("guestRoomFromStorage:", guestRoomFromStorage);
      console.log("guestRoomIdFromKey:", guestRoomIdFromKey);
      console.log("resolved updateId:", updateId);
      console.log("isUpdating:", isUpdating);

      const method = isUpdating ? 'PUT' : 'POST';
      const url = isUpdating
        ? `${import.meta.env.VITE_API_URL}/guestroom/bookings/${updateId}`
        : `${import.meta.env.VITE_API_URL}/guestroom/bookings`;

      // Format the date before sending
      const submitData = {
        ...formData,
        department: requiredFields.department,
        requestorName: requiredFields.requestorName,
        empId: requiredFields.empId,
        mobile: requiredFields.mobile,
        designation: requiredFields.designation,
        purpose: requiredFields.purpose,
        eventType: requiredFields.eventType,
        guestCount: guestCountNumber,
        date: dateObj.toISOString(),
        selectedRooms: Array.isArray(formData.selectedRooms) ? formData.selectedRooms : [],
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

      if (response && response.status >= 200 && response.status < 300) {
        const bookingPayload = response.data?.data || response.data?.booking || response.data || {};
        const resolvedBookingId = bookingPayload?._id || bookingPayload?.id || updateId || guestRoomIdFromKey || "";
        const updatedBooking = {
          ...bookingPayload,
          _id: resolvedBookingId,
        };

        if (resolvedBookingId) {
          // Update localStorage with the response data from backend
          const guestRoom = {
            ...updatedBooking
          };
          localStorage.setItem("guestRoomForm", JSON.stringify(guestRoom));
          localStorage.setItem('guestRoomFormId', resolvedBookingId);
          const liveEndformId = localStorage.getItem('endformId');
          if (liveEndformId) {
            localStorage.setItem('guestRoomFormEndformId', String(liveEndformId));
          }
          
          // Clear the unsaved changes flag since data was successfully saved
          localStorage.removeItem('guestRoomHasUnsavedChanges');
          localStorage.removeItem('guestRoomFormData');

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
            
            // Keep event/endform links correct (especially important if we had to POST as fallback)
            const eventId = localStorage.getItem("currentEventId");
            if (eventId) {
              const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(eventId);
              if (!isValidObjectId) {
                console.error('Invalid event ID format:', eventId);
                toast.warning('Guest room saved, but skipped event linking because event ID is invalid.');
              } else {
                try {
                  await axios.put(
                    `${import.meta.env.VITE_API_URL}/event/${eventId}`,
                    { guestform: resolvedBookingId }
                  );
                } catch (err) {
                  console.error('Failed to link updated guest room form to main event:', err);
                }
              }
            }
            
            // Update the Endform with the updated guest room form ID
            const endformId = localStorage.getItem('endformId');
            if (endformId) {
              try {
                await axios.put(
                  `${import.meta.env.VITE_API_URL}/endform/${endformId}`,
                  { guestform: resolvedBookingId }
                );
              } catch (err) {
                console.error('Failed to link updated guest room form to endform:', err);
              }
            }
            
            // Refresh in background to avoid blocking next-form navigation.
            refreshFormData().catch((err) => {
              console.error("GuestRoom - background refresh failed:", err);
            });

            const postSaveRoute = nextForm || "/forms/end";
            console.log("Navigating after guest save:", postSaveRoute);
            navigate(postSaveRoute);
          } else {
            toast.success("Guest room form saved successfully");
            
            // After creating the guest room form, save the ID for EndForm
            const subFormId = resolvedBookingId;
            
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
                toast.warning('Guest room saved, but skipped event linking because event ID is invalid.');
              } else {
                try {
                  await axios.put(
                    `${import.meta.env.VITE_API_URL}/event/${eventId}`,
                    { guestform: subFormId }
                  );
                } catch (err) {
                  console.error('Failed to link guest room form to main event:', err);
                  toast.error('Failed to link guest room form to main event. Please contact support if this persists.');
                }
              }
            } else if (subFormId && !eventId) {
               console.error('No event ID found in basicEvent');
               toast.warning('Guest room saved, but no active event ID found to link.');
             }
            
            const postSaveRoute = nextForm || "/forms/end";
            console.log("Navigating after guest save:", postSaveRoute);
            navigate(postSaveRoute);
          }
        } else {
          console.warn("Guest room saved but no booking ID returned; continuing workflow.");
          toast.success("Guest room form saved successfully");
          const postSaveRoute = nextForm || "/forms/end";
          console.log("Navigating after guest save:", postSaveRoute);
          navigate(postSaveRoute);
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

      if (error.response?.status === 401) {
        toast.error("Unauthorized (401). Saved not completed, continuing to End Form.");
        const postSaveRoute = nextForm || "/forms/end";
        navigate(postSaveRoute);
        return;
      }

      const backendMsg =
        error.response?.data?.details ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        "There was an error submitting the form. Please try again.";
      toast.error(backendMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const endformId = localStorage.getItem('endformId');
    const currentEventId = localStorage.getItem('currentEventId');
    // Only clear when there is no active event flow.
    if (!currentEventId) {
      dispatch(clearEventData());
      localStorage.removeItem('guestRoomFormId');
      localStorage.removeItem('guestRoomForm');
      // Also clear the form state
      setFormData({
        iqacNumber: "",
        eventName: "",
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
      if (!currentEventId) {
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
                label="Event Requestor Department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="Enter department name"
                disabled={!canEdit || !isFormEditable}
              />

              <FormInput
                icon={<Users />}
                label="Event Requestor Name"
                name="requestorName"
                value={formData.requestorName}
                onChange={handleInputChange}
                placeholder="Enter your name"
                disabled={!canEdit || !isFormEditable}
              />

              <FormInput
                label="Employee ID"
                name="empId"
                value={formData.empId}
                onChange={handleInputChange}
                placeholder="Enter employee ID"
                disabled={!canEdit || !isFormEditable}
              />

              <FormInput
                icon={<BookOpen />}
                label="IQAC Number"
                name="iqacNumber"
                value={formData.iqacNumber}
                onChange={handleInputChange}
                placeholder="Enter IQAC number"
                disabled={!canEdit || !isFormEditable}
              />

              <FormInput
                icon={<Building2 />}
                label="Event Name"
                name="eventName"
                value={formData.eventName}
                onChange={handleInputChange}
                placeholder="Enter event name"
                disabled={!canEdit || !isFormEditable}
              />

              <FormInput
                icon={<Phone />}
                label="Event Requestor Mobile Number"
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder="Enter mobile number"
                disabled={!canEdit || !isFormEditable}
              />

              <FormInput
                icon={<MapPin />}
                label="Event Requestor Designation"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                placeholder="Enter designation"
                className="md:col-span-2"
                disabled={!canEdit || !isFormEditable}
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
                  disabled={!canEdit || !isFormEditable}
                />
              </div>

              <FormInput
                icon={<CalendarDays />}
                label="Requisition Date"
                name="date"
                type="date"
                value={toDateInputValue(formData.date)}
                onChange={handleInputChange}
                disabled={!canEdit || !isFormEditable}
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
                disabled={!canEdit || !isFormEditable}
              />

              <FormInput
                label="Event Type"
                name="eventType"
                value={formData.eventType}
                onChange={handleInputChange}
                placeholder="Enter event type"
                disabled={!canEdit || !isFormEditable}
              />
            </div>

            <RoomSelection
              selectedRooms={formData.selectedRooms || []}
              onRoomChange={handleRoomChange}
              disabled={!canEdit || !isFormEditable}
            />

            <div className="mt-8 flex justify-end gap-3 p-6">
              {isEditMode && !isFormEditable && (
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="h-10 rounded-md bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  disabled={!canEdit}
                >
                  Edit Form
                </button>
              )}
              {isFormEditable && (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="h-10 rounded-md border border-gray-300 px-6 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 rounded-md bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Save and Go Next
                  </button>
                </>
              )}
              {!isEditMode && !isFormEditable && (
                <button
                  type="submit"
                  className="h-10 rounded-md bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  disabled={!canEdit}
                >
                  Save and Go Next
                </button>
              )}
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default BookingForm;