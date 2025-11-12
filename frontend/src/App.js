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
import AdminAssociateGroups from './components/AdminDashboard/js/AssociateGroups';
import Notifications from './components/AdminDashboard/js/Notifications';
import ApprovalAOR from './components/AdminDashboard/js/ApprovalAOR';
import Announcement from './components/AdminDashboard/js/Announcement';
import TrainingProgram from './components/AdminDashboard/js/TrainingProgram';
import Evaluation from './components/AdminDashboard/js/Evaluation';
import Announcements from './components/AssociateDashboard/js/Announcements';
import VolunteerList from './components/AssociateDashboard/js/VolunteerList';
import Notification from './components/AssociateDashboard/js/Notification';
import Reports from './components/AssociateDashboard/js/Reports';
import SuperAdminLoginPage from './components/SuperAdmin/LoginSystemAdmin/SuperAdminLoginPage';
import SuperAdminDashboard from './components/SuperAdmin/js/SuperAdminDashboard';
import HeadAdmins from './components/SuperAdmin/js/HeadAdmins';
import AllUsers from './components/SuperAdmin/js/AllUsers';
import SuperAdminAssociateGroups from './components/SuperAdmin/js/AssociateGroups';
import Applications from './components/SuperAdmin/js/Applications';
import SystemLogs from './components/SuperAdmin/js/SystemLogs';
import Database from './components/SuperAdmin/js/Database';
import SystemHealth from './components/SuperAdmin/js/SystemHealth';
import Settings from './components/SuperAdmin/js/Settings';
import NotificationsManagement from './components/SuperAdmin/js/Notifications';
import AnnouncementsManagement from './components/SuperAdmin/js/Announcements';
import TrainingProgramsManagement from './components/SuperAdmin/js/TrainingPrograms';
import CitizenMonitoring from './components/SuperAdmin/js/CitizenMonitoring';
import SystemAlerts from './components/SuperAdmin/js/SystemAlerts';
import MaintenancePage from './components/SuperAdmin/js/MaintenancePage';
import SystemAlertBanner from './components/SuperAdmin/js/SystemAlertBanner';

import './App.css'; // Assuming you have an App.css for general styling

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <SystemAlertBanner />
          <Routes>
            {/* Route for the Login Page - Protected from authenticated users */}
            <Route path="/" element={
              <ProtectedRoute requireGuest={true}>
                <LoginPage />
              </ProtectedRoute>
            } />

            {/* Super Admin Login - Separate login page */}
            <Route path="/superadmin/login" element={
              <ProtectedRoute requireGuest={true}>
                <SuperAdminLoginPage />
              </ProtectedRoute>
            } />

            {/* Maintenance Page */}
            <Route path="/maintenance" element={<MaintenancePage />} />

            {/* Route for the Citizen Page */}
            <Route path="/citizen" element={<CitizenPage />} />
            <Route path="/citizen/about" element={<AboutUs />} />
            <Route path="/citizen/mitigation" element={<Mitigation />} />
            <Route path="/citizen/preparedness" element={<Preparedness />} />
            <Route path="/citizen/response" element={<Response />} />
            <Route path="/citizen/recovery" element={<Recovery />} />

            {/* Super Admin routes - Protected */}
            <Route path="/superadmin/dashboard" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/head-admins" element={
              <ProtectedRoute requiredRole="superadmin">
                <HeadAdmins />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/users" element={
              <ProtectedRoute requiredRole="superadmin">
                <AllUsers />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/associate-groups" element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminAssociateGroups />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/pending-applications" element={
              <ProtectedRoute requiredRole="superadmin">
                <Applications />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/system-logs" element={
              <ProtectedRoute requiredRole="superadmin">
                <SystemLogs />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/database" element={
              <ProtectedRoute requiredRole="superadmin">
                <Database />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/system-health" element={
              <ProtectedRoute requiredRole="superadmin">
                <SystemHealth />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/settings" element={
              <ProtectedRoute requiredRole="superadmin">
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/notifications" element={
              <ProtectedRoute requiredRole="superadmin">
                <NotificationsManagement />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/announcements" element={
              <ProtectedRoute requiredRole="superadmin">
                <AnnouncementsManagement />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/training-programs" element={
              <ProtectedRoute requiredRole="superadmin">
                <TrainingProgramsManagement />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/citizen-monitoring" element={
              <ProtectedRoute requiredRole="superadmin">
                <CitizenMonitoring />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/system-alerts" element={
              <ProtectedRoute requiredRole="superadmin">
                <SystemAlerts />
              </ProtectedRoute>
            } />

            {/* Admin routes - Protected */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="head_admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/associate-groups" element={
              <ProtectedRoute requiredRole="head_admin">
                <AdminAssociateGroups />
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
