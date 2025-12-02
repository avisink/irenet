import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../context/AuthContext';
import { api, Stats } from '../utils/api';
import { Package, FileText, GitMerge, TrendingUp } from 'lucide-react';

interface OverviewPageProps {
  onNavigate?: (page: string) => void;
}

export function OverviewPage({ onNavigate }: OverviewPageProps) {
  const { user, accessToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [userStats, setUserStats] = useState({ donations: 0, requests: 0, matches: 0, impact: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to get global stats, but don't fail if it doesn't work
      try {
        const globalStats = await api.getStats();
        setStats(globalStats);
      } catch (statsErr) {
        console.warn('Failed to load global stats (non-critical):', statsErr);
        // Continue even if global stats fail
      }

      if (accessToken && user) {
        if (user.role === 'donor') {
          const donations = await api.getMyDonations(accessToken);
          const matches = await api.getMyMatches(accessToken);
          
          // Debug: Log matches to see what data we're getting
          console.log('🔍 Donor matches data:', matches);
          matches.forEach((match, index) => {
            console.log(`Match ${index}:`, {
              match_id: match.match_id,
              donation_id: match.donation_id,
              request_id: match.request_id,
              donation_quantity: match.donation_quantity,
              request_quantity: match.request_quantity,
              status: match.status,
            });
          });
          
          // Calculate impact: sum of quantities from all matches
          // Use donation_quantity if available, otherwise fall back to request_quantity
          const impact = matches.reduce((sum, match) => {
            // Handle null, undefined, or 0 values properly
            const donationQty = match.donation_quantity != null ? Number(match.donation_quantity) : null;
            const requestQty = match.request_quantity != null ? Number(match.request_quantity) : null;
            const quantity = donationQty ?? requestQty ?? 0;
            console.log(`Calculating impact: match ${match.match_id}, donation_qty=${match.donation_quantity} (${typeof match.donation_quantity}), request_qty=${match.request_quantity} (${typeof match.request_quantity}), using=${quantity}`);
            return sum + quantity;
          }, 0);
          
          console.log('📊 Calculated impact:', impact);
          
          setUserStats({
            donations: donations.length,
            requests: 0,
            matches: matches.length,
            impact: impact,
          });
        } else if (user.role === 'organization') {
          const requests = await api.getMyRequests(accessToken);
          const matches = await api.getMyMatches(accessToken);
          
          // Sum quantities from completed matches (items received)
          const completedMatches = matches.filter(match => match.status === 'completed');
          const donationsReceived = completedMatches.reduce((sum, match) => {
            const quantity = match.donation_quantity || match.request_quantity || 0;
            return sum + quantity;
          }, 0);
          
          setUserStats({
            donations: donationsReceived,
            requests: requests.length,
            matches: matches.length,
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to load stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, [user, accessToken]);

  useEffect(() => {
    // Only load stats when user and accessToken are available
    if (user && accessToken) {
      loadStats();
    } else if (user === null && !accessToken) {
      // User is logged out, reset stats
      setUserStats({ donations: 0, requests: 0, matches: 0, impact: 0 });
      setLoading(false);
    }
  }, [user, accessToken, loadStats]);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <CardContent className="p-8">
          <h2 className="text-3xl mb-2">
            Welcome back, {user?.role === 'organization' ? (user.organization?.orgName || user?.name) : user?.name}!
          </h2>
          <p className="text-xl opacity-90">
            {user?.role === 'donor'
              ? 'Thank you for making a difference by donating food.'
              : user?.role === 'organization'
              ? 'Connect with donors to help your community.'
              : 'Manage the ireNet platform and facilitate connections.'}
          </p>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={loadStats}
              className="mt-2 text-sm text-red-700 underline hover:text-red-900"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <p className="text-sm text-gray-600">Loading statistics...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Stats */}
      {user?.role !== 'admin' && !loading && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl">Your Activity</h3>
            <button
              onClick={loadStats}
              className="text-sm text-green-600 hover:text-green-700 underline"
            >
              Refresh
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {user?.role === 'donor' && (
              <>
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onNavigate?.('my-donations')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">My Donations</CardTitle>
                    <Package className="size-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl">{userStats.donations}</div>
                    <p className="text-xs text-gray-500">Total donations created</p>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onNavigate?.('my-matches')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">Matches</CardTitle>
                    <GitMerge className="size-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl">{userStats.matches}</div>
                    <p className="text-xs text-gray-500">Successful matches</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">Impact</CardTitle>
                    <TrendingUp className="size-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl">{userStats.impact}</div>
                    <p className="text-xs text-gray-500">Items donated</p>
                  </CardContent>
                </Card>
              </>
            )}
            {user?.role === 'organization' && (
              <>
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onNavigate?.('my-requests')}  
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">My Requests</CardTitle>
                    <FileText className="size-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl">{userStats.requests}</div>
                    <p className="text-xs text-gray-500">Total requests created</p>
                  </CardContent>
                </Card>


                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => onNavigate?.('matches')}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">Matches</CardTitle>
                    <GitMerge className="size-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl">{userStats.matches}</div>
                    <p className="text-xs text-gray-500">Items to receive</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm">Donations Received</CardTitle>
                    <TrendingUp className="size-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl">{userStats.donations}</div>
                    <p className="text-xs text-gray-500">Items received</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {/* Global Stats */}
  
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with these common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {user?.role === 'donor' && (
              <>
                <div 
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onNavigate?.('create-donation')}
                >
                  <Package className="size-8 text-green-600 mb-2" />
                  <h4 className="font-medium mb-1">Create a Donation</h4>
                  <p className="text-sm text-gray-600">
                    List food items you'd like to donate
                  </p>
                </div>
                <div 
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onNavigate?.('browse-requests')}
                >
                  <FileText className="size-8 text-blue-600 mb-2" />
                  <h4 className="font-medium mb-1">Browse Requests</h4>
                  <p className="text-sm text-gray-600">
                    See what organizations need
                  </p>
                </div>
              </>
            )}
            {user?.role === 'organization' && (
              <>
                <div 
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onNavigate?.('my-matches')}
                >
                  <FileText className="size-8 text-blue-600 mb-2" />
                  <h4 className="font-medium mb-1">Create a Request</h4>
                  <p className="text-sm text-gray-600">
                    Request food items you need
                  </p>
                </div>
                <div 
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => onNavigate?.('donations')}
                >
                  <Package className="size-8 text-green-600 mb-2" />
                  <h4 className="font-medium mb-1">Browse Donations</h4>
                  <p className="text-sm text-gray-600">
                    See what's available from donors
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}