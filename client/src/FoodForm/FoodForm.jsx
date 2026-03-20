import React, { useState, useEffect } from "react";
import Header from "./Header";
import BasicInfo from "./BasicInfo";
import EventDetails from "./EventDetails";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FoodTable from "./FoodTable";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setEventData, clearEventData } from "../redux/EventSlice";

function FoodForm({ eventData, nextForm }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Check if there's an active event at the very beginning
  const endformId = localStorage.getItem('endformId');
  const currentEventId = localStorage.getItem('currentEventId');
  const hasActiveEvent = currentEventId; // Allow new event creation with just currentEventId
  
  // For new event creation, allow access to the form even without currentEventId
  // The form will be populated when the Basic Event Form creates the event
  const isNewEventCreation = !endformId && !currentEventId;
  
  // Only read from Redux if there's an active event AND it's an existing event (has endformId)
  const foodForm = useSelector((state) => {
    if (!hasActiveEvent || !endformId) return null; // Don't read from Redux for new events
    return state.event?.event?.foodform || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [formData, setFormData] = useState({
    iqacNumber: "",
    requisitionDate: "",
    department: "",
    requestorName: "",
    empId: "",
    designationDepartment: "",
    mobileNumber: "",
    eventName: "",
    eventType: "",
    otherEventType: "",
    dates: {},
    foodDetails: {},
    amenitiesIncharge: "",
    signOfOS: "",
    facultySignature: "",
    recommendedBy: "",
    deanClearance: "",
  });

  // Define canEdit at the top to avoid temporal dead zone
  const userDept = (localStorage.getItem("user_dept") || "").toLowerCase();
  const canEdit = userDept === "food" || userDept === "iqac" || userDept === "system admin" || !userDept;

  useEffect(() => {
    const endformId = localStorage.getItem('endformId');
    const currentEventId = localStorage.getItem('currentEventId');
    if (!currentEventId) {
      dispatch(clearEventData());
      localStorage.removeItem('foodFormId');
      localStorage.removeItem('foodForm');
      // Also clear the form state
      setFormData({
        iqacNumber: "",
        requisitionDate: "",
        department: "",
        requestorName: "",
        empId: "",
        designationDepartment: "",
        mobileNumber: "",
        eventName: "",
        eventType: "",
        otherEventType: "",
        dates: {},
        foodDetails: {},
        amenitiesIncharge: "",
        signOfOS: "",
        facultySignature: "",
        recommendedBy: "",
        deanClearance: "",
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

  useEffect(() => {
    console.log("=== FOOD FORM DEBUG ===");
    console.log("FoodForm - useEffect triggered");
    
    // Check if there's an active event first
    const endformId = localStorage.getItem("endformId");
    const currentEventId = localStorage.getItem("currentEventId");
    const isEditMode = localStorage.getItem('isEditMode') === 'true';
    
    console.log("FoodForm - endformId:", endformId);
    console.log("FoodForm - currentEventId:", currentEventId);
    console.log("FoodForm - isEditMode:", isEditMode);
    console.log("FoodForm - All localStorage keys:", Object.keys(localStorage));
    console.log("FoodForm - foodForm in localStorage:", localStorage.getItem('foodForm'));
    console.log("FoodForm - foodFormId in localStorage:", localStorage.getItem('foodFormId'));
    
    // Check if we're in edit mode or have an active event
    if (!endformId && !isEditMode) {
      console.log("FoodForm - No active event found, starting with empty form for new event creation");
      // For new event creation, start with empty form
      setFormData({
        iqacNumber: "",
        requisitionDate: "",
        department: "",
        requestorName: "",
        empId: "",
        designationDepartment: "",
        mobileNumber: "",
        eventName: "",
        eventType: "",
        otherEventType: "",
        dates: {},
        foodDetails: {},
        amenitiesIncharge: "",
        signOfOS: "",
        facultySignature: "",
        recommendedBy: "",
        deanClearance: "",
      });
      setHasInitialized(true);
      return;
    }
    
    // If we have an endformId OR isEditMode is true, this is an existing event being edited
    if (endformId || isEditMode) {
      // Check if we have unsaved changes (user was actively editing)
      const existingFormData = localStorage.getItem('foodFormData');
      const hasUnsavedChanges = localStorage.getItem('foodHasUnsavedChanges') === 'true';
      
      if (existingFormData && hasUnsavedChanges) {
        console.log("Using existing form data from localStorage (unsaved changes)");
        const parsedData = JSON.parse(existingFormData);
        setFormData(parsedData);
        setHasInitialized(true);
        return; // Don't fetch from server if we have unsaved changes
      }
      
      // Check if we have food form data in localStorage (set by Edit button)
      const storedFoodForm = localStorage.getItem('foodForm');
      console.log("FoodForm - Checking for stored food form data");
      console.log("FoodForm - storedFoodForm exists:", !!storedFoodForm);
      if (storedFoodForm) {
        try {
          console.log("FoodForm - Using stored food form data from localStorage");
          console.log("FoodForm - Raw stored data:", storedFoodForm);
          const parsedFoodData = JSON.parse(storedFoodForm);
          console.log("FoodForm - Parsed food data:", parsedFoodData);
          console.log("FoodForm - Parsed data keys:", Object.keys(parsedFoodData));
          
          // Check if we have valid food data
          if (!parsedFoodData || Object.keys(parsedFoodData).length === 0) {
            console.log("FoodForm - No valid food data found in localStorage, skipping");
            return;
          }
          
          // Format the data to match our form structure
          const formattedData = {
            iqacNumber: parsedFoodData.iqacNumber || "",
            requisitionDate: parsedFoodData.requisitionDate || "",
            department: parsedFoodData.department || "",
            requestorName: parsedFoodData.requestorName || "",
            empId: parsedFoodData.empId || "",
            designationDepartment: parsedFoodData.designationDepartment || "",
            mobileNumber: parsedFoodData.mobileNumber || "",
            eventName: parsedFoodData.eventName || "",
            eventType: parsedFoodData.eventType || "",
            otherEventType: parsedFoodData.otherEventType || "",
            dates: parsedFoodData.dates || {},
            foodDetails: parsedFoodData.foodDetails || {},
            amenitiesIncharge: parsedFoodData.amenitiesIncharge || "",
            signOfOS: parsedFoodData.signOfOS || "",
            facultySignature: parsedFoodData.facultySignature || "",
            recommendedBy: parsedFoodData.recommendedBy || "",
            deanClearance: parsedFoodData.deanClearance || "",
            _id: parsedFoodData._id || "",
          };
          
          console.log("FoodForm - Final formatted data:", formattedData);
          setFormData(formattedData);
          console.log("FoodForm - Set form data with localStorage data:", formattedData);
          setHasInitialized(true);
          return;
        } catch (error) {
          console.error("FoodForm - Error parsing stored food form data:", error);
        }
      } else {
        console.log("FoodForm - No foodForm data found in localStorage");
      }
      
      // Only fetch data if there's an actual event being created and no localStorage data
      const fetchAndPrefill = async () => {
        try {
          console.log("FoodForm - Fetching data for editing from endformId:", endformId);
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/endform/${endformId}`);
          console.log("FoodForm - Response from endform:", response.data);
          
          if (response.data && response.data.foodform) {
            const foodData = response.data.foodform;
            console.log("FoodForm - Found food data:", foodData);
            
            // Format the data to match our form structure
            const formattedData = {
              iqacNumber: foodData.iqacNumber || "",
              requisitionDate: foodData.requisitionDate || "",
              department: foodData.department || "",
              requestorName: foodData.requestorName || "",
              empId: foodData.empId || "",
              designationDepartment: foodData.designationDepartment || "",
              mobileNumber: foodData.mobileNumber || "",
              eventName: foodData.eventName || "",
              eventType: foodData.eventType || "",
              otherEventType: foodData.otherEventType || "",
              dates: foodData.dates || {},
              foodDetails: foodData.foodDetails || {},
              amenitiesIncharge: foodData.amenitiesIncharge || "",
              signOfOS: foodData.signOfOS || "",
              facultySignature: foodData.facultySignature || "",
              recommendedBy: foodData.recommendedBy || "",
              deanClearance: foodData.deanClearance || "",
              _id: foodData._id || "",
            };
            
            setFormData(formattedData);
            console.log("FoodForm - Set form data with formatted data:", formattedData);
          } else {
            console.log("FoodForm - No existing food data found, starting with empty form");
            setFormData({
              iqacNumber: "",
              requisitionDate: "",
              department: "",
              requestorName: "",
              empId: "",
              designationDepartment: "",
              mobileNumber: "",
              eventName: "",
              eventType: "",
              otherEventType: "",
              dates: {},
              foodDetails: {},
              amenitiesIncharge: "",
              signOfOS: "",
              facultySignature: "",
              recommendedBy: "",
              deanClearance: "",
            });
          }
        } catch (error) {
          console.error("FoodForm - Error fetching food data:", error);
          setFormData({
            iqacNumber: "",
            requisitionDate: "",
            department: "",
            requestorName: "",
            empId: "",
            designationDepartment: "",
            mobileNumber: "",
            eventName: "",
            eventType: "",
            otherEventType: "",
            dates: {},
            foodDetails: {},
            amenitiesIncharge: "",
            signOfOS: "",
            facultySignature: "",
            recommendedBy: "",
            deanClearance: "",
          });
        }
        setHasInitialized(true);
      };
      fetchAndPrefill();
    } else {
      // This is a new event creation - ensure form is empty
      console.log("FoodForm - New event creation, starting with empty form");
      setFormData({
        iqacNumber: "",
        requisitionDate: "",
        department: "",
        requestorName: "",
        empId: "",
        designationDepartment: "",
        mobileNumber: "",
        eventName: "",
        eventType: "",
        otherEventType: "",
        dates: {},
        foodDetails: {},
        amenitiesIncharge: "",
        signOfOS: "",
        facultySignature: "",
        recommendedBy: "",
        deanClearance: "",
      });
      setHasInitialized(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    console.log("=== FOOD FORM SUBMIT CALLED ===");
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
    console.log("Starting form submission...");
    try {
      const eventId = localStorage.getItem("currentEventId");
      if (!eventId) {
        toast.error("No event ID found. Please start from the Basic Event form and create an event first.");
        return;
      }
      
      // Debug logs to inspect formData before formatting
      console.log("=== FOOD FORM SUBMIT DEBUG ===");
      console.log("formData.dates:", formData.dates);
      console.log("formData.foodDetails:", formData.foodDetails);
      // Format data for MongoDB
      const formattedData = {
        ...formData,
        dates: Object.entries(formData.dates)
          .filter(([_, dateValue]) => dateValue && dateValue.start)
          .map(([dateKey, dateValue]) => {
            const start = dateValue.start;
            const end = dateValue.end || start;
            return {
              date: { start, end },
              foodDetails: formData.foodDetails[start] || {}
            };
          })
      };
      // Debug log to inspect formatted data
      console.log("Formatted data to submit:", formattedData);
      
      // Check if eventId is a valid MongoDB ObjectId (24 hex characters)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(eventId);
      if (!isValidObjectId) {
        console.error('Invalid event ID format:', eventId);
        toast.error('Invalid event ID. Please start from the Basic Event form.');
        return;
      }
      
      const token = localStorage.getItem("token");
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      let response;
      if (localStorage.getItem('isEditMode') === 'true' || localStorage.getItem('endformId')) {
        // Get the food form ID from the current form data
        const foodFormId = formData._id;
        console.log("[DEBUG] Food form ID for update:", foodFormId);
        if (!foodFormId) {
          console.error("[ERROR] Food form ID not found in formData:", formData);
          toast.error("Food form ID not found. Please refresh the page or contact support.");
          setIsLoading(false);
          return;
        }
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/food/${foodFormId}`,
          formattedData,
          { headers }
        );
      } else {
        if (formattedData._id) {
          delete formattedData._id;
        }
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/food`,
          formattedData,
          { headers }
        );
        // Debug log to confirm POST response and endformId
        console.log("POST /food response:", response.data, "endformId:", localStorage.getItem('endformId'));
        
        // After creating the food form, save the ID for EndForm
        const subFormId = response.data?.requirement?._id || response.data?._id || response.data?.id || response.data?.data?._id;
        
        // Save the foodFormId for EndForm
        if (subFormId) {
          localStorage.setItem('foodFormId', subFormId);
          console.log('Saved foodFormId to localStorage:', subFormId);
        } else {
          console.error('No food subFormId after creation!');
        }
        
        // Only try to update End Form if it exists (for existing events)
        const endformId = localStorage.getItem('endformId');
        if (subFormId && endformId) {
          console.log('About to PUT to Endform:', { endformId, subFormId });
          try {
            await axios.put(
              `${import.meta.env.VITE_API_URL}/endform/${endformId}`,
              { foodform: subFormId },
              { headers }
            );
            console.log('Successfully updated End Form with food ID');
          } catch (err) {
            console.error('Failed to update Endform with food ID:', err);
            // Don't show error toast for new events - this is expected
            if (endformId) {
              toast.error('Failed to link food form to event. Please contact support if this persists.');
            }
          }
        } else {
          if (!subFormId) {
            console.error('No food subFormId after creation!');
          }
          if (!endformId) {
            console.log('No endformId in localStorage - this is expected for new events');
          }
        }
      }
      if (response.data) {
        toast.success("Food form saved successfully!");
        // Always fetch latest event data and update Redux after update/create
        if (eventId) {
          try {
            const eventResponse = await axios.get(`${import.meta.env.VITE_API_URL}/event/${eventId}`);
            if (eventResponse.data) {
              dispatch(setEventData(eventResponse.data));
            }
          } catch (err) {
            console.error("[ERROR] Failed to fetch latest event data after update:", err);
          }
        }
        if (nextForm) {
          navigate(nextForm);
        } else {
          console.log("Navigating to guest room form");
          navigate("/forms/guest-room");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to save form. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="xl:w-full rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-8">
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 shadow-lg z-50">
          <div className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-full overflow-hidden rounded-2xl border border-amber-900/10 bg-white shadow-xl"
      >
        <div className="border-b border-amber-900/10 bg-amber-100/60 px-6 py-3 text-sm font-semibold text-amber-800">
          Form 4: Food Requisition
        </div>
        <Header />
        <div className="p-6 space-y-6">
          <BasicInfo formData={formData} setFormData={setFormData} />
          <EventDetails formData={formData} setFormData={setFormData} />
          <FoodTable formData={formData} setFormData={setFormData} />
        </div>
        <button type="submit" className="mx-6 mb-6 mt-2 rounded-lg bg-amber-600 px-6 py-2 font-semibold text-white shadow transition hover:bg-amber-700" disabled={!canEdit}>
          {(localStorage.getItem('isEditMode') === 'true' || localStorage.getItem('endformId')) ? "Update Data" : "Save Data"}
        </button>
      </form>
    </div>
  );
}

export default FoodForm;
