import { useState, useEffect, useCallback, useRef } from "react";
import Dashboard from "./Dashboard";
import EventsCard from "./EventsCard";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

function isValidObjectId(id) {
  return typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id);
}

function normalizeMongoId(id) {
  if (!id) return '';
  if (typeof id === 'string') {
    const m = id.match(/[a-fA-F0-9]{24}/);
    return m ? m[0] : id;
  }
  if (typeof id === 'object') {
    // Support Extended JSON shapes or raw ObjectId instances
    if (typeof id.$oid === 'string') return id.$oid;
    if (typeof id.toHexString === 'function') return id.toHexString();
    if (typeof id.toString === 'function') return id.toString();
  }
  return '';
}

function PendingDashboard() {
  console.log("=== PendingDashboard Component Loading ===");
  
  const [activeTab, setActiveTab] = useState("all");
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const skipFirstPathRefetch = useRef(true);

  const token = localStorage.getItem('token');
  let effectiveDept = localStorage.getItem('user_dept') || '';
  if (!effectiveDept && token) {
    try {
      effectiveDept = jwtDecode(token)?.dept || '';
    } catch {
      effectiveDept = '';
    }
  }
  const deptKey = String(effectiveDept || '').trim().toLowerCase();
  const isAcademicUser = (() => {
    if (!deptKey) return false;
    const collegeWide = new Set(['iqac', 'admin', 'system admin', 'systemadmin']);
    const serviceTeams = new Set([
      'communication',
      'media',
      'food',
      'transport',
      'guestroom',
      'guest room',
      'guest department',
      'guest deparment',
    ]);
    if (collegeWide.has(deptKey)) return false;
    if (serviceTeams.has(deptKey)) return false;
    if (deptKey.includes('admin')) return false;
    return true;
  })();

  const fetchPendingEndforms = async (retryCount = 0) => {
    console.log("Fetching events from:", `/api/endform/event-requests`);
    try {
      const token = localStorage.getItem("token");
      const requestConfig = {
        timeout: 30000, // 30 second timeout
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Cache-Control": "no-cache", // Prevent caching
          Pragma: "no-cache",
        },
      };

      const response = await axios.get(`/api/endform/event-requests`, requestConfig);

      const data = response.data;
      console.log("Raw pending endforms:", data);
      console.log("Number of events received:", data.length);
      console.log("Event statuses:", data.map(event => ({ id: event._id, status: event.status, eventName: event.basicEvent?.eventName })));
      
      if (Array.isArray(data)) {
        // Ensure each event has the required structure
        const formattedEvents = data.map(event => {
          const normalizedEndformId = normalizeMongoId(event?._id);
          const basic = event?.basicEvent || {};
          const normalizedBasicId = normalizeMongoId(basic?._id);

          return {
            ...event,
            _id: normalizedEndformId || event?._id,
            eventdata: normalizeMongoId(event?.eventdata) || event?.eventdata,
            basicEvent: {
              ...basic,
              _id: normalizedBasicId || basic?._id,
            },
          transport: Array.isArray(event.transport) ? event.transport : [event.transport].filter(Boolean),
          foodform: event.foodform || {},
          guestform: event.guestform || {},
          communicationdata: event.communicationdata || {}
          };
        });
        
        console.log("Formatted pending events:", formattedEvents);
        setPendingEvents(formattedEvents);
      } else {
        console.error("Fetched data is not an array:", data);
        setPendingEvents([]);
      }
    } catch (error) {
      console.error("Error fetching pending endforms:", error);
      
      // Retry logic for connection errors
      if ((error.code === 'ECONNRESET' || error.code === 'ECONNABORTED') && retryCount < 2) {
        console.log(`Retrying... Attempt ${retryCount + 1}/3`);
        setTimeout(() => {
          fetchPendingEndforms(retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. Please login again.");
      } else if (error.code === 'ECONNRESET') {
        console.error("Connection reset error - server might be overloaded");
        toast.error("Connection error. Please try again in a moment.");
      } else if (error.response) {
        console.error("Server error:", error.response.status, error.response.data);
        toast.error(`Server error: ${error.response.status}`);
      } else if (error.request) {
        console.error("Network error:", error.request);
        toast.error("Network error. Please check your connection.");
      } else {
        console.error("Unknown error:", error.message);
        toast.error("An unexpected error occurred.");
      }
      setPendingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEventUpdate = useCallback(async () => {
    await fetchPendingEndforms();
    setStatsRefreshKey((k) => k + 1);
  }, []);

  // Always fetch once when the page mounts
  useEffect(() => {
    fetchPendingEndforms();
  }, []);

  // Add useEffect to refetch data when navigating back to the dashboard route
  useEffect(() => {
    if (skipFirstPathRefetch.current) {
      skipFirstPathRefetch.current = false;
      return;
    }

    console.log("Location changed:", location.pathname);
    // Refetch when navigating back to pending route
    if (location.pathname === '/event-requests') {
      console.log("Navigated to dashboard, refetching events...");
      fetchPendingEndforms();
    }
  }, [location.pathname]);

  // Remove duplicate endforms for the same event (eventdata)
  const uniqueEventsMap = new Map();
  pendingEvents.forEach(event => {
    // Use eventdata (event ID) as the unique key
    const key = normalizeMongoId(event.eventdata) || normalizeMongoId(event.basicEvent?._id) || normalizeMongoId(event._id);
    // Always keep the latest (last in array)
    uniqueEventsMap.set(key, event);
  });
  const uniquePendingEvents = Array.from(uniqueEventsMap.values());

  const toStartOfDay = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const normalizeStatusKey = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return "";

    // Map common variants to our tab keys
    if (raw === "complete") return "completed";
    if (raw.includes("upcoming")) return "upcoming";
    if (raw.includes("ongoing") || raw.includes("on going")) return "ongoing";
    if (raw.includes("completed") || raw.includes("complete") || raw.includes("finished")) return "completed";
    return raw;
  };

  const getEventDates = (event) => {
    const start = toStartOfDay(event?.startDate || event?.basicEvent?.startDate);
    const end = toStartOfDay(event?.endDate || event?.basicEvent?.endDate);
    return { start, end };
  };

  const matchesActiveTab = (event) => {
    if (activeTab === "all") return true;

    // Mirrors Backend/Controller/Common.js `getPendingPageData` predicates.
    const { start, end } = getEventDates(event);
    if (start || end) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (activeTab === "upcoming") return !!start && start >= today;
      if (activeTab === "ongoing") return !!start && !!end && start <= today && end >= today;
      if (activeTab === "completed") return !!end && end < today;
    }

    // Fallback to any textual status if dates are missing/unparseable.
    const statusKey = normalizeStatusKey(
      event?.status ||
        event?.endformStatus ||
        event?.basicEvent?.status ||
        event?.basicEvent?.eventStatus ||
        ""
    );
    return statusKey === activeTab;
  };

  return (
    <div className="w-full">
      <div className="w-full bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/80 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/80">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 leading-tight">Event Requests</h2>
              <p className="mt-1 text-sm text-slate-500">Review and manage event requests</p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                onClick={() => {
                  localStorage.setItem('startNewFlow', 'true');
                  navigate('/forms/basic');
                }}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
              >
                Create New Event
              </button>

              <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 ring-1 ring-inset ring-slate-200/70">
                {[
                  { label: "All", value: "all" },
                  { label: "Upcoming", value: "upcoming" },
                  { label: "Ongoing", value: "ongoing" },
                  { label: "Completed", value: "completed" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 ${
                      activeTab === tab.value
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    onClick={() => setActiveTab(tab.value)}
                    aria-pressed={activeTab === tab.value}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <Dashboard refreshKey={statsRefreshKey} scopedEndforms={uniquePendingEvents} />

          {loading ? (
            <div className="py-10 text-sm text-slate-500">Loading pending events…</div>
          ) : uniquePendingEvents.length > 0 ? (
            (() => {
              const filteredEvents = uniquePendingEvents.filter((event) => {
                const id = normalizeMongoId(event?._id || event?.basicEvent?._id);
                const isValid = isValidObjectId(id);
                console.log(`Event ${event.eventName || 'Unknown'}: ID=${id}, Valid=${isValid}`);
                if (!isValid) return false;
                return matchesActiveTab(event);
              });
              console.log(`Total events: ${uniquePendingEvents.length}, Valid events: ${filteredEvents.length}`);

              if (filteredEvents.length === 0) {
                const label = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
                return (
                  <div className="py-10 text-sm text-slate-500">
                    No {label} events found.
                  </div>
                );
              }

              return (
                <EventsCard
                  Events={filteredEvents}
                  EventPopup={uniquePendingEvents}
                  onEventUpdate={handleEventUpdate}
                  viewerMode={isAcademicUser ? 'requester' : 'default'}
                />
              );
            })()
          ) : (
            <div className="py-10 text-sm text-slate-500">No pending events found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PendingDashboard;
