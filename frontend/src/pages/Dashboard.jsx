// frontend/src/pages/dashboard.jsx
import React from 'react';
import useAuth from '../hooks/useAuth';
import AdminPanel from '../components/AdminPanel';
import CompanyPanel from '../components/CompanyPanel';
import StudentPanel from '../components/StudentPanel';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to Dashboard</h1>
        {user.role === 'admin' && <AdminPanel />}
        {user.role === 'company' && <CompanyPanel />}
        {user.role === 'student' && <StudentPanel />}
      </div>
    </div>
  );
};

export default Dashboard;