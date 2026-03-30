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
      dispatch(clearEventData());
      dispatch(resetEventState());
      [
        'foodForm', 'guestRoomForm', 'transportForm', 'communicationForm',
        'basicEvent', 'iqacno', 'common_data', 'foodFormData', 'guestRoomFormData',
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
      dispatch(clearEventData());
      dispatch(resetEventState());
      [
        'endformId', 'isEditMode', 'currentEventId', 'basicEventId', 'currentEventData',
        'basicEvent', 'common_data', 'iqacno',
        'foodForm', 'foodFormId', 'foodFormData', 'foodFormEventId', 'foodFormEndformId',
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
          'foodForm', 'foodFormId', 'foodFormEventId', 'foodFormEndformId', 'foodFormData',
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
    { to: "/forms/basic", icon: Home, label: "Basic Event", tone: "from-emerald-500 to-teal-600" },
    { to: "/forms/communication", icon: MessageCircle, label: "Communication", tone: "from-violet-500 to-fuchsia-600" },
    { to: "/forms/transport", icon: Bus, label: "Transport", tone: "from-sky-500 to-cyan-600" },
    { to: "/forms/food", icon: Utensils, label: "Food", tone: "from-amber-500 to-orange-600" },
    { to: "/forms/guest-room", icon: Bed, label: "Guest Room", tone: "from-indigo-500 to-blue-700" },
    { to: "/forms/end", icon: Flag, label: "End Form", tone: "from-rose-500 to-red-600" },
  ];

  const formThemes = {
    "/forms/basic": "bg-emerald-50 border-emerald-200/70",
    "/forms/communication": "bg-violet-50 border-violet-200/70",
    "/forms/transport": "bg-sky-50 border-sky-200/70",
    "/forms/food": "bg-amber-50 border-amber-200/70",
    "/forms/guest-room": "bg-indigo-50 border-indigo-200/70",
    "/forms/end": "bg-rose-50 border-rose-200/70",
  };

  const activeTheme =
    Object.entries(formThemes).find(([path]) => location.pathname.startsWith(path))?.[1] ||
    "bg-white border-slate-200";

  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 md:px-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-slate-800 md:text-2xl">Event Form Navigator</h1>
            <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Complete all sections in sequence
            </p>
          </div>

          <nav className="custom-scrollbar overflow-x-auto pb-1">
            <ul className="flex min-w-max items-center gap-2">
              {formSteps.map((step) => {
                const Icon = step.icon;
                const active = location.pathname === step.to;

                return (
                  <li key={step.to}>
                    <Link
                      to={step.to}
                      className={`group flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                        active
                          ? `border-transparent bg-gradient-to-r ${step.tone} text-white shadow-md`
                          : "border-emerald-900/10 bg-white text-slate-600 hover:border-emerald-400/40 hover:bg-emerald-50"
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
      </header>

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-3 py-4 md:px-7 md:py-6">
        <div className={`forms-uniform min-h-[72vh] rounded-2xl border p-3 md:p-6 ${activeTheme}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Form;
