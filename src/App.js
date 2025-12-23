import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import EventCodeEntry from './pages/EventCodeEntry';
import EventDashboard from './pages/EventDashboard';
import RoleSelection from './pages/RoleSelection';
import OfferCarpool from './pages/OfferCarpool';
import NeedCarpool from './pages/NeedCarpool';
import DriverDashboard from './pages/DriverDashboard';
import PassengerDashboard from './pages/PassengerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import CreateEvent from './pages/CreateEvent';
import Login from './pages/Login';
import MyAccount from './pages/MyAccount';
import MyRides from './pages/MyRides';
import EventAdminDashboard from './pages/EventAdminDashboard';
import InfoPage from './pages/InfoPage';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<EventCodeEntry />} />
            <Route path="/info" element={<InfoPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/my-account" element={<MyAccount />} />
            <Route path="/my-rides" element={<MyRides />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/event/:eventCode" element={<EventDashboard />} />
            <Route path="/event/:eventCode/admin" element={<EventAdminDashboard />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/offer-carpool" element={<OfferCarpool />} />
            <Route path="/need-carpool" element={<NeedCarpool />} />
            <Route path="/driver-dashboard" element={<DriverDashboard />} />
            <Route path="/passenger-dashboard" element={<PassengerDashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/create-event" element={<CreateEvent />} />
            <Route path="/admin/dashboard/:eventId" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
