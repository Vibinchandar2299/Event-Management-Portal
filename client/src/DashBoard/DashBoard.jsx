import { useState, useEffect } from "react";
import axios from "axios";
import { FiMoreHorizontal } from "react-icons/fi";
import DonutChart from "./DonutChart";
import MonthlyChart from "./MonthlyChart";
import { toast } from "react-toastify";
import DepartmentDashboard from "./DepartmentDashboard";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  CheckCircle2,
  Sparkles,
  Building2,
} from "lucide-react";

const KpiCard = ({ title, value, icon, tone = "slate", subtitle }) => {
  const tones = {
    slate: "border-slate-200 bg-white",
    rose: "border-rose-200 bg-rose-50/60",
    amber: "border-amber-200 bg-amber-50/60",
    indigo: "border-indigo-200 bg-indigo-50/60",
    emerald: "border-emerald-200 bg-emerald-50/60",
    sky: "border-sky-200 bg-sky-50/60",
  };

  const Icon = icon;

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone] || tones.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {subtitle ? (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-xl bg-white/80 p-2 ring-1 ring-inset ring-slate-200">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const userDept = localStorage.getItem("user_dept");
  const deptKey = String(userDept || "").trim().toLowerCase();
  const isIqac =
    deptKey === "iqac" ||
    deptKey === "system admin" ||
    deptKey === "systemadmin" ||
    deptKey === "admin";

  const [currentEvents, setCurrentEvents] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    pendingCollaborations: 0,
    totalBookingsThisMonth: 0,
    eventsToday: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    ongoingEvents: 0,
    completedEvents: 0,
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
    if (!isIqac) {
      // Department users should not load the IQAC dashboard payloads.
      setLoading(false);
      setError(null);
      return;
    }

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
  }, [isIqac]);

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

  if (!isIqac) {
    return <DepartmentDashboard />;
  }

  if (loading) {
    return <div className="p-8 text-center text-sm font-medium text-slate-500">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">Error: {error}</div>;
  }

  return (
    <div className="mb-12 rounded-[24px] bg-gradient-to-b from-slate-50 to-white p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">IQAC Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">College-wide overview</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
          <Sparkles className="h-4 w-4" />
          <span>Pending Requests: {dashboardData.pendingCollaborations}</span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          title="Pending Requests"
          value={dashboardData.pendingCollaborations}
          icon={AlertTriangle}
          tone="rose"
          subtitle="Awaiting approvals"
        />
        <KpiCard
          title="Bookings This Month"
          value={dashboardData.totalBookingsThisMonth}
          icon={CalendarDays}
          tone="emerald"
          subtitle="New event requests"
        />
        <KpiCard
          title="Events Today"
          value={dashboardData.eventsToday}
          icon={Clock}
          tone="sky"
          subtitle="Happening now"
        />
        <KpiCard
          title="Upcoming"
          value={dashboardData.upcomingEvents ?? 0}
          icon={CalendarDays}
          tone="indigo"
          subtitle="Starts after today"
        />
        <KpiCard
          title="Ongoing"
          value={dashboardData.ongoingEvents ?? 0}
          icon={Building2}
          tone="amber"
          subtitle="Currently running"
        />
        <KpiCard
          title="Completed"
          value={dashboardData.completedEvents ?? 0}
          icon={CheckCircle2}
          tone="slate"
          subtitle="Already finished"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="dashboard-card rounded-2xl bg-white p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold text-slate-700">Today's Events</h2>
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
      />

      <div className="dashboard-card rounded-2xl bg-white">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-lg font-semibold text-slate-800">Recent Requests</h2>
          <button className="text-sm font-medium text-emerald-700">Show All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border border-emerald-900/10 text-sm">
            <thead>
              <tr className="border-b border-emerald-900/10 bg-emerald-50/50 text-left text-gray-500">
                <th className="px-6 py-4 font-semibold">No.</th>
                <th className="px-6 py-4 font-semibold">Dept</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Event Type</th>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recentBookings.length > 0 ? (
                dashboardData.recentBookings.map((booking, idx) => {
                  const status = booking.status || "Pending";
                  const statusClasses =
                    status === "Completed" || status === "Approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : status === "Rejected"
                        ? "bg-rose-100 text-rose-700"
                        : status === "Corrections"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700";

                  return (
                    <tr
                      key={booking.id}
                      className="border-b border-emerald-900/10 last:border-b-0 hover:bg-emerald-50/50 transition-colors"
                    >
                      <td className="px-6 py-3 font-medium text-gray-700">{idx + 1}</td>
                      <td className="px-6 py-3 text-gray-600">{booking.dept}</td>
                      <td className="px-6 py-3 text-gray-600">{booking.date}</td>
                      <td className="px-6 py-3 text-gray-600">{booking.eventType || "Other"}</td>
                      <td className="px-6 py-3 text-gray-800 font-semibold">{booking.title}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusClasses}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
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

export default Dashboard;



