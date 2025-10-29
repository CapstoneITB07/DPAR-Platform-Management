import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/Login/LoginPage';
import CitizenPage from './components/CitizenPage/js/CitizenPage';
import AboutUs from './components/CitizenPage/js/AboutUs';
import Mitigation from './components/CitizenPage/js/Mitigation';
import Preparedness from './components/CitizenPage/js/Preparedness';
import Response from './components/CitizenPage/js/Response';
import Recovery from './components/CitizenPage/js/Recovery';
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
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Route for the Login Page - Protected from authenticated users */}
            <Route path="/" element={
              <ProtectedRoute requireGuest={true}>
                <LoginPage />
              </ProtectedRoute>
            } />

            {/* Route for the Citizen Page */}
            <Route path="/citizen" element={<CitizenPage />} />
            <Route path="/citizen/about" element={<AboutUs />} />
            <Route path="/citizen/mitigation" element={<Mitigation />} />
            <Route path="/citizen/preparedness" element={<Preparedness />} />
            <Route path="/citizen/response" element={<Response />} />
            <Route path="/citizen/recovery" element={<Recovery />} />

            {/* Admin routes - Protected */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="head_admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/associate-groups" element={
              <ProtectedRoute requiredRole="head_admin">
                <AssociateGroups />
              </ProtectedRoute>
            } />
            <Route path="/admin/notifications" element={
              <ProtectedRoute requiredRole="head_admin">
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/admin/approval-aor" element={
              <ProtectedRoute requiredRole="head_admin">
                <ApprovalAOR />
              </ProtectedRoute>
            } />
            <Route path="/admin/announcement" element={
              <ProtectedRoute requiredRole="head_admin">
                <Announcement />
              </ProtectedRoute>
            } />
            <Route path="/admin/training-program" element={
              <ProtectedRoute requiredRole="head_admin">
                <TrainingProgram />
              </ProtectedRoute>
            } />
            <Route path="/admin/evaluation" element={
              <ProtectedRoute requiredRole="head_admin">
                <Evaluation />
              </ProtectedRoute>
            } />

            {/* Associate routes - Protected */}
            <Route path="/associate" element={<Navigate to="/associate/announcements" replace />} />
            <Route path="/associate/dashboard" element={<Navigate to="/associate/announcements" replace />} />
            <Route path="/associate/announcements" element={
              <ProtectedRoute requiredRole="associate_group_leader">
                <Announcements />
              </ProtectedRoute>
            } />
            <Route path="/associate/volunteer-list" element={
              <ProtectedRoute requiredRole="associate_group_leader">
                <VolunteerList />
              </ProtectedRoute>
            } />
            <Route path="/associate/notification" element={
              <ProtectedRoute requiredRole="associate_group_leader">
                <Notification />
              </ProtectedRoute>
            } />
            <Route path="/associate/reports" element={
              <ProtectedRoute requiredRole="associate_group_leader">
                <Reports />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
