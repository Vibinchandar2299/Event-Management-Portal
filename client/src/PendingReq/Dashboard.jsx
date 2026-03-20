import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  UsersIcon,
  TicketIcon,
  CalendarIcon,
  ChartBarIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const navigate = useNavigate();
  
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
    const fetchPendingPageData = async () => {
      setLoading(true);
      try {
        console.log("Fetching pending page data...");
        
        const response = await axios.get('/api/common/pending-page-data');
        
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
  }, []);

  const stats = [
    {
      title: "Total Events",
      count: pendingPageData.totalEvents.toString(),
      icon: CalendarIcon,
      color: "bg-purple-100",
      textColor: "text-purple-600",
    },
    {
      title: "Upcoming Events",
      count: pendingPageData.upcomingEvents.toString(),
      icon: ClockIcon,
      color: "bg-blue-100",
      textColor: "text-blue-600",
    },
    {
      title: "Ongoing Events",
      count: pendingPageData.ongoingEvents.toString(),
      icon: CheckCircleIcon,
      color: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      title: "Participants",
      count: pendingPageData.totalParticipants >= 1000 
        ? `${(pendingPageData.totalParticipants / 1000).toFixed(1)}K`
        : pendingPageData.totalParticipants.toString(),
      icon: UsersIcon,
      color: "bg-orange-100",
      textColor: "text-orange-600",
    },
  ];

  if (loading) {
    return <div className="m bg-gray-50 p-8">Loading...</div>;
  }

  if (error) {
    return <div className="m bg-gray-50 p-8">Error: {error}</div>;
  }

  return (
    <div className="m bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Event Management Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and track all your events in one place
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
              <span className="text-gray-700">{pendingPageData.quarter}</span>
              <ChevronLeftIcon className="h-4 w-4 text-gray-600 cursor-pointer" />
              <ChevronRightIcon className="h-4 w-4 text-gray-600 cursor-pointer" />
            </div>
            <button 
              onClick={() => navigate('/forms')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create New Event</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.count}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-500 flex items-center">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  +{pendingPageData.growthPercentage}%
                </span>
                <span className="text-gray-500 ml-2">vs previous quarter</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  function PlusIcon(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    );
  }

  function ArrowUpIcon(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75"
        />
      </svg>
    );
  }
};

export default Dashboard;
