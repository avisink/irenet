import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { donationsAPI, requestsAPI, matchesAPI, organizationsAPI } from '../../services/api';
import DonationCard from '../../components/DonationCard/DonationCard';
import RequestCard from '../../components/RequestCard/RequestCard';
import MatchCard from '../../components/MatchCard/MatchCard';
import Dropdown from '../../components/Dropdown/Dropdown';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    loadData(parsedUser);
  }, [navigate]);

  const loadData = async (userData) => {
    try {
      setLoading(true);
      
      // Clear all state first to prevent data leakage between users
      setDonations([]);
      setRequests([]);
      setMatches([]);
      setCompletedMatches([]);
      
      if (userData.role === 'donor') {
        const donationsRes = await donationsAPI.getAll({ donorId: userData.userId });
        setDonations(donationsRes.data.data || []);
        
        const matchesRes = await matchesAPI.getAll();
        const userMatches = matchesRes.data.data.filter(
          m => m.donorId === userData.userId
        );
        setMatches(userMatches);
        
        // Load all open requests for donors to browse
        const requestsRes = await requestsAPI.getAll({ status: 'open' });
        setRequests(requestsRes.data.data || []);
      } else if (userData.role === 'organization') {
        // Load available donations for organizations to browse
        const donationsRes = await donationsAPI.getAll({ status: 'available' });
        setDonations(donationsRes.data.data || []);
        
        // Get organization record to get org_id from user_id
        const orgsRes = await organizationsAPI.getAll();
        const userOrg = orgsRes.data.data.find(org => org.userId === userData.userId);
        
        if (userOrg) {
          // Store the orgId for use in forms
          setOrgId(userOrg.orgId);
          
          // Get requests using the actual org_id
          const orgRes = await requestsAPI.getAll({ orgId: userOrg.orgId });
          setRequests(orgRes.data.data || []);
          
          // Get matches filtered by org_id
          const matchesRes = await matchesAPI.getAll();
          const allMatches = matchesRes.data.data || [];
          const userMatches = allMatches.filter(
            m => m.orgId === userOrg.orgId
          );
          
          // Separate active matches from completed ones
          const activeMatches = userMatches.filter(m => {
            const isCompleted = m.donationStatus === 'delivered' || 
                               m.requestStatus === 'fulfilled' ||
                               m.donationStatus === 'completed' ||
                               m.requestStatus === 'completed';
            return !isCompleted;
          });
          
          const completed = userMatches.filter(m => {
            return m.donationStatus === 'delivered' || 
                   m.requestStatus === 'fulfilled' ||
                   m.donationStatus === 'completed' ||
                   m.requestStatus === 'completed';
          });
          
          setMatches(activeMatches);
          setCompletedMatches(completed);
        } else {
          // Organization record not found - set empty arrays
          setOrgId(null);
          setRequests([]);
          setMatches([]);
          setCompletedMatches([]);
        }
        
        const matchesRes = await matchesAPI.getAll();
        const allMatches = matchesRes.data.data || [];
        const userMatches = allMatches.filter(
          m => m.orgId === userData.userId
        );
        
        // Separate active matches from completed ones
        const activeMatches = userMatches.filter(m => {
          const isCompleted = m.donationStatus === 'delivered' || 
                             m.requestStatus === 'fulfilled' ||
                             m.donationStatus === 'completed' ||
                             m.requestStatus === 'completed';
          return !isCompleted;
        });
        
        const completed = userMatches.filter(m => {
          return m.donationStatus === 'delivered' || 
                 m.requestStatus === 'fulfilled' ||
                 m.donationStatus === 'completed' ||
                 m.requestStatus === 'completed';
        });
        
        setMatches(activeMatches);
        setCompletedMatches(completed);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-logo">
            <span className="logo-icon">🍃</span>
            <div>
              <h1 className="logo-text">ireNet</h1>
              <p className="logo-subtitle">{user.name || user.email}</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <span className="user-role">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
          <button onClick={handleLogout} className="btn-signout">
            <span>→</span> Sign Out
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <nav className="dashboard-nav">
          {user.role === 'donor' && (
            <>
              <button
                className={activeTab === 'overview' ? 'active' : ''}
                onClick={() => setActiveTab('overview')}
              >
                <span className="nav-icon">🏠</span>
                Overview
              </button>
              <button
                className={activeTab === 'donations' ? 'active' : ''}
                onClick={() => setActiveTab('donations')}
              >
                <span className="nav-icon">📦</span>
                My Donations
              </button>
              <button
                className={activeTab === 'browse-requests' ? 'active' : ''}
                onClick={() => setActiveTab('browse-requests')}
              >
                <span className="nav-icon">📄</span>
                Browse Requests
              </button>
              <button
                className={activeTab === 'matches' ? 'active' : ''}
                onClick={() => setActiveTab('matches')}
              >
                <span className="nav-icon">🔑</span>
                My Matches
              </button>
            </>
          )}
          {user.role === 'organization' && (
            <>
              <button
                className={activeTab === 'overview' ? 'active' : ''}
                onClick={() => setActiveTab('overview')}
              >
                <span className="nav-icon">🏠</span>
                Overview
              </button>
              <button
                className={activeTab === 'browse-donations' ? 'active' : ''}
                onClick={() => setActiveTab('browse-donations')}
              >
                <span className="nav-icon">📦</span>
                Browse Donations
              </button>
              <button
                className={activeTab === 'requests' ? 'active' : ''}
                onClick={() => setActiveTab('requests')}
              >
                <span className="nav-icon">📄</span>
                My Requests
              </button>
              <button
                className={activeTab === 'matches' ? 'active' : ''}
                onClick={() => setActiveTab('matches')}
              >
                <span className="nav-icon">🔑</span>
                Matches
              </button>
              <button
                className={activeTab === 'donations' ? 'active' : ''}
                onClick={() => setActiveTab('donations')}
              >
                <span className="nav-icon">✅</span>
                Donations
              </button>
            </>
          )}
        </nav>

        <main className="dashboard-main">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              {activeTab === 'overview' && user.role === 'donor' && (
                <div className="overview-container">
                  <div className="welcome-banner">
                    <h2 className="welcome-title">Welcome back, {user.name || 'there'}!</h2>
                    <p className="welcome-subtitle">Thank you for making a difference by donating food.</p>
                  </div>

                  <div className="section">
                    <h3 className="section-title">Your Activity</h3>
                    <div className="activity-cards">
                      <div className="activity-card">
                        <div className="activity-card-header">
                          <h4>My Donations</h4>
                          <span className="activity-icon">📦</span>
                        </div>
                        <div className="activity-value">{donations.length}</div>
                        <p className="activity-description">Total donations created</p>
                      </div>
                      <div className="activity-card">
                        <div className="activity-card-header">
                          <h4>Matches</h4>
                          <span className="activity-icon">🔑</span>
                        </div>
                        <div className="activity-value">{matches.length}</div>
                        <p className="activity-description">Successful matches</p>
                      </div>
                      <div className="activity-card">
                        <div className="activity-card-header">
                          <h4>Impact</h4>
                          <span className="activity-icon">📈</span>
                        </div>
                        <div className="activity-value">{matches.length}</div>
                        <p className="activity-description">People helped</p>
                      </div>
                    </div>
                  </div>

                  <div className="section">
                    <h3 className="section-title">Quick Actions</h3>
                    <p className="section-subtitle">Get started with these common tasks</p>
                    <div className="quick-actions">
                      <div 
                        className="quick-action-card"
                        onClick={() => setActiveTab('create')}
                      >
                        <span className="action-icon">📦</span>
                        <div>
                          <h4>Create a Donation</h4>
                          <p>List food items you'd like to donate</p>
                        </div>
                      </div>
                      <div 
                        className="quick-action-card"
                        onClick={() => setActiveTab('browse-requests')}
                      >
                        <span className="action-icon">📄</span>
                        <div>
                          <h4>Browse Requests</h4>
                          <p>See what organizations need</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'donations' && user.role === 'donor' && (
                <div className="donations-page">
                  <div className="section">
                    <div className="section-header">
                      <div>
                        <h2>My Donations</h2>
                        <p className="section-subtitle">Manage your food donations</p>
                      </div>
                      <button 
                        className="btn-new-donation"
                        onClick={() => setActiveTab('create')}
                      >
                        <span>+</span> New Donation
                      </button>
                    </div>
                    {donations.length > 0 ? (
                      <div className="cards-grid">
                        {donations.map((donation) => (
                          <DonationCard
                            key={donation.donationId}
                            donation={donation}
                            onUpdate={loadData}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <span className="empty-icon">📦</span>
                        <p>No donations yet. Create your first donation!</p>
                      </div>
                    )}
                  </div>

                  <div className="section">
                    <h2>Available Requests</h2>
                    <p className="section-subtitle">Browse requests from organizations</p>
                    {requests.length > 0 ? (
                      <div className="requests-list">
                        {requests.slice(0, 3).map((request) => (
                          <div key={request.requestId} className="request-item">
                            <div>
                              <h4>{request.itemName}</h4>
                              <p className="request-details">
                                {request.category.charAt(0).toUpperCase() + request.category.slice(1)} • Qty: {request.quantity}
                              </p>
                            </div>
                            <span className="request-org">ireNet</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-text">No requests available at the moment.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'browse-requests' && user.role === 'donor' && (
                <div className="section">
                  <h2>Available Requests</h2>
                  <p className="section-subtitle">Browse requests from organizations</p>
                  {requests.length > 0 ? (
                    <div className="requests-list">
                      {requests.map((request) => (
                        <div key={request.requestId} className="request-item">
                          <div>
                            <h4>{request.itemName}</h4>
                            <p className="request-details">
                              {request.category.charAt(0).toUpperCase() + request.category.slice(1)} • Qty: {request.quantity}
                            </p>
                            {request.description && (
                              <p className="request-description">{request.description}</p>
                            )}
                          </div>
                          <span className="request-org">{request.orgName || 'Organization'}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <span className="empty-icon">📄</span>
                      <p>No requests available at the moment.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'create' && user.role === 'donor' && (
                <CreateDonationForm user={user} onSuccess={() => {
                  setActiveTab('donations');
                  loadData(user);
                }} />
              )}

              {activeTab === 'overview' && user.role === 'organization' && (
                <div className="overview-container">
                  <div className="welcome-banner">
                    <h2 className="welcome-title">Welcome back, {user.name || 'there'}!</h2>
                    <p className="welcome-subtitle">Thank you for helping connect resources with those in need.</p>
                  </div>

                  <div className="section">
                    <h3 className="section-title">Your Activity</h3>
                    <div className="activity-cards">
                      <div className="activity-card">
                        <div className="activity-card-header">
                          <h4>My Requests</h4>
                          <span className="activity-icon">📄</span>
                        </div>
                        <div className="activity-value">{requests.length}</div>
                        <p className="activity-description">Total requests created</p>
                      </div>
                      <div className="activity-card">
                        <div className="activity-card-header">
                          <h4>Matches</h4>
                          <span className="activity-icon">🔑</span>
                        </div>
                        <div className="activity-value">{matches.length}</div>
                        <p className="activity-description">Items matched by admin</p>
                      </div>
                      <div className="activity-card">
                        <div className="activity-card-header">
                          <h4>Completed</h4>
                          <span className="activity-icon">✅</span>
                        </div>
                        <div className="activity-value">{completedMatches.length}</div>
                        <p className="activity-description">Successfully received</p>
                      </div>
                    </div>
                  </div>

                  <div className="section">
                    <h3 className="section-title">Quick Actions</h3>
                    <p className="section-subtitle">Get started with these common tasks</p>
                    <div className="quick-actions">
                      <div 
                        className="quick-action-card"
                        onClick={() => setActiveTab('requests')}
                      >
                        <span className="action-icon">📄</span>
                        <div>
                          <h4>Create a Request</h4>
                          <p>List items your organization needs</p>
                        </div>
                      </div>
                      <div 
                        className="quick-action-card"
                        onClick={() => setActiveTab('matches')}
                      >
                        <span className="action-icon">🔑</span>
                        <div>
                          <h4>View Matches</h4>
                          <p>See matched items and mark as completed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'browse-donations' && user.role === 'organization' && (
                <div className="section">
                  <h2>Browse Donations</h2>
                  <p className="section-subtitle">View all available donations from donors. Donor information will be shared after admin matches your request.</p>
                  {donations.length > 0 ? (
                    <div className="cards-grid">
                      {donations.map((donation) => (
                        <DonationCard
                          key={donation.donationId}
                          donation={donation}
                          showRequestButton={false}
                          hideDonorInfo={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <span className="empty-icon">📦</span>
                      <p>No available donations at the moment.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'requests' && user.role === 'organization' && (
                <div className="section">
                  <div className="section-header">
                    <div>
                      <h2>My Requests</h2>
                      <p className="section-subtitle">Manage your organization's requests</p>
                    </div>
                    <button 
                      className="btn-new-donation"
                      onClick={() => {
                        // Create a temporary state to show form
                        setActiveTab('create-request');
                      }}
                    >
                      <span>+</span> New Request
                    </button>
                  </div>
                  {requests.length > 0 ? (
                    <div className="cards-grid">
                      {requests.map((request) => (
                        <RequestCard
                          key={request.requestId}
                          request={request}
                          onUpdate={loadData}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <span className="empty-icon">📄</span>
                      <p>No requests yet. Create your first request!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'create-request' && user.role === 'organization' && (
                <CreateRequestForm user={user} orgId={orgId} onSuccess={() => {
                  setActiveTab('requests');
                  loadData(user);
                }} />
              )}

              {activeTab === 'matches' && user.role === 'organization' && (
                <div className="section">
                  <h2>Matches</h2>
                  <p className="section-subtitle">Items that have been matched by admin. Mark as completed after coordinating delivery/pickup logistics with donors.</p>
                  {matches.length > 0 ? (
                    <div className="cards-grid">
                      {matches.map((match) => (
                        <MatchCard
                          key={match.matchId}
                          match={match}
                          userRole={user.role}
                          onUpdate={loadData}
                          canMarkCompleted={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <span className="empty-icon">🔑</span>
                      <p>No matches yet. Matches will appear here once an admin matches your requests with donations.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'donations' && user.role === 'organization' && (
                <div className="section">
                  <h2>Donations</h2>
                  <p className="section-subtitle">Successfully received donations from completed matches</p>
                  {completedMatches.length > 0 ? (
                    <div className="cards-grid">
                      {completedMatches.map((match) => (
                        <MatchCard
                          key={match.matchId}
                          match={match}
                          userRole={user.role}
                          onUpdate={loadData}
                          isCompleted={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <span className="empty-icon">✅</span>
                      <p>No completed donations yet. Complete matches will appear here after you mark them as received.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'matches' && user.role === 'donor' && (
                <div className="section">
                  <h2>My Matches</h2>
                  {matches.length > 0 ? (
                    <div className="cards-grid">
                      {matches.map((match) => (
                        <MatchCard
                          key={match.matchId}
                          match={match}
                          userRole={user.role}
                          onUpdate={loadData}
                        />
                      ))}
                    </div>
                  ) : (
                    <p>No matches yet.</p>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// Create Donation Form Component
function CreateDonationForm({ user, onSuccess }) {
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    quantity: '',
    description: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await donationsAPI.create({
        donorId: user.userId,
        itemName: formData.itemName,
        category: formData.category,
        quantity: parseInt(formData.quantity),
        description: formData.description,
        location: formData.location,
        status: 'available',
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-section">
      <h2>Create New Donation</h2>
      <form onSubmit={handleSubmit} className="donation-form">
        <div className="form-group">
          <label>Item Name *</label>
          <input
            type="text"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Category *</label>
          <Dropdown
            name="category"
            options={[
              { value: '', label: 'Select category' },
              { value: 'food', label: 'Food' },
              { value: 'clothing', label: 'Clothing' },
              { value: 'supplies', label: 'Supplies' },
              { value: 'furniture', label: 'Furniture' },
              { value: 'electronics', label: 'Electronics' },
              { value: 'other', label: 'Other' },
            ]}
            value={formData.category}
            onChange={handleChange}
            placeholder="Select category"
            required
          />
        </div>
        <div className="form-group">
          <label>Quantity *</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min="1"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Donation'}
        </button>
      </form>
    </div>
  );
}

// Create Request Form Component
function CreateRequestForm({ user, orgId, onSuccess }) {
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    quantity: '',
    description: '',
    urgency: 'normal',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!orgId) {
      setError('Organization ID not found. Please refresh the page.');
      return;
    }
    
    setLoading(true);

    try {
      await requestsAPI.create({
        orgId: orgId, // Use the actual org_id from the organizations table
        itemName: formData.itemName,
        category: formData.category,
        quantity: parseInt(formData.quantity),
        description: formData.description,
        urgency: formData.urgency,
        status: 'open',
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-section">
      <h2>Create New Request</h2>
      <form onSubmit={handleSubmit} className="donation-form">
        <div className="form-group">
          <label>Item Needed *</label>
          <input
            type="text"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Category *</label>
          <Dropdown
            name="category"
            options={[
              { value: '', label: 'Select category' },
              { value: 'food', label: 'Food' },
              { value: 'clothing', label: 'Clothing' },
              { value: 'supplies', label: 'Supplies' },
              { value: 'furniture', label: 'Furniture' },
              { value: 'electronics', label: 'Electronics' },
              { value: 'other', label: 'Other' },
            ]}
            value={formData.category}
            onChange={handleChange}
            placeholder="Select category"
            required
          />
        </div>
        <div className="form-group">
          <label>Quantity Needed *</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min="1"
          />
        </div>
        <div className="form-group">
          <label>Urgency</label>
          <Dropdown
            name="urgency"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
            value={formData.urgency}
            onChange={handleChange}
            placeholder="Select urgency"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Request'}
        </button>
      </form>
    </div>
  );
}

export default Dashboard;


