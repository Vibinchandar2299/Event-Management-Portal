import { useState, useEffect } from "react";
import calender from "../assets/calendar (5).png";
import onlytoday from "../assets/only-today.png";
import department from "../assets/department (1).png";
import axios from "axios";
import { FiMoreHorizontal } from "react-icons/fi";
import DonutChart from "./DonutChart";
import MonthlyChart from "./MonthlyChart";
import { toast } from "react-toastify";
import DepartmentDashboard from "./DepartmentDashboard";

const Dashboard = () => {
  const [currentEvents, setCurrentEvents] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    pendingCollaborations: 0,
    totalBookingsThisMonth: 0,
    eventsToday: 0,
    mostEventBookingDepartment: "N/A",
    userSatisfactionRating: "3.5",
    departmentBookings: [],
    eventTypes: [],
    monthlyData: [],
    recentBookings: [],
    eventSatisfaction: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        console.log("Fetching comprehensive dashboard data...");

        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        
        // Fetch comprehensive dashboard data
        const dashboardResponse = await axios.get(
          `/api/common/comprehensive-dashboard-data`,
          { headers }
        );
        
        console.log("Dashboard response:", dashboardResponse);
        
        // Fetch current events separately (keeping existing functionality)
        const eventsResponse = await axios.get(
          `/api/common/current-date-events`,
          { headers }
        );
        
        console.log("Events response:", eventsResponse);

        if (dashboardResponse.status === 200 && eventsResponse.status === 200) {
          const comprehensiveData = dashboardResponse.data || {};
          const eventsData = eventsResponse.data || [];
          
          console.log("Comprehensive dashboard data:", comprehensiveData);
          console.log("Current events:", eventsData);
          
          setDashboardData(comprehensiveData);
          setCurrentEvents(eventsData);
        } else {
          console.error("Failed to fetch data. Dashboard status:", dashboardResponse.status, "Events status:", eventsResponse.status);
          setError("Failed to fetch data.");
          toast.error("Failed to fetch dashboard data.");
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        console.error("Error response:", err.response);
        console.error("Error message:", err.message);
        setError(`An error occurred while fetching data: ${err.message}`);
        toast.error(`Error fetching dashboard data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatusBadge = ({ status }) => {
    const colors = {
      Pending: "bg-blue-100 text-blue-600",
      Rejected: "bg-red-100 text-red-600",
      Corrections: "bg-yellow-100 text-yellow-600",
      Accepted: "bg-green-100 text-green-600",
      Completed: "bg-green-100 text-green-600",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded text-xs ${colors[status] || colors.Pending}`}
      >
        {status}
      </span>
    );
  };

  // Render events in table
  const renderEventsTable = () => {
    return currentEvents.map((event) => (
      <tr key={event.iqacNumber} className="border-b last:border-b-0">
        <td className="px-6 py-4">{event.iqacNumber}</td>
        <td className="px-6 py-4">{event.departments.join(", ")}</td>
        <td className="px-6 py-4">
          {event.startDate} to {event.endDate}
        </td>
        <td className="px-6 py-4">{event.eventName}</td>
        <td className="px-6 py-4">
          <StatusBadge status={event.status} />
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <span>→</span>
            {event.categories.join(", ")}
          </div>
        </td>
        <td className="px-6 py-4">
          <button className="text-gray-400 hover:text-gray-600">
            <FiMoreHorizontal />
          </button>
        </td>
      </tr>
    ));
  };

  if (loading) {
    return <div className="p-8 text-center text-sm font-medium text-slate-500">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Error: {error}</div>;
  }

  const userDept = localStorage.getItem("user_dept");

  const deptKey = String(userDept || "").trim().toLowerCase();
  const isIqac =
    deptKey === "iqac" ||
    deptKey === "system admin" ||
    deptKey === "systemadmin" ||
    deptKey === "admin";

  if (!isIqac) {
    return <DepartmentDashboard />;
  }

  return (
    <div className="mb-12 rounded-[24px] bg-gradient-to-b from-emerald-50/70 to-white p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">Dashboard</h1>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 md:text-sm">
          Pending Collaborations: {dashboardData.pendingCollaborations}
        </span>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Total Bookings in This Month */}
        <div className="dashboard-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white">
          <div className="relative z-10">
            <h3 className="text-4xl font-bold mb-1">
              {dashboardData.totalBookingsThisMonth}
            </h3>
            <p className="text-sm opacity-90">Total bookings in this month</p>
          </div>
          <div className="absolute right-4 bottom-4">
            <img src={calender} className="h-16 w-16 opacity-80" alt="Calendar" />
          </div>
        </div>

        {/* Number of Events Today */}
        <div className="dashboard-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-600 p-6 text-white">
          <div className="relative z-10">
            <h3 className="text-4xl font-bold mb-1">
              {dashboardData.eventsToday}
            </h3>
            <p className="text-sm opacity-90">No. of events today</p>
          </div>
          <div className="absolute right-4 bottom-4">
            <img src={onlytoday} className="h-16 w-16 opacity-80" alt="Today" />
          </div>
        </div>

        {/* Most Event Booking Department */}
        <div className="dashboard-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-6 text-white">
          <div className="relative z-10">
            <h3 className="text-4xl font-bold mb-1">
              {dashboardData.mostEventBookingDepartment}
            </h3>
            <p className="text-sm opacity-90">
              Most event booking department
            </p>
          </div>
          <div className="absolute right-4 bottom-4">
            <img src={department} className="h-16 w-16 opacity-80" alt="Department" />
          </div>
        </div>

        {/* User Satisfaction Rating */}
        <div className="dashboard-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-6 text-white">
          <div className="relative z-10">
            <h3 className="text-4xl font-bold mb-1">{dashboardData.userSatisfactionRating}</h3>
            <p className="text-sm opacity-90">User satisfaction rating</p>
          </div>
          <div className="absolute right-4 bottom-4">
            <img src={onlytoday} className="h-16 w-16 opacity-80" alt="Satisfaction" />
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="dashboard-card rounded-2xl bg-white p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold text-slate-700">Happenings</h2>
            <button className="text-xs font-medium text-emerald-700">Show All</button>
          </div>
          <div className="rounded-xl border border-emerald-900/10 bg-white/60">
            <div className="custom-scrollbar h-72 overflow-x-auto text-sm">
              <div className="custom-scrollbar">
                <table className="w-full table-auto text-xs custom-scrollbar">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="px-6 py-4">Venue</th>
                      <th className="px-6 py-4">Event Name</th>
                      <th className="px-6 py-4">End Date</th>
                      <th className="px-6 py-4">End Time</th>
                      <th className="px-6 py-4">Organizer</th>
                      <th className="px-6 py-4">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEvents.length > 0 ? (
                      currentEvents.map((event) => (
                        <tr
                          key={event.iqacNumber}
                          className="border-b last:border-b-0"
                        >
                          <td className="px-6 text-wrap py-4">
                            {event.eventVenue}
                          </td>
                          <td className="px-6 py-4">{event.eventName}</td>
                          <td className="px-6 py-4">{event.endDate}</td>
                          <td className="px-6 py-4">{event.endTime}</td>
                          <td className="px-6 py-4">
                            {event.organizers.map((organizer, index) => (
                              <div key={index}>
                                <p>{organizer.name}</p>
                              </div>
                            ))}
                          </td>
                          <td className="px-6 py-4">
                            {event.organizers.map((organizer, index) => (
                              <div key={index}>{organizer.phone}</div>
                            ))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          No results.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <MonthlyChart monthlyData={dashboardData.monthlyData} />
      </div>

      <DonutChart 
        departmentBookings={dashboardData.departmentBookings}
        eventTypes={dashboardData.eventTypes}
        eventSatisfaction={dashboardData.eventSatisfaction}
      />

      <div className="dashboard-card rounded-2xl bg-white">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-lg font-semibold text-slate-800">Recent Bookings</h2>
          <button className="text-sm font-medium text-emerald-700">Show All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-emerald-900/10 text-sm">
            <thead>
              <tr className="border-b border-emerald-900/10 bg-emerald-50/50 text-left text-gray-500">
                <th className="px-6 py-4 font-semibold">No.</th>
                <th className="px-6 py-4 font-semibold">Dept</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recentBookings.length > 0 ? (
                dashboardData.recentBookings.map((booking, idx) => (
                  <FormComponent
                    key={booking.id}
                    form={booking}
                    canEdit={booking.dept === userDept}
                    index={idx + 1}
                    bordered
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No recent bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function FormComponent({ form, canEdit, index, bordered }) {
  const cellBorder = bordered ? "border border-emerald-900/10" : "";
  return (
    <tr className={`border-b border-emerald-900/10 last:border-b-0 hover:bg-emerald-50/50 transition-colors ${bordered ? 'border border-emerald-900/10' : ''}`}> 
      <td className={`px-6 py-3 font-medium text-gray-700 ${cellBorder}`}>{index}</td>
      <td className={`px-6 py-3 text-gray-600 ${cellBorder}`}>{form.dept}</td>
      <td className={`px-6 py-3 text-gray-600 ${cellBorder}`}>{form.date}</td>
      <td className={`px-6 py-3 text-gray-800 font-semibold ${cellBorder}`}>{form.title}</td>
      <td className={`px-6 py-3 ${cellBorder}`}>
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${form.status === 'Completed' ? 'bg-green-100 text-green-700' : form.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{form.status}</span>
      </td>
      <td className={`px-6 py-3 ${cellBorder}`}>
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${form.priority === 'High' ? 'bg-red-100 text-red-700' : form.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{form.priority}</span>
      </td>
      <td className={`px-6 py-3 ${cellBorder}`}>
        {canEdit ? (
          <button className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-emerald-700">Edit</button>
        ) : (
          <span className="text-gray-400 text-xs">View Only</span>
        )}
      </td>
    </tr>
  );
}

export default Dashboard;



