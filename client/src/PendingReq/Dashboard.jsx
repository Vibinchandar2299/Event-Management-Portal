import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";

const Dashboard = ({ refreshKey = 0, scopedEndforms = null }) => {
  const [pendingPageData, setPendingPageData] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    ongoingEvents: 0,
    totalParticipants: 0,
    quarter: "Q1 2024",
    quarterEvents: 0,
    quarterUpcoming: 0,
    quarterOngoing: 0,
    growthPercentage: "0.0",
    pendingEvents: 0,
    completedEventsCount: 0,
    rejectedEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const toDayDate = (value) => {
      const d = value ? new Date(value) : null;
      if (!d || Number.isNaN(d.getTime())) return null;
      d.setHours(0, 0, 0, 0);
      return d;
    };

    // If the parent provides scoped endforms (already filtered by role/department),
    // compute KPI counts from that same list so it always matches the events shown.
    if (Array.isArray(scopedEndforms)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalEvents = scopedEndforms.length;
      const upcomingEvents = scopedEndforms.filter((ef) => {
        const ev = ef?.basicEvent || ef;
        const start = toDayDate(ev?.startDate);
        return start && start >= today;
      }).length;
      const ongoingEvents = scopedEndforms.filter((ef) => {
        const ev = ef?.basicEvent || ef;
        const start = toDayDate(ev?.startDate);
        const end = toDayDate(ev?.endDate);
        return start && end && start <= today && end >= today;
      }).length;
      const pendingEvents = scopedEndforms.filter((ef) => String(ef?.status || "").trim() === "Pending").length;

      setPendingPageData((prev) => ({
        ...prev,
        totalEvents,
        upcomingEvents,
        ongoingEvents,
        pendingEvents,
      }));
      setError(null);
      setLoading(false);
      return;
    }

    const fetchPendingPageData = async () => {
      setLoading(true);
      try {
        console.log("Fetching pending page data...");

        const token = localStorage.getItem('token');
        const response = await axios.get('/api/common/pending-page-data', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        
        console.log("Pending page response:", response);

        if (response.status === 200) {
          const data = response.data || {};
          console.log("Pending page data:", data);
          setPendingPageData(data);
        } else {
          console.error("Failed to fetch pending page data. Status:", response.status);
          setError("Failed to fetch data.");
        }
      } catch (err) {
        console.error("Error fetching pending page data:", err);
        console.error("Error response:", err.response);
        console.error("Error message:", err.message);
        setError(`An error occurred while fetching data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingPageData();
  }, [refreshKey, scopedEndforms]);

  const stats = [
    {
      title: "Total Events",
      count: pendingPageData.totalEvents.toString(),
      icon: CalendarIcon,
      iconBg: "bg-emerald-600/10",
      iconText: "text-emerald-800",
      iconRing: "ring-1 ring-emerald-600/20",
    },
    {
      title: "Upcoming Events",
      count: pendingPageData.upcomingEvents.toString(),
      icon: ClockIcon,
      iconBg: "bg-emerald-600/10",
      iconText: "text-emerald-800",
      iconRing: "ring-1 ring-emerald-600/20",
    },
    {
      title: "Ongoing Events",
      count: pendingPageData.ongoingEvents.toString(),
      icon: CheckCircleIcon,
      iconBg: "bg-emerald-600/10",
      iconText: "text-emerald-800",
      iconRing: "ring-1 ring-emerald-600/20",
    },
    {
      title: "Pending Requests",
      count: (pendingPageData.pendingEvents ?? 0).toString(),
      icon: TicketIcon,
      iconBg: "bg-emerald-600/10",
      iconText: "text-emerald-800",
      iconRing: "ring-1 ring-emerald-600/20",
    },
  ];

  if (loading) {
    return <div className="text-sm text-slate-500">Loading overview…</div>;
  }

  if (error) {
    return <div className="text-sm text-rose-700">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Overview</h3>
          <p className="mt-1 text-sm text-slate-500">Quick stats for pending requests</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="rounded-2xl bg-slate-50/70 p-5 ring-1 ring-slate-200/80"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-slate-600">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {stat.count}
                </p>
              </div>
              <div
                className={`flex h-11 w-11 flex-none items-center justify-center rounded-2xl ${stat.iconBg} ${stat.iconRing}`}
              >
                <stat.icon className={`h-6 w-6 ${stat.iconText}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
