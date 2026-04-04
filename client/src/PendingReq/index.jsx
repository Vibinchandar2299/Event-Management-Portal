import { useState, useEffect, useCallback, useRef } from "react";
import Dashboard from "./Dashboard";
import EventsCard from "./EventsCard";
import axios from "axios";
import { useLocation } from "react-router-dom";
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
  
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const location = useLocation();
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
    console.log("Fetching events from:", `/api/endform/allpending`);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/endform/allpending`,
        {
          timeout: 30000, // 30 second timeout
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Cache-Control': 'no-cache', // Prevent caching
            'Pragma': 'no-cache'
          }
        }
      );

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
    if (location.pathname === '/pending') {
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

  // Ensure pendingEvents is an array before calling map
  const basicEvents = Array.isArray(pendingEvents)
    ? pendingEvents.map((event) => event.basicEvent)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Dashboard refreshKey={statsRefreshKey} />

        <div className="flex gap-6 mb-6 border-b border-gray-200">
          {["All", "Upcoming", "Ongoing", "Completed"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-3 font-medium ${
                activeTab === tab.toLowerCase()
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab(tab.toLowerCase())}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading pending events...</p>
        ) : uniquePendingEvents.length > 0 ? (
          (() => {
            const filteredEvents = uniquePendingEvents.filter(event => {
              const id = normalizeMongoId(event?._id || event?.basicEvent?._id);
              const isValid = isValidObjectId(id);
              console.log(`Event ${event.eventName || 'Unknown'}: ID=${id}, Valid=${isValid}`);
              return isValid;
            });
            console.log(`Total events: ${uniquePendingEvents.length}, Valid events: ${filteredEvents.length}`);

            const displayEvents = filteredEvents.length > 0 ? filteredEvents : uniquePendingEvents;
            return (
              <EventsCard 
                Events={displayEvents} 
                EventPopup={uniquePendingEvents} 
                onEventUpdate={handleEventUpdate}
                viewerMode={isAcademicUser ? 'requester' : 'default'}
              />
            );
          })()
        ) : (
          <p>No pending events found.</p>
        )}
      </div>
    </div>
  );
}

export default PendingDashboard;
