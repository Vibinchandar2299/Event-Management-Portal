import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import EventsCard from "./EventsCard";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

function isValidObjectId(id) {
  return typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id);
}

function PendingDashboard() {
  console.log("=== PendingDashboard Component Loading ===");
  
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const fetchPendingEndforms = async (retryCount = 0) => {
    console.log("Fetching events from:", `/api/endform/allpending`);
    try {
      const response = await axios.get(
        `/api/endform/allpending`,
        {
          timeout: 30000, // 30 second timeout
          headers: {
            'Content-Type': 'application/json',
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
        const formattedEvents = data.map(event => ({
          ...event,
          basicEvent: event.basicEvent || {},
          transport: Array.isArray(event.transport) ? event.transport : [event.transport].filter(Boolean),
          foodform: event.foodform || {},
          guestform: event.guestform || {},
          communicationdata: event.communicationdata || {}
        }));
        
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
      
      if (error.code === 'ECONNRESET') {
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

  useEffect(() => {
    fetchPendingEndforms();
  }, []);

  // Add useEffect to refetch data when navigating back to the dashboard route
  useEffect(() => {
    console.log("Location changed:", location.pathname);
    // Assuming the dashboard route is '/', adjust if it's different
    if (location.pathname === '/pending-requests') { // Replace '/pending-requests' with the actual dashboard path if different
      console.log("Navigated to dashboard, refetching events...");
      fetchPendingEndforms();
    }
  }, [location.pathname]);

  // Remove duplicate endforms for the same event (eventdata)
  const uniqueEventsMap = new Map();
  pendingEvents.forEach(event => {
    // Use eventdata (event ID) as the unique key
    const key = event.eventdata || event.basicEvent?._id;
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
        <Dashboard />
        
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
              const id = event._id || event.basicEvent?._id;
              const isValid = isValidObjectId(id);
              console.log(`Event ${event.eventName || 'Unknown'}: ID=${id}, Valid=${isValid}`);
              return isValid;
            });
            console.log(`Total events: ${uniquePendingEvents.length}, Valid events: ${filteredEvents.length}`);
            return (
              <EventsCard 
                Events={filteredEvents} 
                EventPopup={uniquePendingEvents} 
                onEventUpdate={fetchPendingEndforms}
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
