import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarDays,
  ListChecks,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const normalizeDeptKey = (raw) => {
  const d = String(raw || "").trim().toLowerCase();
  if (!d) return "";
  if (d === "iqac") return "iqac";
  if (d === "system admin" || d === "systemadmin" || d === "admin") return "iqac";
  if (d === "media" || d === "communication") return "communication";
  if (d === "guest deparment" || d === "guest department" || d === "guestroom" || d === "guest room") return "guestroom";

  // Academic department aliases
  const alnum = d.replace(/[^a-z0-9]/g, "");
  if (alnum === "aids" || alnum === "aiandds") return "ai & ds";
  if (alnum === "aiml" || alnum === "aiandml") return "ai & ml";
  if (alnum === "cybersecurity" || alnum === "cyber") return "cyber";
  if (alnum === "csbs") return "csbs";
  if (alnum === "cse" || alnum === "computerscienceengineering") return "cse";
  if (alnum === "it" || alnum === "informationtechnology") return "it";
  if (alnum === "ece" || alnum === "electronicsandcommunicationengineering") return "ece";
  if (alnum === "eee" || alnum === "electricalandelectronicsengineering") return "eee";
  if (alnum === "mech" || alnum === "mechanicalengineering") return "mech";
  if (alnum === "cce") return "cce";

  return d;
};

const deptLabel = (deptKey) => {
  if (deptKey === "communication") return "Media / Communication";
  if (deptKey === "guestroom") return "Guest Room";
  if (deptKey === "transport") return "Transport";
  if (deptKey === "food") return "Food";
  return deptKey ? deptKey.toUpperCase() : "Department";
};

const StatCard = ({ title, value, icon, tone = "slate" }) => {
  const tones = {
    slate: "border-slate-200 bg-white",
    amber: "border-amber-200 bg-amber-50/60",
    indigo: "border-indigo-200 bg-indigo-50/60",
    emerald: "border-emerald-200 bg-emerald-50/60",
    rose: "border-rose-200 bg-rose-50/60",
  };

  const Icon = icon;

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone] || tones.slate}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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

const DepartmentDashboard = () => {
  const userDeptKey = useMemo(
    () => normalizeDeptKey(localStorage.getItem("user_dept")),
    []
  );

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/common/dashboard-data", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setData(res.data);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          setError("Unauthorized. Please login again.");
          toast.error("Session expired. Please login again.");
        } else if (status === 403) {
          setError("Access denied.");
          toast.error("Access denied.");
        } else {
          setError("Failed to load dashboard");
          toast.error("Failed to load dashboard");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-sm font-medium text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  const totals = data?.totals || {};

  const role =
    data?.role ||
    (["transport", "food", "guestroom", "communication"].includes(userDeptKey)
      ? "approver"
      : "requester");

  const queue = Array.isArray(data?.myQueue) ? data.myQueue : [];
  const myRequests = Array.isArray(data?.myRequests) ? data.myRequests : [];
  const recent = Array.isArray(data?.recentActions) ? data.recentActions : [];
  const recentRequests = Array.isArray(data?.recentRequests) ? data.recentRequests : [];
  const statusSummary = data?.statusSummary && typeof data.statusSummary === "object" ? data.statusSummary : {};
  const activitySeries = Array.isArray(data?.activitySeries) ? data.activitySeries : [];

  const pendingCount = role === "approver" ? (totals.pendingApprovals ?? 0) : (totals.pendingRequests ?? 0);

  const CHART_COLORS = {
    upcoming: "#3b82f6", // blue
    ongoing: "#f59e0b", // amber
    completed: "#10b981", // emerald
    urgent: "#f43f5e", // rose
    soon: "#f97316", // orange
    later: "#06b6d4", // cyan
    far: "#64748b", // slate
    unknown: "#94a3b8", // slate-400
  };

  const eventStatusSeries = [
    { name: "Upcoming", value: totals.upcoming ?? 0 },
    { name: "Ongoing", value: totals.ongoing ?? 0 },
    { name: "Completed", value: totals.completed ?? 0 },
  ];

  const activityColor = role === "approver" ? CHART_COLORS.completed : CHART_COLORS.upcoming;

  const statusOrder = ["Pending", "Corrections", "Approved", "Rejected", "Completed", "Unknown"];
  const statusSummaryRows = Object.entries(statusSummary)
    .map(([name, value]) => ({ name, value: Number(value) || 0 }))
    .filter((row) => row.value > 0)
    .sort((a, b) => {
      const ai = statusOrder.indexOf(a.name);
      const bi = statusOrder.indexOf(b.name);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

  const statusPillClasses = (statusRaw) => {
    const status = String(statusRaw || "").trim();
    if (status === "Approved" || status === "Completed") return "bg-emerald-100 text-emerald-700";
    if (status === "Rejected") return "bg-rose-100 text-rose-700";
    if (status === "Corrections") return "bg-amber-100 text-amber-700";
    if (status === "Pending") return "bg-slate-100 text-slate-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="mb-12 rounded-[24px] bg-gradient-to-b from-slate-50 to-white p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Department view — {deptLabel(userDeptKey)}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
          <ListChecks className="h-4 w-4" />
          <span>{role === "approver" ? "My Queue" : "My Requests"}: {pendingCount}</span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={role === "approver" ? "Pending Approvals" : "Pending Requests"}
          value={pendingCount}
          icon={AlertTriangle}
          tone="rose"
        />
        <StatCard
          title="Due Soon (7 days)"
          value={totals.dueSoon ?? 0}
          icon={Clock}
          tone="amber"
        />
        <StatCard
          title="Upcoming Events"
          value={totals.upcoming ?? 0}
          icon={CalendarDays}
          tone="indigo"
        />
        <StatCard
          title="Total Events (Dept)"
          value={totals.totalRelevantEvents ?? 0}
          icon={CheckCircle2}
          tone="emerald"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">{role === "approver" ? "My Queue" : "My Requests"}</h2>
            <div className="text-xs text-slate-500">Nearest first</div>
          </div>

          {role === "approver" ? (
            queue.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No pending items for your department.
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((item) => (
                  <div
                    key={item.endformId}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {item.eventName || "(No title)"}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {item.startDate} → {item.endDate} • {item.venue || "Venue N/A"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.eventType ? `${item.eventType} • ` : ""}
                          {item.department || ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                          {typeof item.startInDays === "number" ? `${item.startInDays} days` : ""}
                        </div>
                        <div className="mt-2 text-xs text-slate-500">{item.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            myRequests.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No requests found for your department.
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((item) => (
                  <div
                    key={item.endformId}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {item.eventName || "(No title)"}
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          {item.startDate} → {item.endDate} • {item.venue || "Venue N/A"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.eventType ? `${item.eventType} • ` : ""}
                          {item.department || ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-block rounded px-2 py-1 text-[11px] font-semibold ${statusPillClasses(item.status)}`}>
                          {String(item.status || "").trim() || "—"}
                        </div>
                        <div className="mt-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                          {typeof item.startInDays === "number" ? `${item.startInDays} days` : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              {role === "approver" ? "Recent Actions" : "Status Summary"}
            </h2>
            <div className="text-xs text-slate-500">
              {role === "approver" ? "Approvals" : "All requests"}
            </div>
          </div>

          {role === "approver" ? (
            recent.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No recent approvals yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                {recent.map((item) => (
                  <div key={`${item.endformId}:${item.approvedAt}`} className="p-4">
                    <div className="text-sm font-semibold text-slate-900">{item.eventName}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Approved at: {new Date(item.approvedAt).toLocaleString("en-IN")}
                    </div>
                    {item.approvedBy ? (
                      <div className="mt-1 text-xs text-slate-500">By: {item.approvedBy}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )
          ) : (
            statusSummaryRows.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No request status data yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                {statusSummaryRows.map((row) => (
                  <div key={row.name} className="flex items-center justify-between gap-3 p-4">
                    <div className="text-sm font-semibold text-slate-900">{row.name}</div>
                    <div className={`rounded px-2 py-1 text-[11px] font-semibold ${statusPillClasses(row.name)}`}>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Event Status"
          subtitle="Upcoming vs ongoing vs completed"
        >
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventStatusSeries} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                  <Cell fill={CHART_COLORS.upcoming} />
                  <Cell fill={CHART_COLORS.ongoing} />
                  <Cell fill={CHART_COLORS.completed} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title={role === "approver" ? "Approval Activity" : "Request Activity"}
          subtitle={role === "approver" ? "Approvals completed in the last 7 days" : "Requests created in the last 7 days"}
        >
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activitySeries} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="deptActivityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activityColor} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={activityColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={activityColor}
                  strokeWidth={2}
                  fill="url(#deptActivityFill)"
                  fillOpacity={1}
                  dot={{ r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Recent Requests</h2>
            <p className="mt-1 text-xs text-slate-500">Latest requests relevant to your department</p>
          </div>
          <div className="text-xs text-slate-500">Latest first</div>
        </div>

        <div className="max-h-72 overflow-auto rounded-xl border border-slate-200">
          <table className="w-full table-auto text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-600">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-2 font-semibold">Requested On</th>
                <th className="px-4 py-2 font-semibold">Event</th>
                <th className="px-4 py-2 font-semibold">Start</th>
                <th className="px-4 py-2 font-semibold">Venue</th>
                <th className="px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {recentRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No recent requests.
                  </td>
                </tr>
              ) : (
                recentRequests.map((row) => {
                  const status = String(row.status || "").trim();
                  const statusClasses =
                    status === "Approved" || status === "Completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : status === "Rejected"
                        ? "bg-rose-100 text-rose-700"
                        : status === "Corrections"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700";

                  return (
                    <tr key={row.endformId} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-2 text-slate-600">{row.requestedOn || "—"}</td>
                      <td className="px-4 py-2 font-semibold text-slate-900">
                        {row.eventName || "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{row.startDate || "—"}</td>
                      <td className="px-4 py-2 text-slate-600">{row.venue || "—"}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block rounded px-2 py-1 text-[11px] font-semibold ${statusClasses}`}>
                          {status || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDashboard;
