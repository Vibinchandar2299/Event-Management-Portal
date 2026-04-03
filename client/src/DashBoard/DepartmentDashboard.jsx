import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarDays,
  ListChecks,
} from "lucide-react";

const normalizeDeptKey = (raw) => {
  const d = String(raw || "").trim().toLowerCase();
  if (!d) return "";
  if (d === "iqac") return "iqac";
  if (d === "system admin" || d === "systemadmin" || d === "admin") return "iqac";
  if (d === "media" || d === "communication") return "communication";
  if (d === "guest deparment" || d === "guest department" || d === "guestroom" || d === "guest room") return "guestroom";
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
        const res = await axios.get("/api/common/department-dashboard-data", {
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
  const kpis = data?.kpis || {};

  const queue = Array.isArray(data?.myQueue) ? data.myQueue : [];
  const recent = Array.isArray(data?.recentActions) ? data.recentActions : [];

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
          <span>My Queue: {totals.pendingApprovals ?? 0}</span>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending Approvals"
          value={totals.pendingApprovals ?? 0}
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
          title="Total Relevant"
          value={totals.totalRelevantEvents ?? 0}
          icon={CheckCircle2}
          tone="emerald"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">My Queue</h2>
            <div className="text-xs text-slate-500">Nearest first</div>
          </div>

          {queue.length === 0 ? (
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
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Recent Actions</h2>
            <div className="text-xs text-slate-500">Approvals</div>
          </div>

          {recent.length === 0 ? (
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
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Request Summary</h2>
        <p className="mt-1 text-xs text-slate-500">Based on linked requisition forms</p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Transport Requests" value={kpis.transportRequests ?? 0} tone="slate" />
          <StatCard title="Food Requests" value={kpis.foodRequests ?? 0} tone="slate" />
          <StatCard title="Guest Bookings" value={kpis.guestBookings ?? 0} tone="slate" />
          <StatCard title="Media Requests" value={kpis.communicationRequests ?? 0} tone="slate" />
        </div>
      </div>
    </div>
  );
};

export default DepartmentDashboard;
