import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const EndForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formStatus, setFormStatus] = useState({
    basicEvent: false,
    transport: false,
    food: false,
    guestRoom: false,
    communication: false
  });

  const event1Basics = useSelector((state) => state.event?.event?.basicEvent);

  // All localStorage gets at the top
  const foodFormId = localStorage.getItem('foodFormId');
  const guestformId = localStorage.getItem('guestRoomFormId');
  const transportFormId = localStorage.getItem('transportFormId');
  const communicationformId = localStorage.getItem('communicationFormId');
  const eventdataId = localStorage.getItem('basicEventId');
  const currentEventId = localStorage.getItem('currentEventId');
  const iqacnoRaw = localStorage.getItem('iqacno');
  let iqacno = iqacnoRaw;
  try {
    const parsed = JSON.parse(iqacnoRaw);
    if (parsed && parsed.iqacNumber) {
      iqacno = parsed.iqacNumber;
    }
  } catch (e) {
    // Not JSON, use as is
  }

  // Check if all forms are complete
  const basicEventComplete = eventdataId || currentEventId;
  
  // More robust form completion check
  // Check if we have the current event ID and all form IDs exist
  // Prioritize localStorage IDs over backend verification
  const allFormsComplete = basicEventComplete && 
    (foodFormId || formStatus.food) && 
    (guestformId || formStatus.guestRoom) && 
    (transportFormId || formStatus.transport) && 
    (communicationformId || formStatus.communication);

  // Add a function to verify localStorage IDs are valid
  const verifyLocalStorageIds = async () => {
    const idsToVerify = [
      { key: 'foodFormId', endpoint: '/food/' },
      { key: 'guestRoomFormId', endpoint: '/guestroom/bookings/' },
      { key: 'transportFormId', endpoint: '/transportform/transports/' },
      { key: 'communicationFormId', endpoint: '/media/' }
    ];

    const results = {};
    
    for (const item of idsToVerify) {
      const id = localStorage.getItem(item.key);
      if (id) {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}${item.endpoint}${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          results[item.key] = !!response.data;
          console.log(`Verified ${item.key}:`, !!response.data);
        } catch (error) {
          console.log(`Failed to verify ${item.key}:`, error);
          // For new events, if we can't verify but the ID exists, assume it's valid
          results[item.key] = true;
        }
      } else {
        results[item.key] = false;
      }
    }

    // Update form status based on verification - this should be the primary method
    setFormStatus(prev => ({
      ...prev,
      food: results.foodFormId,
      guestRoom: results.guestRoomFormId,
      transport: results.transportFormId,
      communication: results.communicationFormId
    }));

    console.log("localStorage verification results:", results);
    return results;
  };

  // Update form status in real-time
  useEffect(() => {
    setFormStatus({
      basicEvent: !!(eventdataId || currentEventId),
      transport: !!transportFormId,
      food: !!foodFormId,
      guestRoom: !!guestformId,
      communication: !!communicationformId
    });
  }, [foodFormId, guestformId, transportFormId, communicationformId, eventdataId, currentEventId]);

  console.log("=== ENDFORM DEBUG ===");
  console.log("EndForm component rendering");
  console.log("foodFormId:", foodFormId);
  console.log("guestformId:", guestformId);
  console.log("transportFormId:", transportFormId);
  console.log("communicationformId:", communicationformId);
  console.log("eventdataId:", eventdataId);
  console.log("currentEventId:", currentEventId);
  console.log("basicEventComplete:", basicEventComplete);
  console.log("allFormsComplete:", allFormsComplete);
  console.log("formStatus:", formStatus);
  console.log("location.pathname:", location.pathname);

  // Add a function to manually check form completion from backend
  const checkFormCompletionFromBackend = async () => {
    if (!currentEventId) {
      console.log("No current event ID found, cannot check backend");
      return;
    }

    try {
      console.log("Checking form completion from backend for event:", currentEventId);
      
      // First, check if there's an existing End Form for this event
      try {
        const endformResponse = await axios.get(`${import.meta.env.VITE_API_URL}/endform/getallforms`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const allEndforms = endformResponse.data?.data || [];
        const existingEndform = allEndforms.find(endform => 
          endform.eventdata === currentEventId || 
          endform.eventId === currentEventId ||
          endform.event === currentEventId
        );
        
        if (existingEndform) {
          console.log("Found existing End Form:", existingEndform);
          
          // Check if the End Form has references to all the other forms
          const results = {
            transport: !!(existingEndform.transportform && existingEndform.transportform.length > 0),
            food: !!existingEndform.foodform,
            guestRoom: !!existingEndform.guestform,
            communication: !!existingEndform.communicationform
          };
          
          console.log("Form completion from existing End Form:", results);
          
          // Update form status based on End Form results
          setFormStatus(prev => ({
            ...prev,
            transport: results.transport,
            food: results.food,
            guestRoom: results.guestRoom,
            communication: results.communication
          }));
          
          return;
        }
      } catch (error) {
        console.log("Error checking existing End Form:", error);
      }
      
      // If no existing End Form, check individual forms
      // Check each form type by making API calls
      const checks = [
        { name: 'transport', endpoint: '/transportform/transports' },
        { name: 'food', endpoint: '/food/' },
        { name: 'guestRoom', endpoint: '/guestroom/bookings' },
        { name: 'communication', endpoint: '/media/media' }
      ];

      const results = {};
      
      for (const check of checks) {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}${check.endpoint}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          // Check if any form exists for the current event
          const forms = response.data?.data || [];
          const hasFormForCurrentEvent = forms.some(form => 
            form.eventdata === currentEventId || 
            form.eventId === currentEventId ||
            form.event === currentEventId
          );
          
          results[check.name] = hasFormForCurrentEvent;
          console.log(`${check.name} form check:`, hasFormForCurrentEvent);
        } catch (error) {
          console.log(`Error checking ${check.name} form:`, error);
          results[check.name] = false;
        }
      }

      // Update form status based on backend results
      setFormStatus(prev => ({
        ...prev,
        transport: results.transport,
        food: results.food,
        guestRoom: results.guestRoom,
        communication: results.communication
      }));

      console.log("Backend form completion results:", results);
    } catch (error) {
      console.error("Error checking form completion from backend:", error);
    }
  };

  useEffect(() => {
    console.log("EndForm mounted/updated, path:", location.pathname);
    
    // First check localStorage IDs - this should be the primary method for new events
    if (currentEventId) {
      verifyLocalStorageIds();
    }
    
    // Load data from localStorage when component mounts or path changes
    const loadData = () => {
      // Helper function to safely parse JSON
      const safeParseJSON = (key) => {
        try {
          const value = localStorage.getItem(key);
          if (!value || value === 'null' || value === 'undefined') {
            return {};
          }
          return JSON.parse(value);
        } catch (error) {
          console.log(`Error parsing ${key} from localStorage:`, error);
          return {};
        }
      };

      const iqacData = safeParseJSON("iqacno");
      const basicEvent = safeParseJSON("basicEvent");
      const transportForm = safeParseJSON("transportForm");
      const foodForm = safeParseJSON("foodForm");
      const guestRoomForm = safeParseJSON("guestRoomForm");
      const communicationForm = safeParseJSON("communicationForm");
      
      console.log("Loaded data:", {
        iqacData,
        basicEvent,
        transportForm,
        foodForm,
        guestRoomForm,
        communicationForm
      });
    };

    loadData();
  }, [location.pathname, currentEventId]);

  function clearLocalStorage() {
    localStorage.removeItem("basicEvent");
    localStorage.removeItem("communicationForm");
    localStorage.removeItem("transportForm");
    localStorage.removeItem("iqacno");
    localStorage.removeItem("foodForm");
    localStorage.removeItem("guestRoomForm");
    localStorage.removeItem("foodFormId");
    localStorage.removeItem("guestRoomFormId");
    localStorage.removeItem("transportFormId");
    localStorage.removeItem("communicationFormId");
    localStorage.removeItem("basicEventId");
    localStorage.removeItem("currentEventId");
    localStorage.removeItem("isEditMode");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Get all sub-form IDs from localStorage (adjust keys as per your app)
    const foodFormId = localStorage.getItem('foodFormId');
    const guestformId = localStorage.getItem('guestRoomFormId');
    const transportFormId = localStorage.getItem('transportFormId');
    const communicationformId = localStorage.getItem('communicationFormId');
    const eventdataId = localStorage.getItem('basicEventId');
    const currentEventId = localStorage.getItem('currentEventId');
    const iqacno = localStorage.getItem('iqacno');

    // Check if all sub-forms are filled
    const basicEventComplete = eventdataId || currentEventId;
    const allFormsComplete = foodFormId && guestformId && transportFormId && communicationformId && basicEventComplete;

    if (!allFormsComplete) {
      toast.error("Please complete all previous forms before submitting the EndForm.");
      return;
    }

    const endformData = {
      iqacno,
      eventdata: eventdataId || currentEventId,
      transportform: [transportFormId],
      foodform: foodFormId,
      guestform: guestformId,
      communicationform: communicationformId,
    };

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/endform/create`, endformData);
      
      if (response.data && response.data.data && response.data.data._id) {
        // Store the endform ID
        localStorage.setItem('endformId', response.data.data._id);
        console.log('Created endform with ID:', response.data.data._id);
        
        // Clear all form data after successful submission
        clearLocalStorage();
        
        toast.success("EndForm submitted successfully!");
        navigate('/pending');
      } else {
        toast.error("Failed to create endform. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting EndForm:", error);
      toast.error("Failed to submit EndForm.");
    }
  };

  console.log("About to render EndForm JSX");

  return (
    <div className="min-h-screen p-2 md:p-4">
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <div className="mb-6 rounded-xl bg-rose-100/70 px-4 py-3 text-sm font-medium text-rose-800">
          Form 6: Final Submission
        </div>
        <h1 className="mb-3 text-2xl font-bold text-slate-800 md:text-3xl">End Form</h1>
        <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Submitting this form closes the event workflow and redirects to the pending dashboard.
        </p>

        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Completion Checklist</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-center justify-between rounded-lg bg-white px-3 py-2"><span>Basic Event Form</span><span>{formStatus.basicEvent ? '✅' : '❌'}</span></li>
            <li className="flex items-center justify-between rounded-lg bg-white px-3 py-2"><span>Transport Form</span><span>{formStatus.transport ? '✅' : '❌'}</span></li>
            <li className="flex items-center justify-between rounded-lg bg-white px-3 py-2"><span>Food Form</span><span>{formStatus.food ? '✅' : '❌'}</span></li>
            <li className="flex items-center justify-between rounded-lg bg-white px-3 py-2"><span>Guest Room Form</span><span>{formStatus.guestRoom ? '✅' : '❌'}</span></li>
            <li className="flex items-center justify-between rounded-lg bg-white px-3 py-2"><span>Communication Form</span><span>{formStatus.communication ? '✅' : '❌'}</span></li>
          </ul>
        </div>

        {!allFormsComplete && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            Please complete all previous forms before submitting the End Form.
          </div>
        )}
        {allFormsComplete && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            All forms are complete. You can submit now.
          </div>
        )}

        <button
          onClick={handleSubmit}
          className={`w-full rounded-lg px-4 py-2 text-base font-semibold text-white transition md:w-56 ${
            !allFormsComplete
              ? "cursor-not-allowed bg-gray-400"
              : "bg-rose-600 hover:bg-rose-700"
          }`}
          disabled={!allFormsComplete}
        >
          Submit Data
        </button>
      </div>
    </div>
  );
};

export default EndForm;
