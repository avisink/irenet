import { useState } from 'react';
import { matchesAPI } from '../../services/api';
import './MatchCard.css';

function MatchCard({ match, userRole, onUpdate, canMarkCompleted = false, isCompleted = false }) {
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!window.confirm('Mark this match as completed? This confirms you have received the items after coordinating delivery/pickup with the donor.')) return;

    setLoading(true);
    try {
      await matchesAPI.update(match.matchId, 'complete');
      if (onUpdate) onUpdate();
      alert('Match marked as completed!');
    } catch (error) {
      alert('Failed to complete match: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this match? This will make the donation available again.')) return;

    setLoading(true);
    try {
      await matchesAPI.update(match.matchId, 'cancel');
      if (onUpdate) onUpdate();
      alert('Match cancelled');
    } catch (error) {
      alert('Failed to cancel match: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="match-card">
      <div className="card-header">
        <h3>Match #{match.matchId}</h3>
        <span className="match-date">
          {new Date(match.matchDate).toLocaleDateString()}
        </span>
      </div>
      <div className="card-body">
        <div className="match-details">
          <div className="match-side">
            <h4>Donation</h4>
            <p><strong>{match.donationItem}</strong></p>
            <p>Donor: {match.donorName}</p>
            {match.donorEmail && (
              <p className="contact-info">📧 {match.donorEmail}</p>
            )}
            {match.donorContact && (
              <p className="contact-info">📞 {match.donorContact}</p>
            )}
            <span className={`status status-${match.donationStatus || 'matched'}`}>
              {match.donationStatus || 'matched'}
            </span>
          </div>
          <div className="match-arrow">→</div>
          <div className="match-side">
            <h4>Request</h4>
            <p><strong>{match.requestItem}</strong></p>
            <p>Organization: {match.orgName}</p>
            <span className={`status status-${match.requestStatus || 'matched'}`}>
              {match.requestStatus || 'matched'}
            </span>
          </div>
        </div>
      </div>
      <div className="card-footer">
        {!isCompleted && (match.donationStatus === 'matched' || match.requestStatus === 'matched') && (
          <>
            {canMarkCompleted && userRole === 'organization' && (
              <button
                onClick={handleComplete}
                className="btn btn-success btn-sm"
                disabled={loading}
              >
                Mark Completed
              </button>
            )}
            {!canMarkCompleted && (
              <>
                <button
                  onClick={handleComplete}
                  className="btn btn-success btn-sm"
                  disabled={loading}
                >
                  Mark Completed
                </button>
                <button
                  onClick={handleCancel}
                  className="btn btn-secondary btn-sm"
                  disabled={loading}
                >
                  Cancel Match
                </button>
              </>
            )}
          </>
        )}
        {(isCompleted || match.donationStatus === 'delivered' || match.requestStatus === 'fulfilled') && (
          <span className="completed-badge">✓ Completed</span>
        )}
      </div>
    </div>
  );
}

export default MatchCard;

