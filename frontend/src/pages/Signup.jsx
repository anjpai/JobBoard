// frontend/src/pages/Signup.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Signup = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Log the form data being sent
      console.log('Sending signup data:', form);
      
      // Make the API call
      const response = await api.post('/auth/register', form);
      console.log('Signup response:', response.data);
      
      // If successful, show success message and navigate
      alert('Signup successful! Please login.');
      navigate('/login');
    } catch (err) {
      // Log the full error
      console.error('Full error:', err);
      
      // Log the error response if it exists
      if (err.response) {
        console.error('Error response:', {
          status: err.response.status,
          data: err.response.data
        });
      }
      
      // Set a more detailed error message
      const errorMessage = err.response?.data?.errors?.[0]?.msg 
        || err.response?.data?.message 
        || err.message 
        || 'Signup failed';
      
      setError(errorMessage);
      alert(`Signup failed: ${errorMessage}`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Signup</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            className="w-full p-2 border rounded mt-1"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className="w-full p-2 border rounded mt-1"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            className="w-full p-2 border rounded mt-1"
            required
            minLength={6}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full p-2 border rounded mt-1"
          >
            <option value="student">Student</option>
            <option value="company">Company</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Sign Up
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p>
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:text-blue-700">
            Login here
          </Link>
        </p>
      </div>
      
      {/* Debug information */}
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">Debug Info:</p>
        <pre className="text-xs overflow-auto">
          {JSON.stringify({ form }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default Signup;