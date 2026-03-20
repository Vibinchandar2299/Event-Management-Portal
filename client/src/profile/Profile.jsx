import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Star,
  MessageCircle,
  Plus,
  ArrowLeft,
  MoreHorizontal,
  Bookmark,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Folder,
  UserPlus,
} from "lucide-react";

function Profile() {
  const [activeTab, setActiveTab] = useState("all");
  const [profileData, setProfileData] = useState({
    organization: {
      name: "Tech Summit Organizers",
      role: "Event Management Team",
      description: "Global Tech Conference Network",
      bio: "Professional event organizers specializing in tech conferences and developer summits worldwide.",
      image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=400&q=80",
      isVerified: true
    },
    statistics: {
      totalEvents: 0,
      upcomingEvents: 0,
      completedEvents: 0,
      totalParticipants: 0
    },
    statusOverview: {
      pending: 0,
      rejected: 0,
      approved: 0
    },
    recentEvents: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Get user department from localStorage
  const userDept = localStorage.getItem('user_dept');
  const isAdminUser = userDept?.toLowerCase() === 'iqac' || userDept?.toLowerCase() === 'system admin';

  useEffect(() => {
    // Only fetch profile data if user is admin (IQAC or System Admin)
    if (!isAdminUser) {
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        console.log("Fetching profile page data...");
        
        const response = await axios.get('/api/common/profile-page-data');
        
        console.log("Profile page response:", response);

        if (response.status === 200) {
          const data = response.data || {};
          console.log("Profile page data:", data);
          setProfileData(data);
        } else {
          console.error("Failed to fetch profile page data. Status:", response.status);
          setError("Failed to fetch data.");
        }
      } catch (err) {
        console.error("Error fetching profile page data:", err);
        console.error("Error response:", err.response);
        console.error("Error message:", err.message);
        setError(`An error occurred while fetching data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isAdminUser]);

  const handleCreateEvent = () => {
    navigate('/forms');
  };

  const handleManageEvents = () => {
    navigate('/pending');
  };

  const handleCreateProfile = () => {
    navigate('/create-profile');
  };

  // If user is not admin, show create profile page
  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="mb-6">
              <UserPlus className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Create Your Profile
              </h1>
              <p className="text-gray-600">
                Set up your profile to get started with event management
              </p>
            </div>
            
            <button
              onClick={handleCreateProfile}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Create Profile
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              Only IQAC and System Admin users can view the full profile dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleCreateEvent}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Event</span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          <div className="mt-8 sm:mt-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
              <div className="relative">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                  <img
                    src={profileData.organization.image}
                    alt="Organization"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white"></div>
              </div>

              {/* Organization Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {profileData.organization.name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      {profileData.organization.role}
                    </span>
                    {profileData.organization.isVerified && (
                      <svg
                        className="w-6 h-6 text-blue-500"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 mt-1">
                  {profileData.organization.description}
                </p>
                <p className="mt-4 text-gray-800 text-lg">
                  {profileData.organization.bio}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mt-6 sm:mt-8">
                  <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-xl font-bold text-gray-900">{profileData.statistics.totalEvents}</div>
                    <div className="text-sm text-gray-600">Total Events</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-xl font-bold text-gray-900">{profileData.statistics.upcomingEvents}</div>
                    <div className="text-sm text-gray-600">Upcoming</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-xl font-bold text-gray-900">{profileData.statistics.completedEvents}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Overview */}
            <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Folder className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold">Event Status Overview</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{profileData.statusOverview.pending}</div>
                    <div className="text-sm text-gray-600">Pending Events</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{profileData.statusOverview.rejected}</div>
                    <div className="text-sm text-gray-600">Rejected</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{profileData.statusOverview.approved}</div>
                    <div className="text-sm text-gray-600">Approved</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Event Button */}
            <button 
              onClick={handleCreateEvent}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl py-4 mt-6 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              Create New Event
            </button>

            {/* Events Tabs */}
            <div className="mt-8">
              <div className="flex gap-2 border-b">
                {["all", "upcoming", "pending", "completed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? "text-purple-600 border-b-2 border-purple-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Events Grid */}
              <div className="mt-6">
                <div className="grid grid-cols-1 gap-4">
                  {profileData.recentEvents.length > 0 ? (
                    profileData.recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-24 rounded-lg overflow-hidden">
                            <img
                              src={event.image}
                              alt="Event"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">
                                {event.title}
                              </h3>
                            </div>
                            <p className="text-gray-600 mt-1">
                              {event.date} | {event.location}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>{event.attendees}+ Attendees</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span>{event.daysLeft}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="px-4 py-2 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200">
                            Edit
                          </button>
                          <button className="px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No events found. Create your first event!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t sm:hidden">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <button className="flex flex-col items-center gap-1 text-purple-600">
                <Folder className="w-6 h-6" />
                <span className="text-xs">My Events</span>
              </button>
              <button 
                onClick={handleCreateEvent}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                <span>Create</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-gray-600">
                <Bookmark className="w-6 h-6" />
                <span className="text-xs">Saved</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Floating Actions */}
        <div className="hidden sm:block fixed right-8 bottom-8">
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleCreateEvent}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span>New Event</span>
            </button>
            <button 
              onClick={handleManageEvents}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Calendar className="w-5 h-5" />
              <span>Manage Events</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
