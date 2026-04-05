import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setEventData, clearEventData, resetEventState } from "../redux/EventSlice";
import { Home, MessageCircle, Bus, Utensils, Bed, Flag } from "lucide-react";
import { jwtDecode } from "jwt-decode";

const Form = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const canonicalizeDeptKey = (value) => {
    const d = String(value || "").trim().toLowerCase();
    if (!d) return "";
    if (d === "media") return "communication";
    if (d === "guest deparment" || d === "guest department" || d === "guest room") return "guestroom";
    if (d === "systemadmin" || d === "admin") return "system admin";
    return d;
  };

  const userDept = canonicalizeDeptKey(localStorage.getItem("user_dept"));
  const isServiceDeptUser = new Set(["communication", "food", "transport", "guestroom"]).has(userDept);
  const isPrivilegedUser = userDept === "iqac" || userDept === "system admin" || !userDept;

  // If the user leaves the /forms route, treat that as the end of the in-tab flow.
  // This prevents stale session markers from making deep-links reuse old localStorage.
  useEffect(() => {
    return () => {
      // React 18 StrictMode runs an extra mount/unmount cycle in dev.
      // Only clear markers when we truly navigated away from /forms.
      const pathNow = window.location?.pathname || '';
      if (pathNow.startsWith('/forms')) {
        return;
      }

      sessionStorage.removeItem('formsFlowActive');
      sessionStorage.removeItem('editFlowActive');
      sessionStorage.removeItem('editFlowEndformId');
      sessionStorage.removeItem('createFlowEventId');
    };
  }, []);

  // Check if there's an active event
  const endformId = localStorage.getItem('endformId');
  const currentEventId = localStorage.getItem('currentEventId');
  const hasActiveEvent = endformId; // Only consider it an active event if there's an endformId (existing event)

  // Only read from Redux if there's an active event
  const event = useSelector((state) => {
    if (!hasActiveEvent) return {};
    return state.event?.event || {};
  });
  
  console.log("Form - Current event data from Redux:", event);
  console.log("Form - Has active event:", hasActiveEvent);

  const token = localStorage.getItem("token");
  const decodedToken = token ? jwtDecode(token) : null;
  let role = decodedToken ? decodedToken.designation : null;

  useEffect(() => {
    console.log("=== FORM COMPONENT DEBUG ===");
    console.log("Form - useEffect triggered");
    console.log("Form - Token exists:", !!token);
    
    if (!token) {
      console.log("Form - No token, navigating to home");
      navigate("/");
      return;
    }

    // Check if we're editing an existing event (endformId exists or isEditMode is true)
    const endformId = localStorage.getItem('endformId');
    const isEditMode = localStorage.getItem('isEditMode') === 'true';
    const currentEventId = localStorage.getItem('currentEventId');
    const startNewFlow = localStorage.getItem('startNewFlow') === 'true';
    const activeCreateFlow = localStorage.getItem('activeCreateFlow') === 'true';
    const activeCreateFlowAt = Number(localStorage.getItem('activeCreateFlowAt') || 0);
    const basicEventId = localStorage.getItem('basicEventId');
    const hasRecentCreateFlow = Number.isFinite(activeCreateFlowAt)
      && activeCreateFlowAt > 0
      && (Date.now() - activeCreateFlowAt) < 6 * 60 * 60 * 1000;
    const hasValidCreateContext =
      activeCreateFlow &&
      hasRecentCreateFlow &&
      currentEventId &&
      basicEventId &&
      String(currentEventId) === String(basicEventId);

    const hasFormsFlowSession = sessionStorage.getItem('formsFlowActive') === 'true';
    const editFlowActive = sessionStorage.getItem('editFlowActive') === 'true';
    const editFlowEndformId = sessionStorage.getItem('editFlowEndformId');
    const hasValidEditContext =
      isEditMode &&
      !!endformId &&
      editFlowActive &&
      !!editFlowEndformId &&
      String(editFlowEndformId) === String(endformId);
    
    console.log("Form - Initial values:");
    console.log("Form - endformId:", endformId);
    console.log("Form - currentEventId:", currentEventId);
    console.log("Form - isEditMode:", isEditMode);
    console.log("Form - startNewFlow:", startNewFlow);

    const hasAnyEventContext = !!currentEventId || !!endformId;

    // If the user is on the Basic step, treat this tab as being inside the forms flow.
    // This prevents immediate redirects when they click other steps.
    if (location.pathname === '/forms/basic') {
      sessionStorage.setItem('formsFlowActive', 'true');
    }

    // Explicit new-event action from dashboard/profile/pending: always reset flow state.
    if (startNewFlow) {
      sessionStorage.removeItem('formsFlowActive');
      sessionStorage.removeItem('editFlowActive');
      sessionStorage.removeItem('editFlowEndformId');
      sessionStorage.removeItem('createFlowEventId');
      dispatch(clearEventData());
      dispatch(resetEventState());
      [
        'foodForm', 'guestRoomForm', 'transportForm', 'communicationForm',
        'basicEvent', 'iqacno', 'common_data', 'foodFormData', 'foodFormDataEndformId', 'guestRoomFormData',
        'transportFormData', 'communicationFormData', 'foodFormState', 'guestRoomFormState',
        'transportFormState', 'communicationFormState', 'formData', 'selectedOptions',
        'currentFormData', 'eventFormData', 'basicEventId', 'currentEventData',
        'eventData', 'formState', 'communicationState', 'transportState', 'foodState', 'guestRoomState',
        'currentEventId', 'endformId', 'isEditMode',
        'activeCreateFlow', 'activeCreateFlowAt',
        'foodFlowAccess', 'foodFlowAccessAt',
        'foodFormEventId',
        'foodFormEndformId',
        'guestRoomFormEndformId',
        'foodHasUnsavedChanges', 'guestRoomHasUnsavedChanges', 'transportHasUnsavedChanges', 'communicationHasUnsavedChanges',
        'startNewFlow'
      ].forEach((key) => localStorage.removeItem(key));

      // We are now intentionally inside the forms flow in this tab.
      // Mark the session so navigation doesn't loop-trigger startNewFlow again.
      if (location.pathname === '/forms/basic') {
        sessionStorage.setItem('formsFlowActive', 'true');
      }
      // Ensure user starts from Basic form in a clean state.
      if (location.pathname !== '/forms/basic') {
        navigate('/forms/basic');
      }
      return;
    }

    // If edit mode is set in localStorage but this tab did not enter via EventCard Edit,
    // treat it as stale and force a clean start (empty forms).
    if ((isEditMode || endformId) && !hasValidEditContext) {
      console.log('Form - Clearing stale edit context (no valid edit session marker)');
      sessionStorage.removeItem('formsFlowActive');
      sessionStorage.removeItem('editFlowActive');
      sessionStorage.removeItem('editFlowEndformId');
      sessionStorage.removeItem('createFlowEventId');
      dispatch(clearEventData());
      dispatch(resetEventState());
      [
        'endformId', 'isEditMode', 'currentEventId', 'basicEventId', 'currentEventData',
        'basicEvent', 'common_data', 'iqacno',
        'foodForm', 'foodFormId', 'foodFormData', 'foodFormDataEndformId', 'foodFormEventId', 'foodFormEndformId',
        'guestRoomForm', 'guestRoomFormId', 'guestRoomFormData', 'guestRoomFormEndformId',
        'transportForm', 'transportFormId', 'transportFormData',
        'communicationForm', 'communicationFormId', 'communicationFormData',
        'foodHasUnsavedChanges', 'guestRoomHasUnsavedChanges', 'transportHasUnsavedChanges', 'communicationHasUnsavedChanges',
        'activeCreateFlow', 'activeCreateFlowAt', 'foodFlowAccess', 'foodFlowAccessAt',
      ].forEach((key) => localStorage.removeItem(key));

      if (location.pathname !== '/forms/basic') {
        navigate('/forms/basic');
      }
      return;
    }

    // Direct /forms entry without edit mode should behave like starting a new event.
    if (location.pathname === '/forms' && !hasValidEditContext) {
      sessionStorage.removeItem('formsFlowActive');
      localStorage.setItem('startNewFlow', 'true');
      navigate('/forms/basic');
      return;
    }

    // If we reached the wrapper route during a valid create/edit session,
    // always start on the Basic step (avoid landing on the index route).
    if (location.pathname === '/forms' && (hasValidEditContext || hasValidCreateContext)) {
      navigate('/forms/basic');
      return;
    }

    // Direct deep-link into a later step without a valid create/edit context should NOT reuse stale caches.
    // Force a clean start from Basic.
    if (
      location.pathname.startsWith('/forms') &&
      location.pathname !== '/forms' &&
      location.pathname !== '/forms/basic' &&
      !hasValidEditContext &&
      !hasValidCreateContext &&
      !hasFormsFlowSession
    ) {
      sessionStorage.removeItem('formsFlowActive');

      // Blocked deep-link from outside the forms flow.
      // Clear stale cached form data so direct visits never show old prefills.
      if (!isEditMode && !endformId) {
        [
          'currentEventId',
          'basicEventId',
          'currentEventData',
          'basicEvent',
          'common_data',
          'iqacno',
          'foodForm', 'foodFormId', 'foodFormEventId', 'foodFormEndformId', 'foodFormData', 'foodFormDataEndformId',
          'guestRoomForm', 'guestRoomFormId', 'guestRoomFormEndformId', 'guestRoomFormData',
          'transportForm', 'transportFormId', 'transportFormData',
          'communicationForm', 'communicationFormId', 'communicationFormData',
          'foodHasUnsavedChanges', 'guestRoomHasUnsavedChanges', 'transportHasUnsavedChanges', 'communicationHasUnsavedChanges',
          'activeCreateFlow', 'activeCreateFlowAt',
          'foodFlowAccess', 'foodFlowAccessAt',
        ].forEach((key) => localStorage.removeItem(key));

        // Also clear any in-tab drafts.
        sessionStorage.removeItem('basicDraft');
        sessionStorage.removeItem('basicDraftOrganizers');
        sessionStorage.removeItem('basicDraftResourcePersons');
      }

      navigate('/forms/basic');
      return;
    }

    // Mark a valid in-tab forms flow when user is on Basic or edit flow.
    if (location.pathname === '/forms/basic' || hasValidEditContext || hasValidCreateContext) {
      sessionStorage.setItem('formsFlowActive', 'true');
    }

    // Prevent stale previous-event context from leaking into forms (notably Food prefill).
    if (currentEventId && !endformId && !isEditMode && !hasValidCreateContext && !hasFormsFlowSession) {
      console.log("Form - Clearing stale create context");
      [
        'currentEventId',
        'currentEventData',
        'activeCreateFlow',
        'activeCreateFlowAt',
        'foodFlowAccess',
        'foodFlowAccessAt',
        'foodForm',
        'foodFormId',
        'foodFormEventId',
        'foodFormEndformId',
        'foodFormData',
        'guestRoomForm',
        'guestRoomFormId',
        'guestRoomFormEndformId',
        'guestRoomFormData',
        'transportForm',
        'transportFormId',
        'transportFormData',
        'communicationForm',
        'communicationFormId',
        'communicationFormData',
      ].forEach((key) => localStorage.removeItem(key));
    }
    
    // If we have isEditMode but no endformId, this is also a stale edit mode - clear it
    if (isEditMode && !endformId) {
      console.log("Form - Clearing stale isEditMode flag (no endformId)");
      localStorage.removeItem('isEditMode');
    }

    // If we're in create flow (currentEventId present) and not truly editing,
    // clear stale edit context that can leak old form values.
    if (currentEventId && !isEditMode && endformId) {
      console.log("Form - Clearing stale endform/edit context for create flow");
      [
        'endformId',
        'foodForm',
        'guestRoomForm',
        'transportForm',
        'communicationForm',
        'foodFormData',
        'guestRoomFormData',
        'transportFormData',
        'communicationFormData',
        'foodHasUnsavedChanges',
        'guestRoomHasUnsavedChanges',
        'transportHasUnsavedChanges',
        'communicationHasUnsavedChanges',
      ].forEach((key) => localStorage.removeItem(key));
    }
    
    // Clear stale data only when there is no active flow at all.
    if (!currentEventId && !endformId && !isEditMode) {
      console.log("Form - No active flow, clearing stale local data for fresh start");
      
      dispatch(clearEventData());
      dispatch(resetEventState());
      
      // Clear all flags and data
      const itemsToClear = [
        'foodForm', 'guestRoomForm', 'transportForm', 'communicationForm',
        'basicEvent', 'iqacno', 'common_data', 'foodFormData', 'guestRoomFormData',
        'transportFormData', 'communicationFormData', 'foodFormState', 'guestRoomFormState',
        'transportFormState', 'communicationFormState', 'formData', 'selectedOptions',
        'currentFormData', 'eventFormData', 'basicEventId', 'currentEventData',
        'eventData', 'formState', 'communicationState', 'transportState', 'foodState', 'guestRoomState',
        /* 'currentEventId', */ 'endformId', 'isEditMode', 'activeCreateFlow', 'activeCreateFlowAt', 'foodFlowAccess', 'foodFlowAccessAt'
        // Do NOT clear currentEventId for fresh start, only when truly resetting the event flow
      ];
      
      console.log('Form - Clearing all data for fresh start');
      console.log('Form - Before clearing - currentEventId:', localStorage.getItem('currentEventId'));
      console.log('Form - Before clearing - endformId:', localStorage.getItem('endformId'));
      console.log('Form - Before clearing - isEditMode:', localStorage.getItem('isEditMode'));
      itemsToClear.forEach(item => {
        console.log('Form - Removing:', item);
        localStorage.removeItem(item);
      });
      console.log('Form - After clearing - currentEventId:', localStorage.getItem('currentEventId'));
      console.log('Form - After clearing - endformId:', localStorage.getItem('endformId'));
      console.log('Form - After clearing - isEditMode:', localStorage.getItem('isEditMode'));
    } else {
      // Active creation/edit flow - preserve data across form navigation
      console.log("Form - Active flow detected, preserving data:", { endformId, currentEventId, isEditMode });
    }

  }, [token, dispatch, navigate, location.pathname]);

    // The nested routes will handle form rendering
  // We just need to render the Outlet

  // Intentionally no unmount cleanup for flow markers.
  // In React 18 dev StrictMode, effects are mounted/unmounted twice.
  // Clearing sessionStorage here would immediately break edit/create flow.

  const formSteps = [
    { to: "/forms/basic", icon: Home, label: "Basic Event" },
    { to: "/forms/communication", icon: MessageCircle, label: "Communication" },
    { to: "/forms/transport", icon: Bus, label: "Transport" },
    { to: "/forms/food", icon: Utensils, label: "Food" },
    { to: "/forms/guest-room", icon: Bed, label: "Guest Room" },
    { to: "/forms/end", icon: Flag, label: "End Form" },
  ];

  const serviceDeptStepTo = (() => {
    if (userDept === "communication") return "/forms/communication";
    if (userDept === "transport") return "/forms/transport";
    if (userDept === "food") return "/forms/food";
    if (userDept === "guestroom") return "/forms/guest-room";
    return "";
  })();

  const visibleSteps = (() => {
    if (!isServiceDeptUser || isPrivilegedUser) return formSteps;
    const allowed = new Set(["/forms/basic", serviceDeptStepTo].filter(Boolean));
    return formSteps.filter((step) => allowed.has(step.to));
  })();

  return (
    <div className="w-full">
      <div className="w-full bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/80 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/80">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Event Form Navigator</h1>
              <p className="mt-1 text-sm text-slate-500">Complete all sections in sequence</p>
            </div>

            <nav className="custom-scrollbar overflow-x-auto">
              <ul className="flex min-w-max items-center gap-2">
                {visibleSteps.map((step) => {
                  const Icon = step.icon;
                  const active = location.pathname === step.to;

                  return (
                    <li key={step.to}>
                      <Link
                        to={step.to}
                        className={`group flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                          active
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
                            : "border-emerald-900/10 bg-white text-slate-600 hover:border-emerald-400/40 hover:bg-emerald-50 hover:text-emerald-900"
                        }`}
                      >
                        <Icon size={16} />
                        <span>{step.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>

        <div className="forms-uniform p-3 sm:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Form;
