import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { api, Match } from '../utils/api';
import { AlertCircle, GitMerge, Package, Building } from 'lucide-react';

export function DonorMatchesPage() {
  const { accessToken } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    if (!accessToken) return;

    setLoading(true);
    setError('');
    try {
      const data = await api.getMyMatches(accessToken);
      setMatches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="size-6 text-purple-600" />
            My Matches
          </CardTitle>
          <CardDescription>
            Your donations that have been matched with organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <GitMerge className="size-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No matches yet</p>
              <p className="text-sm mt-2">
                When you match your donations with requests, they will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <div
                  key={match.match_id}
                  className={`p-4 border rounded-lg ${
                    match.status === 'completed'
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100'
                      : 'bg-gradient-to-r from-green-50 to-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GitMerge className="size-5 text-green-600" />
                      <p className="font-medium text-green-800">Donation Match</p>
                    </div>
                    <Badge
                      className={
                        match.status === 'completed'
                          ? 'bg-emerald-600'
                          : 'bg-orange-500'
                      }
                    >
                      {match.status === 'completed' ? 'Completed' : 'Pending Delivery'}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="size-4 text-green-600" />
                        <p className="text-xs text-gray-500 font-medium">Your Donation:</p>
                      </div>
                      <p className="font-medium text-green-700">
                        {match.donation_item}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="size-4 text-blue-600" />
                        <p className="text-xs text-gray-500 font-medium">Deliver To:</p>
                      </div>
                      <p className="font-medium text-blue-700">
                        {match.org_name}
                      </p>
                      {match.org_contact_info && (
                        <p className="text-sm text-gray-600 mt-1">
                          {match.org_contact_info}
                        </p>
                      )}
                      {match.request_item && (
                        <p className="text-xs text-gray-500 mt-2">
                          They requested: {match.request_item}
                        </p>
                      )}
                    </div>
                  </div>

                  {match.status !== 'completed' && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-orange-800 font-medium">
                        📦 Action Required: Please deliver this donation to the organization
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        Once delivered, the organization will mark it as received
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="text-xs text-gray-500">
                      Matched on: {new Date(match.match_date).toLocaleDateString()}
                    </p>
                    {match.status === 'completed' && (
                      <p className="text-xs text-emerald-600 font-medium">
                        ✓ Delivered and received by organization
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

