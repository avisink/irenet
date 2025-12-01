import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchesAPI } from '../../services/api';
import MatchCard from '../../components/MatchCard/MatchCard';
import './MatchCenter.css';

function MatchCenter() {
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    setUser(parsedUser);
    loadMatches();
  }, [navigate]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const response = await matchesAPI.getAll();
      setMatches(response.data.data || []);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="match-center">
      <header className="match-center-header">
        <h1>Match Center - Admin</h1>
        <div className="header-info">
          <span>Welcome, {user.name}</span>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            Logout
          </button>
        </div>
      </header>

      <main className="match-center-main">
        <div className="section">
          <h2>All Matches</h2>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : matches.length > 0 ? (
            <div className="matches-grid">
              {matches.map((match) => (
                <MatchCard
                  key={match.matchId}
                  match={match}
                  userRole="admin"
                  onUpdate={loadMatches}
                />
              ))}
            </div>
          ) : (
            <p>No matches found.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default MatchCenter;

