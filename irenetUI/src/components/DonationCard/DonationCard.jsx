import { useState } from 'react';
import { donationsAPI, matchesAPI } from '../../services/api';
import './DonationCard.css';

function DonationCard({ donation, showRequestButton = false, orgId, onUpdate, onRequest, hideDonorInfo = false }) {
  const [loading, setLoading] = useState(false);

  const handleRequestMatch = async () => {
    if (!window.confirm('Request to match this donation?')) return;

    setLoading(true);
    try {
      // First, create a request for this item
      // Then create a match
      // For now, simplified - you may need to adjust based on your flow
      await matchesAPI.create({
        donationId: donation.donationId,
        requestId: null, // You may need to create a request first
      });
      alert('Match requested!');
      if (onRequest) onRequest();
    } catch (error) {
      alert('Failed to request match: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this donation?')) return;

    setLoading(true);
    try {
      await donationsAPI.delete(donation.donationId);
      if (onUpdate) onUpdate();
    } catch (error) {
      alert('Failed to delete: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donation-card">
      <div className="card-header">
        <h3>{donation.itemName}</h3>
        <span className={`status status-${donation.status}`}>
          {donation.status}
        </span>
      </div>
      <div className="card-body">
        <p className="category">{donation.category}</p>
        <p className="quantity">Quantity: {donation.quantity}</p>
        {donation.description && (
          <p className="description">{donation.description}</p>
        )}
        {!hideDonorInfo && donation.location && (
          <p className="location">📍 {donation.location}</p>
        )}
        {!hideDonorInfo && donation.donorName && (
          <p className="donor">Donor: {donation.donorName}</p>
        )}
      </div>
      <div className="card-footer">
        {showRequestButton && donation.status === 'available' && (
          <button
            onClick={handleRequestMatch}
            className="btn btn-primary btn-sm"
            disabled={loading}
          >
            {loading ? 'Requesting...' : 'Request Match'}
          </button>
        )}
        {!showRequestButton && (
          <button
            onClick={handleDelete}
            className="btn btn-danger btn-sm"
            disabled={loading}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default DonationCard;

