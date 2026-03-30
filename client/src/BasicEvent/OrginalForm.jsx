import { useState, useEffect } from "react";
import {
  departments,
  academicDepartment,
  professionalBodies,
  logos,
  eventType,
} from "./Static";
import EventTypePopup from "./EventPopup";
import OrganizersForm from "./Organizer";
import ResourcePersonsForm from "./ResourcePopup";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { setEventData, clearEventData, resetEventState } from "../redux/EventSlice";

function toDateInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

const safeParseSessionJSON = (key) => {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const BasicEventForm = ({ eventData, nextForm }) => {
  console.log("BasicEventForm - Component loaded");
  console.log("BasicEventForm - eventData prop:", eventData);
  console.log("BasicEventForm - nextForm prop:", nextForm);
  console.log("BasicEventForm - currentEventId at mount:", localStorage.getItem('currentEventId'));
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // Use optional chaining to safely access nested state
  const event1Basics = useSelector((state) => state.event?.event?.basicEvent);

  console.log("BasicEventForm - event1Basics : ", event1Basics);
  const [SelectedDepartment, setSelectedDepartment] = useState(false);
  const [SelectedLogo, setSelectedLogo] = useState(false);
  const [ProfessionalBodies, setProfessionalBodies] = useState(false);
  const [AcademicDept, setAcademicDept] = useState(false);
  const [EventType, setEventType] = useState(false);
  const onclose = (closefield) => {
    console.log("onclose triggered");
    if (typeof closefield === "function") {
      closefield(!closefield);
    }
  };
  const [organizers, setOrganizers] = useState([
    { employeeId: "", name: "", designation: "", phone: "" },
  ]);
  const [resourcePersons, setResourcePersons] = useState([
    { name: "", affiliation: "" },
  ]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFormEditable, setIsFormEditable] = useState(false); // Controls if form fields are editable
  const [originalFormData, setOriginalFormData] = useState(null); // Store original data for cancel
  const [originalOrganizers, setOriginalOrganizers] = useState(null);
  const [originalResourcePersons, setOriginalResourcePersons] = useState(null);
  const [formData, setFormData] = useState({
    iqacNumber: "",
    departments: [],
    academicdepartment: [],
    professional: [],
    eventName: "",
    eventType: "",
    eventVenue: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    year: "",
    categories: [],
    resourcePersons: 0,
    logos: [],
    description: "",
    societies: "",
  });

  const normalizeOrganizers = (value) => {
    if (Array.isArray(value) && value.length > 0) {
      return value.map((item) => ({
        employeeId: item?.employeeId || "",
        name: item?.name || "",
        designation: item?.designation || "",
        phone: item?.phone || "",
      }));
    }
    if (value && typeof value === "object") {
      return [{
        employeeId: value.employeeId || "",
        name: value.name || "",
        designation: value.designation || "",
        phone: value.phone || "",
      }];
    }
    return [{ employeeId: "", name: "", designation: "", phone: "" }];
  };

  const normalizeResourcePersons = (value) => {
    if (Array.isArray(value) && value.length > 0) {
      return value.map((item) => ({
        name: item?.name || "",
        affiliation: item?.affiliation || "",
      }));
    }
    if (value && typeof value === "object") {
      return [{
        name: value.name || "",
        affiliation: value.affiliation || "",
      }];
    }
    return [{ name: "", affiliation: "" }];
  };

  useEffect(() => {
    // Prefer Redux state for prefill
    const isEditMode = localStorage.getItem('isEditMode') === 'true';
    
    if (isEditMode && event1Basics && event1Basics._id) {
      // Ensure cross-form navigation has a stable event context.
      // Some forms reset themselves if currentEventId is missing.
      localStorage.setItem('currentEventId', String(event1Basics._id));
      localStorage.setItem('basicEventId', String(event1Basics._id));

      const prefillOrganizers = normalizeOrganizers(event1Basics.organizers);
      const prefillResourcePersons = normalizeResourcePersons(event1Basics.resourcePersons);
      const prefillData = {
        iqacNumber: event1Basics.iqacNumber || "",
        eventName: event1Basics.eventName || "",
        eventType: event1Basics.eventType || "",
        startDate: event1Basics.startDate ? event1Basics.startDate.split('T')[0] : "",
        endDate: event1Basics.endDate ? event1Basics.endDate.split('T')[0] : "",
        startTime: event1Basics.startTime || "",
        endTime: event1Basics.endTime || "",
        eventVenue: event1Basics.eventVenue || "",
        departments: event1Basics.departments || [],
        academicdepartment: event1Basics.academicdepartment || [],
        professional: event1Basics.professional || [],
        logos: event1Basics.logos || [],
        year: event1Basics.year || "",
        categories: event1Basics.categories || "",
        description: event1Basics.description || "",
      };
      setFormData(prev => ({ ...prev, ...prefillData }));
      setOrganizers(prefillOrganizers);
      setResourcePersons(prefillResourcePersons);
      setOriginalFormData(prefillData);
      setOriginalOrganizers(prefillOrganizers);
      setOriginalResourcePersons(prefillResourcePersons);
      setIsEditMode(true);
      setIsFormEditable(false); // Start in read-only mode
    } else if (isEditMode && eventData && eventData._id) {
      // Ensure cross-form navigation has a stable event context.
      localStorage.setItem('currentEventId', String(eventData._id));
      localStorage.setItem('basicEventId', String(eventData._id));

      const prefillOrganizers = normalizeOrganizers(eventData.organizers);
      const prefillResourcePersons = normalizeResourcePersons(eventData.resourcePersons);
      const prefillData = {
        iqacNumber: eventData.iqacNumber || "",
        eventName: eventData.eventName || "",
        eventType: eventData.eventType || "",
        startDate: eventData.startDate ? eventData.startDate.split('T')[0] : "",
        endDate: eventData.endDate ? eventData.endDate.split('T')[0] : "",
        startTime: eventData.startTime || "",
        endTime: eventData.endTime || "",
        eventVenue: eventData.eventVenue || "",
        departments: eventData.departments || [],
        academicdepartment: eventData.academicdepartment || [],
        professional: eventData.professional || [],
        logos: eventData.logos || [],
        year: eventData.year || "",
        categories: eventData.categories || "",
        description: eventData.description || "",
      };
      setFormData(prev => ({ ...prev, ...prefillData }));
      setOrganizers(prefillOrganizers);
      setResourcePersons(prefillResourcePersons);
      setOriginalFormData(prefillData);
      setOriginalOrganizers(prefillOrganizers);
      setOriginalResourcePersons(prefillResourcePersons);
      setIsEditMode(true);
      setIsFormEditable(false); // Start in read-only mode
    } else {
      // New event creation - start editable and prefill from saved flow data if available
      const currentEventId = localStorage.getItem('currentEventId');

      // If the user already started filling Basic and navigated away,
      // restore their in-tab draft (session-scoped) before anything else.
      if (!currentEventId) {
        const draft = safeParseSessionJSON('basicDraft');
        const draftOrganizers = safeParseSessionJSON('basicDraftOrganizers');
        const draftResourcePersons = safeParseSessionJSON('basicDraftResourcePersons');

        if (draft && typeof draft === 'object') {
          setFormData((prev) => ({ ...prev, ...draft }));
          if (Array.isArray(draftOrganizers)) {
            setOrganizers(draftOrganizers);
          }
          if (Array.isArray(draftResourcePersons)) {
            setResourcePersons(draftResourcePersons);
          }
          setIsEditMode(false);
          setIsFormEditable(true);
          return;
        }
      }

      const basicFromStorage = JSON.parse(localStorage.getItem('basicEvent') || 'null');
      const basicFromCommon = JSON.parse(localStorage.getItem('common_data') || 'null');
      const prefillSource = basicFromStorage && (basicFromStorage.eventName || basicFromStorage.iqacNumber)
        ? basicFromStorage
        : basicFromCommon;

      if (prefillSource) {
        const prefillOrganizers = normalizeOrganizers(prefillSource.organizers);
        const prefillResourcePersons = normalizeResourcePersons(prefillSource.resourcePersons);
        const prefillData = {
          iqacNumber: prefillSource.iqacNumber || "",
          eventName: prefillSource.eventName || "",
          eventType: prefillSource.eventType || "",
          startDate: prefillSource.startDate ? prefillSource.startDate.split('T')[0] : "",
          endDate: prefillSource.endDate ? prefillSource.endDate.split('T')[0] : "",
          startTime: prefillSource.startTime || "",
          endTime: prefillSource.endTime || "",
          eventVenue: prefillSource.eventVenue || "",
          departments: prefillSource.departments || [],
          academicdepartment: prefillSource.academicdepartment || [],
          professional: prefillSource.professional || [],
          logos: prefillSource.logos || [],
          year: prefillSource.year || "",
          categories: prefillSource.categories || "",
          description: prefillSource.description || "",
        };
        setFormData(prev => ({ ...prev, ...prefillData }));
        setOrganizers(prefillOrganizers);
        setResourcePersons(prefillResourcePersons);
      }

      setIsEditMode(false);
      setIsFormEditable(true);
    }
  }, [event1Basics, eventData]);

  // Session-scoped draft persistence for new event creation.
  // Keeps the Basic form from losing user input when they click other steps.
  useEffect(() => {
    const inEditMode = localStorage.getItem('isEditMode') === 'true';
    const currentEventId = localStorage.getItem('currentEventId');
    if (inEditMode) return;
    if (currentEventId) return;

    sessionStorage.setItem('basicDraft', JSON.stringify(formData));
    sessionStorage.setItem('basicDraftOrganizers', JSON.stringify(organizers));
    sessionStorage.setItem('basicDraftResourcePersons', JSON.stringify(resourcePersons));
  }, [formData, organizers, resourcePersons]);

  useEffect(() => {
    const inEditMode = localStorage.getItem('isEditMode') === 'true';
    if (inEditMode) return;

    if (!eventData) {
      const empiddecode = localStorage.getItem("event_token");
      if (empiddecode) {
        try {
          const data = jwtDecode(empiddecode);
          console.log("employee data : ", data);

          setOrganizers((prev) => {
            const updatedOrganizer = {
              employeeId: data.empid,
              name: data.name,
              designation: data.designation,
              phone: data.phonenumber,
            };
            console.log(
              "organizer data filled (inside setState):",
              updatedOrganizer
            );
            return [updatedOrganizer]; // Return as array
          });
        } catch (error) {
          console.error("Invalid token:", error);
        }
      }
    }
  }, []);

  useEffect(() => {
    console.log("Organizer state updated:", organizers);
  }, [organizers]);

  useEffect(() => {
    console.log("FormData updated:", formData);
    console.log("FormData departments:", formData.departments);
    console.log("FormData logos:", formData.logos);
    console.log("FormData professional:", formData.professional);
  }, [formData]);

  const handleEditToggle = () => {
    if (!isFormEditable) {
      // Entering edit mode - store original data for cancel
      setOriginalFormData(JSON.parse(JSON.stringify(formData)));
      setOriginalOrganizers(JSON.parse(JSON.stringify(organizers)));
      setOriginalResourcePersons(JSON.parse(JSON.stringify(resourcePersons)));
      setIsFormEditable(true);
    }
  };

  const handleCancel = () => {
    // Revert to original data
    if (originalFormData) {
      setFormData(originalFormData);
      setOrganizers(originalOrganizers || organizers);
      setResourcePersons(originalResourcePersons || resourcePersons);
    }
    setIsFormEditable(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation for required fields
    const requiredFields = [
      { key: 'iqacNumber', label: 'IQAC Number' },
      { key: 'eventName', label: 'Event Name' },
      { key: 'eventType', label: 'Event Type' },
      { key: 'eventVenue', label: 'Event Venue' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'endDate', label: 'End Date' },
      { key: 'startTime', label: 'Start Time' },
      { key: 'endTime', label: 'End Time' },
    ];
    for (const field of requiredFields) {
      const value = formData[field.key] || (field.key === 'resourcePersons' ? resourcePersons : null);
      if (
        value === undefined ||
        value === null ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        toast.error(`${field.label} is required.`);
        return;
      }
    }

    try {
      const dataToPost = {
        ...formData,
        organizers,
        resourcePersons,
      };

      console.log("Data to be posted:", dataToPost);
      const eventIdToUpdate = event1Basics?._id || formData.basicEventId || localStorage.getItem('basicEventId');
      let response;
      console.log("Event ID for update:", eventIdToUpdate);
      
      const token = localStorage.getItem('token');
      console.log('BasicEventForm - Token from localStorage:', token ? 'Present' : 'Missing');
      
      if (!token) {
        toast.error('Authentication token missing. Please log in again.');
        navigate('/');
        return;
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      if (isEditMode && eventIdToUpdate) {
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/event/${eventIdToUpdate}`,
          dataToPost,
          { headers }
        );
        
        if (response.status === 200) {
          toast.success("Event updated successfully!");
          // Update Redux with updated data
          dispatch(setEventData(response.data));
          setIsFormEditable(false); // Exit edit mode after save
          setOriginalFormData(null); // Clear original data
          // Continue to next form
          navigate("/forms/communication");
        } else {
          toast.error("Failed to update event. Please try again.");
        }
      } else {
        console.log("data to be posted");
        localStorage.setItem("common_data", JSON.stringify(dataToPost));

        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/event/create`,
          dataToPost,
          { headers }
        );
        console.log("response of the form status : ", response);
        console.log("response.data:", response.data);
        console.log("response.data.event:", response.data.event);
        console.log("response.data.event._id:", response.data.event._id);
        
        if (response.status === 200) {
          // Update Redux state with only basicEvent and empty slices for a new event
          const newEventData = {
            basicEvent: response.data.event,
            communicationdata: {},
            transport: [],
            foodform: {},
            guestform: {},
            end: {}
          };
          console.log("Dispatching new event data to Redux:", newEventData);
          dispatch(setEventData(newEventData));
          localStorage.setItem('currentEventData', JSON.stringify(newEventData));

          const eventformId = response.data.event._id;
          const iqacNumber = formData.iqacNumber;

          localStorage.setItem(
            "basicEvent",
            JSON.stringify(response.data.event)
          );
          localStorage.setItem(
            "iqacno",
            iqacNumber
          );
          localStorage.setItem('currentEventId', eventformId);
          localStorage.setItem('basicEventId', eventformId);
          localStorage.setItem('activeCreateFlow', 'true');
          localStorage.setItem('activeCreateFlowAt', String(Date.now()));

          // Bind this create flow to the current tab/session so direct URL visits
          // in a fresh tab can't hydrate stale localStorage and leak old data.
          sessionStorage.setItem('createFlowEventId', String(eventformId));

          // Clear old form IDs to prevent loading old data
          localStorage.removeItem('foodFormId');
          localStorage.removeItem('guestRoomFormId');
          localStorage.removeItem('transportFormId');
          localStorage.removeItem('communicationFormId');
          localStorage.removeItem('endformId'); // Clear endformId for new events
          localStorage.removeItem('isEditMode'); // Clear edit mode flag for new events
          localStorage.removeItem('foodForm');
          localStorage.removeItem('guestRoomForm');
          localStorage.removeItem('transportForm');
          localStorage.removeItem('communicationForm');
          localStorage.removeItem('foodFormData');
          localStorage.removeItem('guestRoomFormData');
          localStorage.removeItem('transportFormData');
          localStorage.removeItem('communicationFormData');
          localStorage.removeItem('foodHasUnsavedChanges');
          localStorage.removeItem('guestRoomHasUnsavedChanges');
          localStorage.removeItem('transportHasUnsavedChanges');
          localStorage.removeItem('communicationHasUnsavedChanges');
          // Don't clear basicEvent, iqacno, or common_data as they were just set

          // Store the event ID for later endform creation
          localStorage.setItem('currentEventId', eventformId);
          console.log('Stored currentEventId in localStorage:', eventformId);
          
          // Verify it was stored correctly
          const storedId = localStorage.getItem('currentEventId');
          console.log('Verified currentEventId in localStorage:', storedId);
          
          // Add a delay to check if it's still there after navigation
          setTimeout(() => {
            const checkId = localStorage.getItem('currentEventId');
            console.log('currentEventId after 1 second:', checkId);
          }, 1000);

          toast.success("Event created successfully!");

          // Clear in-tab draft now that the event is created.
          sessionStorage.removeItem('basicDraft');
          sessionStorage.removeItem('basicDraftOrganizers');
          sessionStorage.removeItem('basicDraftResourcePersons');

          console.log("About to navigate to:", nextForm);
          if (nextForm) {
            console.log("Navigating to nextForm:", nextForm);
            navigate(nextForm);
          } else {
            console.log("Navigating to communication form");
            navigate("/forms/communication");
          }
        } else {
          toast.error("Failed to create event. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error("Authentication failed. Please log in again.");
        // Redirect to login page
        navigate("/");
        return;
      }
      
      // Handle other errors
      const errorMessage = error.response?.data?.message || "Failed to submit data. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleDepartmentChange = (dept) => {
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept],
    }));
  };
  const handleAcademicDepartmentChange = (dept) => {
    setFormData((prev) => ({
      ...prev,
      academicdepartment: prev.academicdepartment.includes(dept)
        ? prev.academicdepartment.filter((d) => d !== dept)
        : [...prev.academicdepartment, dept],
    }));
  };
  const handelProfessionalBodeis = (data) => {
    setFormData((prev) => ({
      ...prev,
      professional: prev.professional.includes(data)
        ? prev.professional.filter((d) => d !== data)
        : [...prev.professional, data],
    }));
  };

  const handleLogoChange = (logo) => {
    setFormData((prev) => ({
      ...prev,
      logos: prev.logos.includes(logo)
        ? prev.logos.filter((l) => l !== logo)
        : [...prev.logos, logo],
    }));
  };
  const HandelEventtype = (logo) => {
    setFormData((prev) => ({
      ...prev,
      eventType: prev.eventType.includes(logo)
        ? prev.eventType.filter((l) => l !== logo)
        : [...prev.eventType, logo],
    }));
  };
  const handleCategoryChange = (category) => {
    setFormData((prevData) => {
      const updatedCategories = prevData.categories.includes(category)
        ? prevData.categories.filter((cat) => cat !== category)
        : [...prevData.categories, category];

      return { ...prevData, categories: updatedCategories };
    });
  };

  const handleEventTypeChange = (eventType) => {
    setFormData((prev) => ({
      ...prev,
      eventType: eventType,
    }));
  };

  useEffect(() => {
    // Clear Redux state and localStorage when starting a new event
    const endformId = localStorage.getItem('endformId');
    const currentEventId = localStorage.getItem('currentEventId');
    const isEditMode = localStorage.getItem('isEditMode') === 'true';
    
    // Only clear when there is no active flow at all.
    if (!currentEventId && !endformId && !isEditMode) {
      console.log("BasicEventForm - No active flow, clearing stale data");
      dispatch(clearEventData());
      // Force a complete Redux reset
      dispatch(resetEventState());
      
      // Comprehensive localStorage clearing - but don't clear currentEventId, basicEvent, iqacno
      const itemsToClear = [
        'foodFormId',
        'guestRoomFormId', 
        'transportFormId',
        'communicationFormId',
        'endformId',
        'foodForm',
        'guestRoomForm',
        'transportForm',
        'communicationForm',
        // Don't clear basicEvent, iqacno, common_data, or currentEventId
        // Additional items that might contain form data
        'foodFormData',
        'guestRoomFormData',
        'transportFormData',
        'communicationFormData',
        'foodFormState',
        'guestRoomFormState',
        'transportFormState',
        'communicationFormState',
        'formData',
        'selectedOptions',
        'currentFormData',
        'eventFormData',
        'communicationFormId',
        'transportFormId',
        'foodFormId',
        'guestRoomFormId',
        'currentEventData',
        'eventData',
        'formState',
        'communicationState',
        'transportState',
        'foodState',
        'guestRoomState'
      ];
      
      itemsToClear.forEach(item => {
        localStorage.removeItem(item);
      });
      
      console.log('BasicEventForm - Cleared all localStorage items for new event');
    }
  }, [dispatch]);

  useEffect(() => {
    return () => {
      const endformId = localStorage.getItem('endformId');
      const currentEventId = localStorage.getItem('currentEventId');
      if (!endformId || !currentEventId) {
        dispatch(clearEventData());
      }
    };
  }, [dispatch]);

  console.log("BasicEventForm - About to render");
  
  return (
    <>
      <div className="w-full px-2 py-4">
        <ToastContainer />
        <div className="mx-auto p-4 md:p-6">
          <div className="mb-6 rounded-xl bg-emerald-100/70 px-4 py-3 text-sm font-medium text-emerald-800">
            Form 1: Basic Event Information
          </div>
          <h1 className="mb-8 text-center text-2xl font-bold text-slate-800 md:text-3xl">
            Request to Organize Event
          </h1>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 space-y-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {/* IQAC Number */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                IQAC Number
              </label>
              <input
                type="text"
                value={formData.iqacNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, iqacNumber: e.target.value })
                }
                disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Event Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Event Name
              </label>
              <input
                type="text"
                value={formData.eventName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, eventName: e.target.value })
                }
                disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Event Type */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Event Type
              </label>
              <select
                value={formData.eventType || ""}
                onChange={(e) => handleEventTypeChange(e.target.value)}
                      disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select Event Type</option>
                {eventType.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Venue */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Event Venue
              </label>
              <input
                type="text"
                value={formData.eventVenue || ""}
                onChange={(e) =>
                  setFormData({ ...formData, eventVenue: e.target.value })
                }
                disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Start Date */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                value={toDateInputValue(formData.startDate)}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* End Date */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                value={toDateInputValue(formData.endDate)}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Year */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <input
                type="number"
                value={formData.year || ""}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Year Categories */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Year Categories
              </label>
              <input
                type="text"
                value={formData.categories || ""}
                onChange={(e) =>
                  setFormData({ ...formData, categories: e.target.value })
                }
                disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter year categories"
              />
            </div>

            {/* Departments */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Departments
              </label>
              <select
                value={(formData.departments && formData.departments[0]) || ""}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Logos */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Logos
              </label>
              <select
                value={(formData.logos && formData.logos[0]) || ""}
                onChange={(e) => handleLogoChange(e.target.value)}
                disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select Logo</option>
                {logos.map((logo) => (
                  <option key={logo} value={logo}>
                    {logo}
                  </option>
                ))}
              </select>
            </div>

            {/* Professional Societies */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Professional Societies
              </label>
              <select
                value={(formData.professional && formData.professional[0]) || ""}
                onChange={(e) => handelProfessionalBodeis(e.target.value)}
                disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select Professional Society</option>
                {professionalBodies.map((society) => (
                  <option key={society} value={society}>
                    {society}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime || ""}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* End Time */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime || ""}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Description */}
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows="4"
                disabled={!isFormEditable}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            {/* Resource Persons (dynamic list) */}
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resource Persons
              </label>
              {resourcePersons.map((person, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={person.name || ""}
                    disabled={!isFormEditable}
                    onChange={e => {
                      const updated = [...resourcePersons];
                      updated[idx].name = e.target.value;
                      setResourcePersons(updated);
                    }}
                    className="block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Affiliation"
                    value={person.affiliation || ""}
                    disabled={!isFormEditable}
                    onChange={e => {
                      const updated = [...resourcePersons];
                      updated[idx].affiliation = e.target.value;
                      setResourcePersons(updated);
                    }}
                    className="block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setResourcePersons(resourcePersons.filter((_, i) => i !== idx));
                    }}
                    disabled={!isFormEditable}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setResourcePersons([...resourcePersons, { name: '', affiliation: '' }])}
                disabled={!isFormEditable}
                className="mt-2 rounded-md bg-emerald-600 px-3 py-1 text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Add Resource Person
              </button>
            </div>

            {/* Organizers (dynamic list) */}
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organizers
              </label>
              {organizers.map((org, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Employee ID"
                    value={org.employeeId || ""}
                    disabled={!isFormEditable}
                    onChange={e => {
                      const updated = [...organizers];
                      updated[idx].employeeId = e.target.value;
                      setOrganizers(updated);
                    }}
                    className="block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Name"
                    value={org.name || ""}
                    disabled={!isFormEditable}
                    onChange={e => {
                      const updated = [...organizers];
                      updated[idx].name = e.target.value;
                      setOrganizers(updated);
                    }}
                    className="block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Designation"
                    value={org.designation || ""}
                    disabled={!isFormEditable}
                    onChange={e => {
                      const updated = [...organizers];
                      updated[idx].designation = e.target.value;
                      setOrganizers(updated);
                    }}
                    className="block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={org.phone || ""}
                    disabled={!isFormEditable}
                    onChange={e => {
                      const updated = [...organizers];
                      updated[idx].phone = e.target.value;
                      setOrganizers(updated);
                    }}
                    className="block w-1/4 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setOrganizers(organizers.filter((_, i) => i !== idx));
                    }}
                    disabled={!isFormEditable}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setOrganizers([...organizers, { employeeId: '', name: '', designation: '', phone: '' }])}
                disabled={!isFormEditable}
                className="mt-2 rounded-md bg-emerald-600 px-3 py-1 text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Add Organizer
              </button>
            </div>

            {/* Submit Button */}
            <div className="col-span-3 mt-8 flex justify-end gap-3">
              {isEditMode && !isFormEditable && (
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="h-10 rounded-md bg-amber-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                >
                  Edit Form
                </button>
              )}
              {isEditMode && isFormEditable && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="h-10 rounded-md bg-slate-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="h-10 rounded-md bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                Save and Go Next
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default BasicEventForm;
