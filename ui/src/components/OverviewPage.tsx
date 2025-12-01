import React, { useState, useEffect } from 'react';
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
  const [userStats, setUserStats] = useState({ donations: 0, requests: 0, matches: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const globalStats = await api.getStats();
      setStats(globalStats);

      if (accessToken) {
        if (user?.role === 'donor') {
          const donations = await api.getMyDonations(accessToken);
          const matches = await api.getMyMatches(accessToken);
          setUserStats({
            donations: donations.length,
            requests: 0,
            matches: matches.length,
          });
        } else if (user?.role === 'organization') {
          const requests = await api.getMyRequests(accessToken);
          const matches = await api.getMyMatches(accessToken);
          
          // Count only completed matches as received donations
          const completedDonations = matches.filter(match => match.status === 'completed').length;
          
          setUserStats({
            donations: completedDonations,
            requests: requests.length,
            matches: matches.length,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <CardContent className="p-8">
          <h2 className="text-3xl mb-2">
            Welcome back, {user?.role === 'organization' ? user.organization?.org_name : user?.name}!
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

      {/* Personal Stats */}
      {user?.role !== 'admin' && (
        <div>
          <h3 className="text-xl mb-4">Your Activity</h3>
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
                    <div className="text-3xl">{userStats.matches}</div>
                    <p className="text-xs text-gray-500">People helped</p>
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