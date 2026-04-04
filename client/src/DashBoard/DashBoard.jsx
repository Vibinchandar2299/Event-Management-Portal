import { useState, useEffect } from "react";
import axios from "axios";
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
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

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

const ChartCard = ({ title, subtitle, children }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {children}
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
    monthlyStatusTrend: [],
    servicePendingApprovals: {
      transport: 0,
      food: 0,
      guestroom: 0,
      communication: 0,
    },
    pendingQueue: [],
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

  const serviceApprovalsSeries = [
    { name: "Transport", value: dashboardData.servicePendingApprovals?.transport ?? 0 },
    { name: "Food", value: dashboardData.servicePendingApprovals?.food ?? 0 },
    { name: "Guest Room", value: dashboardData.servicePendingApprovals?.guestroom ?? 0 },
    { name: "Media/Comm", value: dashboardData.servicePendingApprovals?.communication ?? 0 },
  ];

  const topDepartments = Array.isArray(dashboardData.departmentBookings)
    ? dashboardData.departmentBookings.slice(0, 8).map((d) => ({
        name: d.name,
        value: Number(d.value || 0),
      }))
    : [];

  const trend = Array.isArray(dashboardData.monthlyStatusTrend)
    ? dashboardData.monthlyStatusTrend
    : [];

  const PIE_COLORS = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#f97316", // orange
    "#f43f5e", // rose
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#eab308", // yellow
    "#64748b", // slate
  ];

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
        <ChartCard
          title="Requests Trend (This Year)"
          subtitle="Monthly request volume split by status"
        >
          <div className="h-[300px] w-full">
            {trend.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600">
                No trend data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="iqacPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="iqacApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <Tooltip />
                  <Area type="monotone" dataKey="pending" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#iqacPending)" />
                  <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#iqacApproved)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Today's Schedule" subtitle="Events happening today">
          <div className="space-y-3">
            {currentEvents.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No events running today.
              </div>
            ) : (
              currentEvents.slice(0, 6).map((event) => (
                <div key={event.iqacNumber} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{event.eventName}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {event.eventVenue} • {event.startTime} – {event.endTime}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {Array.isArray(event.departments) ? event.departments.join(", ") : ""}
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      {event.startDate} → {event.endDate}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ChartCard>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Top Departments" subtitle="By number of events">
          <div className="h-[300px] w-full">
            {topDepartments.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600">
                No department data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topDepartments}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {topDepartments.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Pending Approvals (Service Teams)" subtitle="Items awaiting department action">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="25%"
                outerRadius="90%"
                barSize={14}
                data={serviceApprovalsSeries.map((d, idx) => ({
                  ...d,
                  fill: PIE_COLORS[idx % PIE_COLORS.length],
                }))}
              >
                <PolarAngleAxis type="number" domain={[0, "dataMax"]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={8} />
                <Legend
                  iconSize={10}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: 11 }}
                />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-700">Next Pending Requests</div>
            <div className="mt-3 space-y-2">
              {(Array.isArray(dashboardData.pendingQueue) ? dashboardData.pendingQueue : []).length === 0 ? (
                <div className="text-sm text-slate-600">No pending requests.</div>
              ) : (
                (dashboardData.pendingQueue || []).slice(0, 4).map((item) => (
                  <div key={item.endformId} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-900">{item.eventName}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {item.startDate} • {item.venue}
                      </div>
                    </div>
                    <div className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                      {typeof item.startInDays === "number" ? `${item.startInDays} days` : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ChartCard>
      </div>

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



