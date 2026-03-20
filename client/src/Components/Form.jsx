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
    
    console.log("Form - Initial values:");
    console.log("Form - endformId:", endformId);
    console.log("Form - currentEventId:", currentEventId);
    console.log("Form - isEditMode:", isEditMode);
    
    // If we have isEditMode but no currentEventId, this is a stale edit mode - clear it
    if (isEditMode && !currentEventId) {
      console.log("Form - Clearing stale isEditMode flag");
      localStorage.removeItem('isEditMode');
    }
    
    // If we have isEditMode but no endformId, this is also a stale edit mode - clear it
    if (isEditMode && !endformId) {
      console.log("Form - Clearing stale isEditMode flag (no endformId)");
      localStorage.removeItem('isEditMode');
    }
    
    // Only preserve data if we have BOTH endformId AND currentEventId AND isEditMode (indicating a real edit session)
    if (!endformId || !currentEventId || !isEditMode) {
      // No endformId or no currentEventId or no isEditMode means new event creation or stale data - clear everything
      console.log("Form - No endformId or no currentEventId or no isEditMode, clearing all data for fresh start");
      console.log("Form - Condition check:");
      console.log("Form - !endformId:", !endformId);
      console.log("Form - !currentEventId:", !currentEventId);
      console.log("Form - !isEditMode:", !isEditMode);
      
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
        /* 'currentEventId', */ 'endformId', 'isEditMode'
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
      
      // Don't generate custom event ID - let the backend create the MongoDB ObjectId
      console.log('Form - Starting fresh event - will use backend-generated ID');
    } else {
      // We have BOTH endformId AND currentEventId AND isEditMode - this is a real edit session, preserve the data
      console.log("Form - Real edit session detected, preserving data for editing:", { endformId, currentEventId, isEditMode });
    }

  }, [token, dispatch, navigate]);

    // The nested routes will handle form rendering
  // We just need to render the Outlet

  useEffect(() => {
    return () => {
      if (!hasActiveEvent) {
        dispatch(clearEventData());
      }
    };
  }, [dispatch, hasActiveEvent]);

  const formSteps = [
    { to: "/forms/basic", icon: Home, label: "Basic Event", tone: "from-emerald-500 to-teal-600" },
    { to: "/forms/communication", icon: MessageCircle, label: "Communication", tone: "from-violet-500 to-fuchsia-600" },
    { to: "/forms/transport", icon: Bus, label: "Transport", tone: "from-sky-500 to-cyan-600" },
    { to: "/forms/food", icon: Utensils, label: "Food", tone: "from-amber-500 to-orange-600" },
    { to: "/forms/guest-room", icon: Bed, label: "Guest Room", tone: "from-indigo-500 to-blue-700" },
    { to: "/forms/end", icon: Flag, label: "End Form", tone: "from-rose-500 to-red-600" },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-emerald-50/80 via-white to-white">
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
        <div className="forms-uniform glass-surface min-h-[72vh] rounded-2xl p-3 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Form;
