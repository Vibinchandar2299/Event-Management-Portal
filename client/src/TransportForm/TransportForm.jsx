import React, { useState, useEffect } from "react";
import { BasicDetails } from "./BasicDetails";
import { EventDetails } from "./EventDetails";
import { TravelDetails } from "./TravelDetails";
import { DriverDetails } from "./DriverDetails";
import { FormFooter } from "./FormFooter";
import EndForm from "../EndForm";
import { useNavigate, useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { setEventData, clearEventData } from "../redux/EventSlice";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import Header from "../FoodForm/Header";

const TransportForm = ({ eventData, nextForm }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const looksLikeObjectId = (value) => typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);

  const normalizeTransportDoc = (doc) => {
    if (!doc || typeof doc !== "object") return null;

    const basic = doc.basicDetails || {};
    const eventDetails = doc.eventDetails || {};
    const travel = doc.travelDetails || {};
    const driver = doc.driverDetails || {};

    return {
      basicDetails: {
        departmentName: basic.departmentName ?? doc.departmentName ?? "",
        designation: basic.designation ?? doc.designation ?? "",
        empId: basic.empId ?? doc.empId ?? "",
        iqacNumber: basic.iqacNumber ?? doc.iqacNumber ?? "",
        mobileNumber: basic.mobileNumber ?? doc.mobileNumber ?? "",
        requestorName: basic.requestorName ?? doc.requestorName ?? "",
        requisitionDate: basic.requisitionDate ?? doc.requisitionDate ?? "",
      },
      eventDetails: {
        eventName: eventDetails.eventName ?? "",
        eventType: eventDetails.eventType ?? "",
        travellerDetails: eventDetails.travellerDetails ?? "",
      },
      travelDetails: {
        pickUpDateTime: travel.pickUpDateTime ?? "",
        dropDateTime: travel.dropDateTime ?? "",
        numberOfPassengers: travel.numberOfPassengers ?? "",
        vehicleType: travel.vehicleType ?? "",
        pickUpLocation: travel.pickUpLocation ?? "",
        dropLocation: travel.dropLocation ?? "",
        specialRequirements: travel.specialRequirements ?? "",
      },
      driverDetails: {
        mobileNumber: driver.mobileNumber ?? "",
        name: driver.name ?? "",
      },
      _id: doc._id || doc.id || "",
    };
  };

  const getBasicSourceData = () => {
    try {
      const currentEventId = localStorage.getItem("currentEventId");
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

      const isForCurrentFlow = (obj) => {
        if (!obj || typeof obj !== "object") return false;
        if (!currentEventId) return false;
        const objId = obj._id || obj.id;
        return objId ? String(objId) === String(currentEventId) : false;
      };

      if (hasUsableBasicData(basicFromStorage) && isForCurrentFlow(basicFromStorage)) return basicFromStorage;
      if (hasUsableBasicData(basicFromCurrent) && isForCurrentFlow(basicFromCurrent)) return basicFromCurrent;
      if (hasUsableBasicData(basicFromCommon) && isForCurrentFlow(basicFromCommon)) return basicFromCommon;
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

  const getAutofilledTransportBase = () => {
    const basic = getBasicSourceData();
    const organizer = getPrimaryOrganizer(basic);
    const departmentValue = Array.isArray(basic.departments)
      ? basic.departments[0] || ""
      : (basic.departments || basic.department || "");
    const requisitionDate = basic.startDate
      ? new Date(basic.startDate).toISOString().split("T")[0]
      : "";

    return {
      basicDetails: {
        departmentName: departmentValue,
        designation: organizer.designation || basic.designation || "",
        empId: organizer.employeeId || basic.empId || "",
        iqacNumber: basic.iqacNumber || "",
        mobileNumber: organizer.phone || basic.mobileNumber || basic.mobile || "",
        requestorName: organizer.name || basic.requestorName || "",
        requisitionDate,
      },
      eventDetails: {
        eventName: basic.eventName || "",
        eventType: basic.eventType || "",
        travellerDetails: "",
      },
      travelDetails: {
        pickUpDateTime: "",
        dropDateTime: "",
        numberOfPassengers: "",
        vehicleType: "",
        pickUpLocation: "",
        dropLocation: "",
        specialRequirements: "",
      },
      driverDetails: {
        mobileNumber: "",
        name: "",
      },
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
  const transportData = useSelector((state) => {
    if (!hasActiveEvent || !endformId) return []; // Don't read from Redux for new events
    return state.event?.event?.transport || [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [commId, setCommId] = useState('');
  const isEditMode = localStorage.getItem('isEditMode') === 'true';
  const [isFormEditable, setIsFormEditable] = useState(false);
  const [originalCurrentEvent, setOriginalCurrentEvent] = useState(null);

  useEffect(() => {
    setIsFormEditable(!isEditMode);
  }, [isEditMode]);

  const handleEditToggle = () => {
    if (!isFormEditable && currentEvent) {
      setOriginalCurrentEvent(JSON.parse(JSON.stringify(currentEvent)));
      setIsFormEditable(true);
    }
  };

  const handleCancel = () => {
    if (originalCurrentEvent) {
      setCurrentEvent(originalCurrentEvent);
    }
    setIsFormEditable(false);
  };

  // Define canEdit at the top to avoid temporal dead zone
  const canonicalizeDeptKey = (value) => {
    const d = String(value || "").trim().toLowerCase();
    if (!d) return "";
    if (d === "media") return "communication";
    if (d === "guest deparment" || d === "guest department" || d === "guest room") return "guestroom";
    if (d === "systemadmin" || d === "admin") return "system admin";
    return d;
  };

  const userDept = canonicalizeDeptKey(localStorage.getItem("user_dept"));
  const isCreationFlow = !!currentEventId && !endformId && !isEditMode;
  const isServiceDeptUser = new Set(["communication", "food", "transport", "guestroom"]).has(userDept);
  const isPrivilegedUser = userDept === "iqac" || userDept === "system admin" || !userDept;
  const baseCanEdit = isCreationFlow || userDept === "transport" || isPrivilegedUser;
  const canEdit = isPrivilegedUser ? true : isServiceDeptUser ? userDept === "transport" : baseCanEdit;

  const defaultCurrentEvent = {
    basicDetails: {
      departmentName: "",
      designation: "",
      empId: "",
      iqacNumber: "",
      mobileNumber: "",
      requestorName: "",
      requisitionDate: ""
    },
    eventDetails: {
      eventName: "",
      eventType: "",
      travellerDetails: ""
    },
    travelDetails: {
      pickUpDateTime: "",
      dropDateTime: "",
      numberOfPassengers: "",
      vehicleType: "",
      pickUpLocation: "",
      dropLocation: "",
      specialRequirements: ""
    },
    driverDetails: {
      mobileNumber: "",
      name: ""
    }
  };
  const [currentEvent, setCurrentEvent] = useState(defaultCurrentEvent);

  useEffect(() => {
    const endformId = localStorage.getItem('endformId');
    const currentEventId = localStorage.getItem('currentEventId');
    if (!currentEventId) {
      dispatch(clearEventData());
      localStorage.removeItem('transportFormData');
      localStorage.removeItem('transportFormId');
      // Also clear the form state
      setEvents([]);
      setCurrentEvent(defaultCurrentEvent);
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

  useEffect(() => {
    // Check if there's an active event first
    const endformId = localStorage.getItem("endformId");
    const currentEventId = localStorage.getItem("currentEventId");
    const isEditMode = localStorage.getItem('isEditMode') === 'true';
    
    // No active flow yet: keep empty form.
    if (!currentEventId && !endformId && !isEditMode) {
      console.log("TransportForm - No active event found, starting with empty form for new event creation");
      setCurrentEvent(defaultCurrentEvent);
      return;
    }

    // New event flow after Basic Event save: currentEventId exists, but no endform yet
    if (currentEventId && !endformId && !isEditMode) {
      const storedTransportForm = localStorage.getItem('transportForm');
      if (storedTransportForm) {
        try {
          const parsedTransportData = JSON.parse(storedTransportForm);
          const transportData = Array.isArray(parsedTransportData)
            ? parsedTransportData[0]
            : parsedTransportData;

          if (transportData && Object.keys(transportData).length > 0) {
            setCurrentEvent({
              basicDetails: {
                departmentName: transportData.departmentName || transportData.basicDetails?.departmentName || "",
                designation: transportData.designation || transportData.basicDetails?.designation || "",
                empId: transportData.empId || transportData.basicDetails?.empId || "",
                iqacNumber: transportData.iqacNumber || transportData.basicDetails?.iqacNumber || "",
                mobileNumber: transportData.mobileNumber || transportData.basicDetails?.mobileNumber || "",
                requestorName: transportData.requestorName || transportData.basicDetails?.requestorName || "",
                requisitionDate: transportData.requisitionDate || transportData.basicDetails?.requisitionDate || "",
              },
              driverDetails: {
                mobileNumber: transportData.driverDetails?.mobileNumber || "",
                name: transportData.driverDetails?.name || "",
              },
              travelDetails: {
                pickUpDateTime: transportData.travelDetails?.pickUpDateTime || "",
                dropDateTime: transportData.travelDetails?.dropDateTime || "",
                numberOfPassengers: transportData.travelDetails?.numberOfPassengers ?? "",
                vehicleType: transportData.travelDetails?.vehicleType || "",
                pickUpLocation: transportData.travelDetails?.pickUpLocation || "",
                dropLocation: transportData.travelDetails?.dropLocation || "",
                specialRequirements: transportData.travelDetails?.specialRequirements || "",
              },
              eventDetails: {
                eventName: transportData.eventDetails?.eventName || "",
                eventType: transportData.eventDetails?.eventType || "",
                travellerDetails: transportData.eventDetails?.travellerDetails || "",
              },
              _id: transportData._id || "",
            });
            return;
          }
        } catch (error) {
          console.error("TransportForm - Error parsing stored transport data in creation flow:", error);
        }
      }
      console.log("TransportForm - Applying Basic Event autofill for new flow");
      setCurrentEvent(getAutofilledTransportBase());
      return;
    }
    
    // Existing flow: only use edit mode or endform-linked prefill.
    if (endformId || isEditMode) {
      // Check if we have unsaved changes (user was actively editing)
      const existingFormData = localStorage.getItem('transportFormData');
      const hasUnsavedChanges = localStorage.getItem('transportHasUnsavedChanges') === 'true';
      
      if (existingFormData && hasUnsavedChanges) {
        console.log("Using existing form data from localStorage (unsaved changes)");
        const parsedData = JSON.parse(existingFormData);
        setCurrentEvent(parsedData);
        return; // Don't fetch from server if we have unsaved changes
      }
      
      // Check if we have transport form data in localStorage (set by Edit button)
      const storedTransportForm = localStorage.getItem('transportForm');
      if (storedTransportForm) {
        try {
          console.log("TransportForm - Using stored transport form data from localStorage");
          const parsedTransportData = JSON.parse(storedTransportForm);
          console.log("TransportForm - Parsed transport data:", parsedTransportData);
          
          // If it's an array, take the first element
          const transportData = Array.isArray(parsedTransportData) ? parsedTransportData[0] : parsedTransportData;

          // If we only have an ID string, fetch the full transport document.
          if (looksLikeObjectId(transportData)) {
            console.log("TransportForm - Stored transport data is an id; fetching transport by id:", transportData);
            (async () => {
              try {
                const transportRes = await axios.get(
                  `${import.meta.env.VITE_API_URL}/transportform/transports/${transportData}`
                );
                const normalized = normalizeTransportDoc(transportRes.data);
                if (normalized) {
                  setCurrentEvent(normalized);
                  if (normalized._id) {
                    localStorage.setItem('transportFormId', normalized._id);
                  }
                  localStorage.setItem('transportForm', JSON.stringify(transportRes.data));
                }
              } catch (error) {
                console.error("TransportForm - Failed to fetch transport by id from localStorage:", error);
              }
            })();
            return;
          }
          
          // Check if we have valid transport data
          if (!transportData || Object.keys(transportData).length === 0) {
            console.log("TransportForm - No valid transport data found in localStorage, skipping");
            return;
          }

          const normalized = normalizeTransportDoc(transportData);
          if (normalized) {
            setCurrentEvent(normalized);
            console.log("TransportForm - Set current event with localStorage data:", normalized);
            return;
          }
          return;
        } catch (error) {
          console.error("TransportForm - Error parsing stored transport form data:", error);
        }
      }
      
      // Only fetch data if there's an actual event being created and no localStorage data
      const fetchAndPrefill = async () => {
        try {
          console.log("TransportForm - Fetching data for editing from endformId:", endformId);
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/endform/${endformId}`);
          console.log("TransportForm - Response from endform:", response.data);
          
          if (response.data && response.data.transportform && response.data.transportform.length > 0) {
            let transportData = response.data.transportform[0];
            console.log("TransportForm - Found transport data:", transportData);

            // Some responses might contain only ObjectId strings; resolve them.
            if (looksLikeObjectId(transportData)) {
              console.log("TransportForm - endform.transportform contains an id; fetching transport by id:", transportData);
              const transportRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/transportform/transports/${transportData}`
              );
              transportData = transportRes.data;
              localStorage.setItem('transportForm', JSON.stringify(transportData));
            }

            const normalized = normalizeTransportDoc(transportData);
            if (normalized) {
              setCurrentEvent(normalized);
              console.log("TransportForm - Set current event with formatted data:", normalized);
              if (normalized._id) {
                localStorage.setItem('transportFormId', normalized._id);
              }
            }
          } else {
            console.log("TransportForm - No existing transport data found, starting with empty form");
            setCurrentEvent(defaultCurrentEvent);
          }
        } catch (error) {
          console.error("TransportForm - Error fetching transport data:", error);
          setCurrentEvent(defaultCurrentEvent);
        }
      };
      fetchAndPrefill();
    } else {
      // This is a new event creation - ensure form is empty
      console.log("TransportForm - New event creation, starting with empty form");
      setCurrentEvent(defaultCurrentEvent);
    }
  }, []);

  // Handle TransportForm updates from Redux - only when there's an active event
  useEffect(() => {
    console.log("TransportForm - useEffect triggered. transportData:", transportData);
    
    // Check if there's an active event before using Redux data
    const endformId = localStorage.getItem('endformId');
    const currentEventId = localStorage.getItem("currentEventId");
    
    if (!currentEventId) {
      console.log("TransportForm - No active event, ignoring Redux data");
      return;
    }
    
    // Only use Redux data if we have an endformId (existing event)
    if (endformId && Array.isArray(transportData) && transportData.length > 0) {
      console.log("TransportForm - Populating form with data:", transportData);
      const transportDataArray = transportData;
      setEvents(transportDataArray);
      
      if (transportDataArray[0]) {
        setCurrentEvent({
          basicDetails: {
            departmentName: transportDataArray[0].basicDetails?.departmentName || "",
            designation: transportDataArray[0].basicDetails?.designation || "",
            empId: transportDataArray[0].basicDetails?.empId || "",
            iqacNumber: transportDataArray[0].basicDetails?.iqacNumber || "",
            mobileNumber: transportDataArray[0].basicDetails?.mobileNumber || "",
            requestorName: transportDataArray[0].basicDetails?.requestorName || "",
            requisitionDate: transportDataArray[0].basicDetails?.requisitionDate || ""
          },
          eventDetails: {
            eventName: transportDataArray[0].eventDetails?.eventName || "",
            eventType: transportDataArray[0].eventDetails?.eventType || "General",
            travellerDetails: transportDataArray[0].eventDetails?.travellerDetails || "Not Provided"
          },
          travelDetails: {
            pickUpDateTime: transportDataArray[0].travelDetails?.pickUpDateTime || "",
            dropDateTime: transportDataArray[0].travelDetails?.dropDateTime || "",
            numberOfPassengers: transportDataArray[0].travelDetails?.numberOfPassengers ?? "",
            vehicleType: transportDataArray[0].travelDetails?.vehicleType || "",
            pickUpLocation: transportDataArray[0].travelDetails?.pickUpLocation || "",
            dropLocation: transportDataArray[0].travelDetails?.dropLocation || "",
            specialRequirements: transportDataArray[0].travelDetails?.specialRequirements || ""
          },
          driverDetails: {
            mobileNumber: transportDataArray[0].driverDetails?.mobileNumber || "",
            name: transportDataArray[0].driverDetails?.name || ""
          }
        });
      }
    }
  }, [transportData]);

  const handleAddEvent = () => {
    setEvents((prev) => [...prev, { ...currentEvent }]);
  };

  const handleEditEvent = (index) => {
    setCurrentEvent(events[index]);
    setEvents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteEvent = (index) => {
    setEvents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    console.log("=== TRANSPORT FORM SUBMIT CALLED ===");
    console.log("canEdit:", canEdit);
    
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
    if (!currentEvent.eventDetails.eventName || currentEvent.eventDetails.eventName.trim() === "") {
      alert("Event Name is required in Event Details.");
      setIsLoading(false);
      return;
    }

    const passengersValue = Number(currentEvent.travelDetails.numberOfPassengers);
    if (!Number.isFinite(passengersValue) || passengersValue < 1) {
      toast.error("Please enter a valid Number of Passengers.");
      setIsLoading(false);
      return;
    }

    try {
      const eventId = localStorage.getItem("currentEventId");

      // Format data for MongoDB
      const formattedData = {
        basicDetails: {
          departmentName: currentEvent.basicDetails.departmentName,
          designation: currentEvent.basicDetails.designation || "",
          empId: currentEvent.basicDetails.empId,
          iqacNumber: currentEvent.basicDetails.iqacNumber,
          mobileNumber: currentEvent.basicDetails.mobileNumber || "",
          requestorName: currentEvent.basicDetails.requestorName,
          requisitionDate: new Date(currentEvent.basicDetails.requisitionDate)
        },
        driverDetails: {
          mobileNumber: currentEvent.driverDetails.mobileNumber,
          name: currentEvent.driverDetails.name
        },
        travelDetails: {
          pickUpDateTime: new Date(currentEvent.travelDetails.pickUpDateTime),
          dropDateTime: new Date(currentEvent.travelDetails.dropDateTime),
          numberOfPassengers: passengersValue,
          vehicleType: currentEvent.travelDetails.vehicleType,
          pickUpLocation: currentEvent.travelDetails.pickUpLocation,
          dropLocation: currentEvent.travelDetails.dropLocation,
          specialRequirements: currentEvent.travelDetails.specialRequirements || ""
        },
        eventDetails: {
          eventName: currentEvent.eventDetails.eventName,
          eventType: currentEvent.eventDetails.eventType || "General",
          travellerDetails: currentEvent.eventDetails.travellerDetails || "Not Provided"
        }
      };

      // Add authorization header
      const token = localStorage.getItem("token");
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      let response;
      if (localStorage.getItem('isEditMode') === 'true' || localStorage.getItem('endformId')) {
        // Get the transport ID from the current event or events array
        const transportId =
          currentEvent._id ||
          currentEvent.id ||
          (Array.isArray(events) && events[0]?._id) ||
          (Array.isArray(events) && events[0]?.id) ||
          localStorage.getItem('transportFormId') ||
          (() => {
            try {
              return JSON.parse(localStorage.getItem('transportForm') || 'null')?._id || '';
            } catch {
              return '';
            }
          })();
        console.log("currentEvent for update:", currentEvent);
        console.log("events array for update:", events);
        console.log("Resolved transportId for update:", transportId);
        
        if (!transportId) {
          console.error("Transport ID not found in current event or events array:", currentEvent, events);
          // Try to get the ID from localStorage
          const storedTransportData = localStorage.getItem('transportFormData');
          if (storedTransportData) {
            try {
              const parsedData = JSON.parse(storedTransportData);
              const storedTransport = Array.isArray(parsedData) ? parsedData[0] : parsedData;
              const storedId = storedTransport?._id || storedTransport?.id;
              if (storedId) {
                console.log("Found ID from localStorage:", storedId);
                response = await axios.put(
                  `${import.meta.env.VITE_API_URL}/transportform/transports/${storedId}`,
                  formattedData,
                  { headers }
                );
              } else {
                console.warn("Transport ID not found in edit mode, creating a new transport as fallback.");
                response = await axios.post(
                  `${import.meta.env.VITE_API_URL}/transportform/transports`,
                  { events: [formattedData] },
                  { headers }
                );
              }
            } catch (error) {
              console.error("Error parsing stored transport data:", error);
              console.warn("Transport ID parse failed in edit mode, creating a new transport as fallback.");
              response = await axios.post(
                `${import.meta.env.VITE_API_URL}/transportform/transports`,
                { events: [formattedData] },
                { headers }
              );
            }
          } else {
            console.warn("Transport ID not found in edit mode, creating a new transport as fallback.");
            response = await axios.post(
              `${import.meta.env.VITE_API_URL}/transportform/transports`,
              { events: [formattedData] },
              { headers }
            );
          }
        } else {
          // Update existing transport
          console.log("Updating existing transport with ID:", transportId);
          response = await axios.put(
            `${import.meta.env.VITE_API_URL}/transportform/transports/${transportId}`,
            formattedData,
            { headers }
          );
        }
      } else {
        // Create new transport
        console.log("Creating new transport");
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/transportform/transports`,
          { events: [formattedData] },
          { headers }
        );
        // After creating the transport form, save the ID for EndForm
        const subFormId =
          (Array.isArray(response.data) && response.data[0]?._id) ||
          response.data?.requirement?._id ||
          response.data?._id ||
          response.data?.id ||
          response.data?.data?._id;
        
        // Save the transportFormId for EndForm
        if (subFormId) {
          localStorage.setItem('transportFormId', subFormId);
          console.log('Saved transportFormId to localStorage:', subFormId);
        } else {
          console.error('No transport subFormId after creation!');
        }
        
        // Only try to update End Form if it exists (for existing events)
        const endformId = localStorage.getItem('endformId');
        if (subFormId && endformId) {
          console.log('About to PUT to Endform:', { endformId, subFormId });
          try {
            await axios.put(
              `${import.meta.env.VITE_API_URL}/endform/${endformId}`,
              { transportform: [subFormId] },
              { headers }
            );
            console.log('Successfully updated End Form with transport ID');
          } catch (err) {
            console.error('Failed to update Endform with transport ID:', err);
            // Don't show error toast for new events - this is expected
            if (endformId) {
              toast.error('Failed to link transport form to event. Please contact support if this persists.');
            }
          }
        } else {
          if (!subFormId) {
            console.error('No transport subFormId after creation!');
          }
          if (!endformId) {
            console.log('No endformId in localStorage - this is expected for new events');
          }
        }
      }

      console.log("Response:", response.data);

      if (response.data) {
        const savedTransport = {
          ...formattedData,
          _id:
            response.data?._id ||
            response.data?.data?._id ||
            (Array.isArray(response.data) ? response.data[0]?._id : undefined) ||
            localStorage.getItem('transportFormId') ||
            currentEvent?._id ||
            "",
        };
        localStorage.setItem('transportForm', JSON.stringify(savedTransport));
        if (savedTransport._id) {
          localStorage.setItem('transportFormId', savedTransport._id);
        }

        toast.success("Transport form saved successfully!");
        const postSaveRoute = !isPrivilegedUser && isServiceDeptUser
          ? "/event-requests"
          : (nextForm || "/forms/food");

        if (postSaveRoute === "/forms/food") {
          localStorage.setItem('foodFlowAccess', 'true');
          localStorage.setItem('foodFlowAccessAt', String(Date.now()));
        }

        navigate(postSaveRoute);
      }

      // After successful update, fetch latest event data and update Redux
      if (response.data && localStorage.getItem('isEditMode') === 'true') {
        const eventId = localStorage.getItem("currentEventId");
        if (eventId && /^[0-9a-fA-F]{24}$/.test(eventId)) {
          const eventResponse = await axios.get(`${import.meta.env.VITE_API_URL}/event/${eventId}`);
          if (eventResponse.data) {
            dispatch(setEventData(eventResponse.data));
          }
        } else if (eventId) {
          console.warn("TransportForm - Skipping event refresh due to invalid event ID:", eventId);
        } else {
          console.warn("TransportForm - Skipping event refresh because no currentEventId is set.");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      console.error("Failed to save form. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  console.log("TransportForm - userDept:", userDept);
  console.log("TransportForm - canEdit:", canEdit);
  console.log("currentEvent:", currentEvent);
  console.log("events:", events);

  return (
      <div className="xl:w-full px-2 py-4">
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 shadow-lg z-50">
          <div className="h-16 w-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="mx-auto max-w-full overflow-hidden">
        <div className="mb-6 rounded-xl bg-emerald-100/70 px-4 py-3 text-sm font-medium text-emerald-800">
          Form 3: Transport Requisition
        </div>
        <Header title="Requisition Form for Transport" />
        <div className="p-6 space-y-6">
          <BasicDetails data={currentEvent.basicDetails || {}} setDetails={(data) => setCurrentEvent((prev) => ({ ...prev, basicDetails: data }))} disabled={!canEdit || !isFormEditable} />
          <EventDetails data={currentEvent.eventDetails || {}} setDetails={(data) => setCurrentEvent((prev) => ({ ...prev, eventDetails: data }))} disabled={!canEdit || !isFormEditable} />
          <TravelDetails data={currentEvent.travelDetails || {}} setDetails={(data) => setCurrentEvent((prev) => ({ ...prev, travelDetails: data }))} disabled={!canEdit || !isFormEditable} />
          <DriverDetails data={currentEvent.driverDetails || {}} setDetails={(data) => setCurrentEvent((prev) => ({ ...prev, driverDetails: data }))} disabled={!canEdit || !isFormEditable} />
        </div>
        <div className="mt-8 flex justify-end gap-3 px-6 pb-6">
          {canEdit && isEditMode && !isFormEditable && (
            <button type="button" onClick={handleEditToggle} className="h-10 rounded-md bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
              Edit Form
            </button>
          )}
          {canEdit && isFormEditable && (
            <>
              <button type="button" onClick={handleCancel} className="h-10 rounded-md border border-gray-300 px-6 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2">
                Cancel
              </button>
              <button type="submit" className="h-10 rounded-md bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                Save and Go Next
              </button>
            </>
          )}
          {canEdit && !isEditMode && !isFormEditable && (
            <button type="submit" className="h-10 rounded-md bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2" disabled={!canEdit}>
              Save and Go Next
            </button>
          )}
        </div>
      </form>

      {/* Removed duplicate submit button outside the form */}
    </div>
  );
}

export default TransportForm;
