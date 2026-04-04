import React, { useCallback, useEffect, useRef, useState } from "react";
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

  const didUserEditRef = useRef(false);

  const getBasicSourceData = () => {
    try {
      const currentEventId = localStorage.getItem("currentEventId");
      const activeCreateFlow = localStorage.getItem('activeCreateFlow') === 'true';
      const activeCreateFlowAt = Number(localStorage.getItem('activeCreateFlowAt') || 0);
      const isRecentCreateFlow = Number.isFinite(activeCreateFlowAt)
        && activeCreateFlowAt > 0
        && (Date.now() - activeCreateFlowAt) < 60 * 60 * 1000;

      // On direct visits or stale sessions, do not prefill from previous event cache.
      if (!currentEventId || !activeCreateFlow || !isRecentCreateFlow) {
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

      const isForCurrentFlow = (obj) => {
        if (!obj || typeof obj !== "object") return false;
        if (!currentEventId) return false;
        const objId = obj._id || obj.id;
        return objId ? String(objId) === String(currentEventId) : false;
      };

      // Prefer the just-saved Basic Event for the active flow.
      if (hasUsableBasicData(basicFromStorage) && isForCurrentFlow(basicFromStorage)) return basicFromStorage;
      if (hasUsableBasicData(basicFromCurrent) && isForCurrentFlow(basicFromCurrent)) return basicFromCurrent;
      // Never use common_data when there is no active event flow.
      // It can contain stale data from previous sessions.
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

  const getAutofilledFoodBase = () => {
    const basic = getBasicSourceData();
    const organizer = getPrimaryOrganizer(basic);
    const departmentValue = Array.isArray(basic.departments)
      ? basic.departments[0] || ""
      : (basic.departments || basic.department || "");
    const fallbackDate = basic.startDate
      ? new Date(basic.startDate).toISOString().slice(0, 10)
      : "";

    return {
      iqacNumber: basic.iqacNumber || "",
      requisitionDate: fallbackDate,
      department: departmentValue,
      requestorName: organizer.name || basic.requestorName || "",
      empId: organizer.employeeId || basic.empId || "",
      designationDepartment:
        organizer.designation || basic.designationDepartment || basic.designation || "",
      mobileNumber: organizer.phone || basic.mobileNumber || basic.mobile || "",
      eventName: basic.eventName || "",
      eventType: basic.eventType || "",
      otherEventType: "",
      dates: {},
      foodDetails: {},
      amenitiesIncharge: "",
      signOfOS: "",
      facultySignature: "",
      recommendedBy: "",
      deanClearance: "",
    };
  };
  
  // Convert dates from array format to object format for consistent handling
  const normalizeDatesFormat = (dates, foodDetails) => {
    if (!dates) return { dates: {}, foodDetails: {} };
    
    // If already in object format, return as is
    if (!Array.isArray(dates)) {
      return { dates: dates || {}, foodDetails: foodDetails || {} };
    }
    
    // Convert array format back to object format
    const normalizedDates = {};
    const normalizedFoodDetails = { ...foodDetails } || {};
    
    dates.forEach(dateEntry => {
      if (!dateEntry || !dateEntry.date) return;
      
      const startDate = typeof dateEntry.date === 'object' 
        ? dateEntry.date.start 
        : dateEntry.date;
      const endDate = typeof dateEntry.date === 'object' 
        ? dateEntry.date.end 
        : dateEntry.date;
      
      if (startDate) {
        normalizedDates[startDate] = {
          start: startDate,
          end: endDate || startDate
        };
        
        // Extract foodDetails from the array entry if present
        if (dateEntry.foodDetails) {
          normalizedFoodDetails[startDate] = dateEntry.foodDetails;
        }
      }
    });
    
    return { dates: normalizedDates, foodDetails: normalizedFoodDetails };
  };
  
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
  const isCreationFlow = !!currentEventId && !endformId && localStorage.getItem('isEditMode') !== 'true';
  const [isFormEditable, setIsFormEditable] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);
  const rawIsEditMode = localStorage.getItem('isEditMode') === 'true';
  const isEditMode = rawIsEditMode && !!endformId;
  const isTrueEditContext = isEditMode && !!endformId;

  const setFormDataFromUser = useCallback((updater) => {
    didUserEditRef.current = true;
    setFormData((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const liveEndformId = localStorage.getItem('endformId');
      const liveIsEditMode = localStorage.getItem('isEditMode') === 'true' && !!liveEndformId;

      if (liveIsEditMode) {
        try {
          localStorage.setItem('foodFormData', JSON.stringify(next));
          localStorage.setItem('foodHasUnsavedChanges', 'true');
          localStorage.setItem('foodFormDataEndformId', String(liveEndformId));
        } catch {
          // ignore storage failures
        }
      }

      return next;
    });
  }, []);

  const canEdit =
    !isTrueEditContext ||
    isCreationFlow ||
    userDept === "food" ||
    userDept === "iqac" ||
    userDept === "system admin" ||
    !userDept;

  useEffect(() => {
    // New create flow marker: basicEventId matches currentEventId.
    // In this case, only leftover edit/endform keys are stale and must be cleared.
    const currentId = localStorage.getItem('currentEventId');
    const basicId = localStorage.getItem('basicEventId');
    const liveEndformId = localStorage.getItem('endformId');
    const liveIsEditMode = localStorage.getItem('isEditMode') === 'true';
    // Only clear stale edit keys when we're definitely in create flow
    // (no endformId and not in edit mode). In edit mode, currentEventId will
    // naturally equal basicEventId, so clearing here would break editing.
    if (!liveIsEditMode && !liveEndformId && currentId && basicId && String(currentId) === String(basicId)) {
      localStorage.removeItem('endformId');
      localStorage.removeItem('isEditMode');
    }
    
    // If there's no currentEventId and no endformId, clear all stale flags (direct visit)
    if (!currentId && !localStorage.getItem('endformId')) {
      localStorage.removeItem('isEditMode');
      localStorage.removeItem('foodForm');
      localStorage.removeItem('foodFormId');
      localStorage.removeItem('foodFormEventId');
      localStorage.removeItem('foodFormData');
      localStorage.removeItem('foodFormDataEndformId');
      localStorage.removeItem('foodHasUnsavedChanges');
      localStorage.removeItem('currentEventData');
      localStorage.removeItem('basicEvent');
      localStorage.removeItem('common_data');
    }
  }, []);

  useEffect(() => {
    // Guard against stale edit flag from previous flows.
    if (rawIsEditMode && !endformId) {
      localStorage.removeItem('isEditMode');
    }

    // Guard against stale endformId when edit mode is not active.
    if (!rawIsEditMode && endformId) {
      localStorage.removeItem('endformId');
    }
  }, [rawIsEditMode, endformId]);

  useEffect(() => {
    const liveEndformId = localStorage.getItem('endformId');
    const liveCurrentEventId = localStorage.getItem('currentEventId');
    const liveIsEditMode = localStorage.getItem('isEditMode') === 'true' && !!liveEndformId;

    if (!liveIsEditMode || !liveEndformId || !liveCurrentEventId) {
      setIsFormEditable(true);
      return;
    }

    setIsFormEditable(false);
  }, [endformId, rawIsEditMode]);

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

    localStorage.removeItem('foodFormData');
    localStorage.removeItem('foodHasUnsavedChanges');
    localStorage.removeItem('foodFormDataEndformId');
    didUserEditRef.current = false;

    setIsFormEditable(false);
  };

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
    const rawIsEditMode = localStorage.getItem('isEditMode') === 'true';
    const isEditMode = rawIsEditMode && !!endformId;
    const hasFormsFlowSession = sessionStorage.getItem('formsFlowActive') === 'true';
    const createFlowEventId = sessionStorage.getItem('createFlowEventId');
    
    console.log("FoodForm - endformId:", endformId);
    console.log("FoodForm - currentEventId:", currentEventId);
    console.log("FoodForm - isEditMode:", isEditMode);
    console.log("FoodForm - hasFormsFlowSession:", hasFormsFlowSession);
    console.log("FoodForm - All localStorage keys:", Object.keys(localStorage));
    console.log("FoodForm - foodForm in localStorage:", localStorage.getItem('foodForm'));
    console.log("FoodForm - foodFormId in localStorage:", localStorage.getItem('foodFormId'));

    // Direct deep visit (without an active flow session) should always start empty.
    if (!isEditMode && !endformId && !hasFormsFlowSession) {
      console.log("FoodForm - Direct visit detected without active forms flow, clearing stale food cache");
      [
        'foodForm',
        'foodFormId',
        'foodFormEventId',
        'foodFormData',
        'foodFormDataEndformId',
        'foodHasUnsavedChanges',
      ].forEach((key) => localStorage.removeItem(key));

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

    // If this tab did not create the currentEventId, do not hydrate create-flow data.
    // This prevents stale localStorage from leaking into Food on direct URL visits.
    if (currentEventId && !endformId && !isEditMode) {
      const isBoundToThisTab = !!createFlowEventId && String(createFlowEventId) === String(currentEventId);
      if (!isBoundToThisTab) {
        console.log('FoodForm - Create context not bound to this tab; starting empty and clearing Food cache');
        ['foodForm', 'foodFormId', 'foodFormEventId', 'foodFormData', 'foodFormDataEndformId', 'foodHasUnsavedChanges'].forEach((key) => localStorage.removeItem(key));
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
    }

    const basicEventId = localStorage.getItem('basicEventId');
    const activeCreateFlow = localStorage.getItem('activeCreateFlow') === 'true';
    const activeCreateFlowAt = Number(localStorage.getItem('activeCreateFlowAt') || 0);
    const foodFlowAccess = localStorage.getItem('foodFlowAccess') === 'true';
    const foodFlowAccessAt = Number(localStorage.getItem('foodFlowAccessAt') || 0);
    const isRecentCreateFlow = Number.isFinite(activeCreateFlowAt)
      && activeCreateFlowAt > 0
      && (Date.now() - activeCreateFlowAt) < 60 * 60 * 1000;
    const isRecentFoodFlowAccess = Number.isFinite(foodFlowAccessAt)
      && foodFlowAccessAt > 0
      && (Date.now() - foodFlowAccessAt) < 60 * 60 * 1000;
    const currentEventData = JSON.parse(localStorage.getItem('currentEventData') || 'null');
    const basicEventData = JSON.parse(localStorage.getItem('basicEvent') || 'null');
    const linkedIds = [
      basicEventId,
      currentEventData?.basicEvent?._id,
      currentEventData?._id,
      basicEventData?._id,
    ].filter(Boolean).map(String);
    const hasLinkedBasicForCurrentEvent =
      !!currentEventId &&
      linkedIds.includes(String(currentEventId)) &&
      activeCreateFlow &&
      isRecentCreateFlow &&
      foodFlowAccess &&
      isRecentFoodFlowAccess;
    
    // No active flow yet: keep empty form.
    if (!currentEventId && !endformId && !isEditMode) {
      console.log("FoodForm - No active event, starting with empty form");
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

    // Direct visit with stale currentEventId should not prefill old Food data.
    if (currentEventId && !endformId && !isEditMode && !hasLinkedBasicForCurrentEvent) {
      console.log("FoodForm - Stale create context detected, clearing stale food flow keys");
      [
        'currentEventId',
        'foodForm',
        'foodFormId',
        'foodFormEventId',
        'foodFormData',
        'foodFormDataEndformId',
        'foodHasUnsavedChanges',
        'basicEventId',
        'activeCreateFlow',
        'activeCreateFlowAt',
        'foodFlowAccess',
        'foodFlowAccessAt',
      ].forEach((key) => localStorage.removeItem(key));

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

    // New flow after Basic Event save: prefill only from current Basic details.
    if (currentEventId && !endformId && !isEditMode) {
      const storedFoodForm = localStorage.getItem('foodForm');
      const storedFoodFormEventId = localStorage.getItem('foodFormEventId');

      // Never hydrate cached Food data from a different event.
      // If we can't prove it belongs to the current event, treat it as stale.
      if (storedFoodForm && (!storedFoodFormEventId || String(storedFoodFormEventId) !== String(currentEventId))) {
        console.log('FoodForm - Clearing stale foodForm cache (event mismatch)');
        ['foodForm', 'foodFormId', 'foodFormEventId', 'foodFormData', 'foodFormDataEndformId', 'foodHasUnsavedChanges'].forEach((key) => localStorage.removeItem(key));
      }

      const safeStoredFoodForm = localStorage.getItem('foodForm');
      if (safeStoredFoodForm) {
        try {
          const parsedFoodData = JSON.parse(safeStoredFoodForm);
          if (parsedFoodData && Object.keys(parsedFoodData).length > 0) {
            const { dates: normalizedDates, foodDetails: normalizedFoodDetails } = 
              normalizeDatesFormat(parsedFoodData.dates, parsedFoodData.foodDetails);
            
            setFormData({
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
              dates: normalizedDates,
              foodDetails: normalizedFoodDetails,
              amenitiesIncharge: parsedFoodData.amenitiesIncharge || "",
              signOfOS: parsedFoodData.signOfOS || "",
              facultySignature: parsedFoodData.facultySignature || "",
              recommendedBy: parsedFoodData.recommendedBy || "",
              deanClearance: parsedFoodData.deanClearance || "",
              _id: parsedFoodData._id || "",
            });
            setHasInitialized(true);
            return;
          }
        } catch (error) {
          console.error("FoodForm - Error parsing stored food form data in creation flow:", error);
        }
      }
      console.log("FoodForm - New flow detected, applying Basic Event autofill");
      setFormData(getAutofilledFoodBase());
      setHasInitialized(true);
      return;
    }
    
    // Only true edit mode should load existing event data.
    if (isEditMode) {
      // Check if we have unsaved changes (user was actively editing)
      const existingFormData = localStorage.getItem('foodFormData');
      const hasUnsavedChanges = localStorage.getItem('foodHasUnsavedChanges') === 'true';
      const draftEndformId = localStorage.getItem('foodFormDataEndformId');
      
      if (
        existingFormData &&
        hasUnsavedChanges &&
        draftEndformId &&
        String(draftEndformId) === String(endformId)
      ) {
        console.log("Using existing form data from localStorage (unsaved changes)");
        const parsedData = JSON.parse(existingFormData);
        setFormData(parsedData);
        setHasInitialized(true);
        return; // Don't fetch from server if we have unsaved changes
      }
      
      // Check if we have food form data in localStorage (set by Edit button)
      const storedFoodForm = localStorage.getItem('foodForm');
      const storedFoodFormEndformId = localStorage.getItem('foodFormEndformId');
      console.log("FoodForm - Checking for stored food form data");
      console.log("FoodForm - storedFoodForm exists:", !!storedFoodForm);

      // In edit mode, only trust cached foodForm if it matches the current endformId.
      // Otherwise it's almost certainly stale from a different event.
      const canUseCachedFood =
        !!storedFoodForm &&
        !!storedFoodFormEndformId &&
        String(storedFoodFormEndformId) === String(endformId);

      if (storedFoodForm && !canUseCachedFood) {
        console.log('FoodForm - Ignoring cached foodForm (missing/mismatched endform marker)');
      }

      if (canUseCachedFood) {
        try {
          console.log("FoodForm - Using stored food form data from localStorage");
          console.log("FoodForm - Raw stored data:", storedFoodForm);
          const parsedFoodData = JSON.parse(storedFoodForm);

          // If cached is empty, do NOT block backend fetch.
          if (!parsedFoodData || Object.keys(parsedFoodData).length === 0) {
            console.log('FoodForm - Cached foodForm is empty; continuing to fetch');
          } else {
            // Normalize dates format from array to object
            const { dates: normalizedDates, foodDetails: normalizedFoodDetails } =
              normalizeDatesFormat(parsedFoodData.dates, parsedFoodData.foodDetails);

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
              dates: normalizedDates,
              foodDetails: normalizedFoodDetails,
              amenitiesIncharge: parsedFoodData.amenitiesIncharge || "",
              signOfOS: parsedFoodData.signOfOS || "",
              facultySignature: parsedFoodData.facultySignature || "",
              recommendedBy: parsedFoodData.recommendedBy || "",
              deanClearance: parsedFoodData.deanClearance || "",
              _id: parsedFoodData._id || "",
            };

            setFormData(formattedData);
            setHasInitialized(true);
            return;
          }
        } catch (error) {
          console.error("FoodForm - Error parsing stored food form data:", error);
        }
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
            
            // Normalize dates format from array to object
            const { dates: normalizedDates, foodDetails: normalizedFoodDetails } = 
              normalizeDatesFormat(foodData.dates, foodData.foodDetails);
            
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
              dates: normalizedDates,
              foodDetails: normalizedFoodDetails,
              amenitiesIncharge: foodData.amenitiesIncharge || "",
              signOfOS: foodData.signOfOS || "",
              facultySignature: foodData.facultySignature || "",
              recommendedBy: foodData.recommendedBy || "",
              deanClearance: foodData.deanClearance || "",
              _id: foodData._id || "",
            };

            if (didUserEditRef.current) {
              console.log('FoodForm - Skipping prefill because user has started editing');
              return;
            }

            setFormData(formattedData);
            console.log("FoodForm - Set form data with formatted data:", formattedData);
          } else {
            console.log("FoodForm - No existing food data found, starting with empty form");
            if (!didUserEditRef.current) {
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
          }
        } catch (error) {
          console.error("FoodForm - Error fetching food data:", error);
          if (!didUserEditRef.current) {
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
        } finally {
          setHasInitialized(true);
        }
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
      const toISODateOrNull = (value) => {
        if (!value) return null;
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed.toISOString();
      };
      const toSafeString = (value) => (value == null ? "" : String(value));
      const normalizeFoodDetailsForApi = (details = {}) => {
        if (!details || typeof details !== "object") return {};

        const getSection = (section) => {
          if (!section || typeof section !== "object") return {};
          return {
            Veg: toSafeString(section.Veg),
            NonVeg: toSafeString(section.NonVeg ?? section["Non Veg"]),
          };
        };

        const getTotalSection = (section) => {
          if (!section || typeof section !== "object") return {};
          return { total: toSafeString(section.total) };
        };

        return {
          Breakfast: {
            participants: getSection(details.Breakfast?.participants),
            guest: getSection(details.Breakfast?.guest),
          },
          Lunch: {
            participants: getSection(details.Lunch?.participants),
            guest: getSection(details.Lunch?.guest),
          },
          Dinner: {
            participants: getSection(details.Dinner?.participants),
            guest: getSection(details.Dinner?.guest),
          },
          MorningRefreshment: {
            participants: getTotalSection(details.MorningRefreshment?.participants),
            guest: getTotalSection(details.MorningRefreshment?.guest),
          },
          EveningRefreshment: {
            participants: getTotalSection(details.EveningRefreshment?.participants),
            guest: getTotalSection(details.EveningRefreshment?.guest),
          },
        };
      };
      
      // Debug logs to inspect formData before formatting
      console.log("=== FOOD FORM SUBMIT DEBUG ===");
      console.log("formData.dates:", formData.dates);
      console.log("formData.foodDetails:", formData.foodDetails);
      // Format data for MongoDB
      const formattedData = {
        ...formData,
        requisitionDate: toISODateOrNull(formData.requisitionDate),
        dates: Object.entries(formData.dates || {})
          .filter(([_, dateValue]) => dateValue && dateValue.start)
          .map(([dateKey, dateValue]) => {
            const start = toISODateOrNull(dateValue.start);
            const end = toISODateOrNull(dateValue.end || dateValue.start);
            if (!start) return null;
            return {
              date: { start, end },
              foodDetails: normalizeFoodDetailsForApi(
                formData.foodDetails?.[dateValue.start] ||
                formData.foodDetails?.[dateKey] ||
                {}
              ),
            };
          })
          .filter(Boolean)
      };
      // Debug log to inspect formatted data
      console.log("Formatted data to submit:", formattedData);
      
      const token = localStorage.getItem("token");
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      let response;
      const activeEndformId = localStorage.getItem('endformId');
      const activeIsEditMode = localStorage.getItem('isEditMode') === 'true' && !!activeEndformId;
      const submitPayload = { ...formattedData };
      if (submitPayload._id) {
        delete submitPayload._id;
      }

      if (activeIsEditMode || activeEndformId) {
        // Get the food form ID from the current form data
        const foodFormId = formData._id || localStorage.getItem('foodFormId');
        console.log("[DEBUG] Food form ID for update:", foodFormId);
        if (!foodFormId) {
          console.warn("[WARN] Food form ID missing in edit mode, creating a new food entry as fallback.");
          response = await axios.post(
            `${import.meta.env.VITE_API_URL}/food`,
            submitPayload,
            { headers }
          );
        } else {
          response = await axios.put(
            `${import.meta.env.VITE_API_URL}/food/${foodFormId}`,
            submitPayload,
            { headers }
          );
        }
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/food`,
          submitPayload,
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
      if (response && response.status >= 200 && response.status < 300) {
        const savedFood = {
          ...submitPayload,
          _id:
            response.data?.requirement?._id ||
            response.data?._id ||
            response.data?.id ||
            response.data?.data?._id ||
            localStorage.getItem('foodFormId') ||
            formData?._id ||
            "",
        };
        localStorage.setItem('foodForm', JSON.stringify(savedFood));
        const liveEndformId = localStorage.getItem('endformId');
        if (liveEndformId) {
          localStorage.setItem('foodFormEndformId', String(liveEndformId));
        }
        if (eventId) {
          localStorage.setItem('foodFormEventId', String(eventId));
        }
        if (savedFood._id) {
          localStorage.setItem('foodFormId', savedFood._id);
        }

        // Clear edit-mode unsaved draft once saved.
        localStorage.removeItem('foodFormData');
        localStorage.removeItem('foodHasUnsavedChanges');
        localStorage.removeItem('foodFormDataEndformId');
        didUserEditRef.current = false;

        toast.success("Food form saved successfully!");
        // Always fetch latest event data and update Redux after update/create
        if (eventId && /^[0-9a-fA-F]{24}$/.test(eventId)) {
          try {
            const eventResponse = await axios.get(`${import.meta.env.VITE_API_URL}/event/${eventId}`);
            if (eventResponse.data) {
              dispatch(setEventData(eventResponse.data));
            }
          } catch (err) {
            console.error("[ERROR] Failed to fetch latest event data after update:", err);
          }
        } else if (eventId) {
          console.warn("[WARN] Skipping event refresh due to invalid event ID:", eventId);
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
      console.error("Food submit backend error payload:", error?.response?.data);
      const backendMessage =
        error?.response?.data?.details ||
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to save form. Please try again.";
      toast.error(backendMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="xl:w-full px-2 py-4">
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 shadow-lg z-50">
          <div className="h-16 w-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="mx-auto max-w-full overflow-hidden"
      >
        <div className="mb-6 rounded-xl bg-emerald-100/70 px-4 py-3 text-sm font-medium text-emerald-800">
          Form 4: Food Requisition
        </div>
        <Header />
        <div className="p-6 space-y-6">
          <BasicInfo formData={formData} setFormData={setFormDataFromUser} disabled={!canEdit || !isFormEditable} />
          <EventDetails formData={formData} setFormData={setFormDataFromUser} disabled={!canEdit || !isFormEditable} />
          <FoodTable formData={formData} setFormData={setFormDataFromUser} disabled={isTrueEditContext && !isFormEditable} />
          {formData.dates && Object.keys(formData.dates).length === 0 && isCreationFlow && (
            <div className="px-6 py-3 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-800">
              ℹ️ Please add event dates in the Event Details section above to show the food table.
            </div>
          )}
        </div>
        <div className="mt-8 flex justify-end gap-3 px-6 pb-6">
          {isEditMode && !isFormEditable && (
            <button type="button" onClick={handleEditToggle} className="h-10 rounded-md bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2" disabled={!canEdit}>
              Edit Form
            </button>
          )}
          {isFormEditable && (
            <>
              <button type="button" onClick={handleCancel} className="h-10 rounded-md border border-gray-300 px-6 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2">
                Cancel
              </button>
              <button type="submit" className="h-10 rounded-md bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
                Save and Go Next
              </button>
            </>
          )}
          {!isEditMode && !isFormEditable && (
            <button type="submit" className="h-10 rounded-md bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2" disabled={!canEdit}>
              Save and Go Next
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default FoodForm;
