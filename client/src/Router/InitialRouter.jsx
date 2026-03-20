import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../DashBoard/DashBoard";
import Form from "../Components/Form";
import CalenderUI from "../calender/CalenderUI";
import Signup from "../Components/Login";
import Profile from "../profile/Profile";
import PendingDashboard from "../PendingReq";
import BasicEventForm from "../BasicEvent/OrginalForm";
import CommunicationForm from "../CommunicationForm";
import TransportForm from "../TransportForm/TransportForm";
import GuestRoom from "../guestroom/index";
import EndForm from "../EndForm";
import FoodForm from "../FoodForm/FoodForm";
import CreateLogins from "../Admin/CreateLogins";
import CreateProfile from "../Components/CreateProfile";
import AdminController from "../Admin/Index";
import TermsandCondition from "../Components/Terms&Conditons";
import ProtectedRoute from "../Components/ProtectedRoute";

const InitialRouter = () => {
  return (
    <div className="h-full">
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forms" element={<Form />}>
          <Route index element={<TermsandCondition />} />
          <Route path="basic" element={<BasicEventForm />} />
          <Route path="communication" element={<CommunicationForm />} />
          <Route path="transport" element={<TransportForm />} />
          <Route path="food" element={<FoodForm />} />
          <Route path="guest-room" element={<GuestRoom />} />
          <Route path="end" element={<EndForm />} />
        </Route>
        <Route path="/calender" element={<CalenderUI />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/pending" element={<PendingDashboard />} />
        <Route 
          path="/create-login" 
          element={
            <ProtectedRoute requiredDepartment="iqac">
              <AdminController />
            </ProtectedRoute>
          } 
        />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default InitialRouter;

