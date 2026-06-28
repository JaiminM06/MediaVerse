import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PageLoader from '../ui/PageLoader.jsx';
import { API_BASE_URL } from '../../config/api.js';

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/v1/users/current-user`, { withCredentials: true })
      .then(() => {
        setAuthed(true);
        setChecking(false);
      })
      .catch((err) => {
        setChecking(false);
        if (err.response?.status === 401) {
          navigate('/Login');
        } else {
          setError('Connection error. Please check your internet and try again.');
        }
      });
  }, [navigate]);

  if (checking) return <PageLoader label="Verifying session..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-500 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return authed ? children : null;
}
