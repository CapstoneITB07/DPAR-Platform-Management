import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/Login/LoginPage';
import CitizenPage from './components/CitizenPage/CitizenPage';
import AboutUs from './components/CitizenPage/AboutUs';
import AdminDashboard from './components/AdminDashboard/js/AdminDashboard';
import AssociateGroups from './components/AdminDashboard/js/AssociateGroups';
import Notifications from './components/AdminDashboard/js/Notifications';
import ApprovalAOR from './components/AdminDashboard/js/ApprovalAOR';
import Announcement from './components/AdminDashboard/js/Announcement';
import TrainingProgram from './components/AdminDashboard/js/TrainingProgram';
import Evaluation from './components/AdminDashboard/js/Evaluation';
import Announcements from './components/AssociateDashboard/js/Announcements';
import VolunteerList from './components/AssociateDashboard/js/VolunteerList';
import Notification from './components/AssociateDashboard/js/Notification';
import Reports from './components/AssociateDashboard/js/Reports';

import './App.css'; // Assuming you have an App.css for general styling

function App() {
  return (
    <Router>
    <div className="App">
        <Routes>
          {/* Route for the Login Page */}
          <Route path="/" element={<LoginPage />} />

          {/* Route for the Citizen Page */}
          <Route path="/citizen" element={<CitizenPage />} />
          <Route path="/citizen/about" element={<AboutUs />} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/associate-groups" element={<AssociateGroups />} />
          <Route path="/admin/notifications" element={<Notifications />} />
          <Route path="/admin/approval-aor" element={<ApprovalAOR />} />
          <Route path="/admin/announcement" element={<Announcement />} />
          <Route path="/admin/training-program" element={<TrainingProgram />} />
          <Route path="/admin/evaluation" element={<Evaluation />} />

          {/* Associate routes */}
          <Route path="/associate" element={<Navigate to="/associate/announcements" replace />} />
          <Route path="/associate/dashboard" element={<Navigate to="/associate/announcements" replace />} />
          <Route path="/associate/announcements" element={<Announcements />} />
          <Route path="/associate/volunteer-list" element={<VolunteerList />} />
          <Route path="/associate/notification" element={<Notification />} />
          <Route path="/associate/reports" element={<Reports />} />
        </Routes>
    </div>
    </Router>
  );
}

export default App;
