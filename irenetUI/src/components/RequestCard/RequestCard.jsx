import { useState } from 'react';
import { requestsAPI } from '../../services/api';
import './RequestCard.css';

function RequestCard({ request, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;

    setLoading(true);
    try {
      await requestsAPI.delete(request.requestId);
      if (onUpdate) onUpdate();
    } catch (error) {
      alert('Failed to delete: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="request-card">
      <div className="card-header">
        <h3>{request.itemName}</h3>
        <span className={`status status-${request.status}`}>
          {request.status}
        </span>
      </div>
      <div className="card-body">
        <p className="category">{request.category}</p>
        <p className="quantity">Quantity Needed: {request.quantity}</p>
        {request.urgency && (
          <p className={`urgency urgency-${request.urgency}`}>
            Urgency: {request.urgency}
          </p>
        )}
        {request.description && (
          <p className="description">{request.description}</p>
        )}
        {request.orgName && (
          <p className="org">Organization: {request.orgName}</p>
        )}
      </div>
      <div className="card-footer">
        <button
          onClick={handleDelete}
          className="btn btn-danger btn-sm"
          disabled={loading}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default RequestCard;

