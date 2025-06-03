import React from 'react';
import AdminLayout from './AdminLayout';

function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="dashboard-row">
        <div className="dashboard-card members-card">
          <h2>Members</h2>
          <p>Members chart and details will go here.</p>
        </div>
        <div className="dashboard-card calendar-card">
          <h2>April 2025</h2>
          <p>Calendar will go here.</p>
        </div>
      </div>
      <div className="dashboard-row">
        <div className="dashboard-card performance-card">
          <h2>Volunteer Group's Performance</h2>
          <p>Performance chart will go here.</p>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard; 