// frontend/src/components/StudentPanel.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const StudentPanel = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available jobs
        const jobsResponse = await api.get('/jobs');
        setJobs(jobsResponse.data);

        // Fetch student's applications
        const applicationsResponse = await api.get('/applications/student');
        setApplications(applicationsResponse.data);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApply = async (jobId) => {
    try {
      await api.post(`/applications/apply/${jobId}`);
      alert('Application submitted successfully!');
      
      // Refresh applications
      const response = await api.get('/applications/student');
      setApplications(response.data);
    } catch (err) {
      alert('Failed to submit application');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">My Profile</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Edit Profile
        </button>
      </div>

      {/* Available Jobs Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Available Jobs</h2>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job._id} className="border p-4 rounded">
              <h3 className="font-semibold">{job.title}</h3>
              <p className="text-gray-600">{job.company?.name}</p>
              <p className="text-sm">{job.description}</p>
              <div className="mt-2">
                <button
                  onClick={() => handleApply(job._id)}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  disabled={applications.some(app => app.job._id === job._id)}
                >
                  {applications.some(app => app.job._id === job._id) ? 'Applied' : 'Apply'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Applications Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">My Applications</h2>
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application._id} className="border p-4 rounded">
              <h3 className="font-semibold">{application.job?.title}</h3>
              <p className="text-gray-600">{application.company?.name}</p>
              <p className="text-sm">Status: <span className="font-semibold">{application.status}</span></p>
              <p className="text-sm">Applied on: {new Date(application.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentPanel;