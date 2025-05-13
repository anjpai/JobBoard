// frontend/src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import api from '../services/api';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await api.get('/auth');
        setUser(response.data);
      } catch (err) {
        console.error('Auth error:', err);
        setError(err.message);
        // Clear invalid tokens
        localStorage.removeItem('token');
        localStorage.removeItem('role');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
};

export default useAuth;