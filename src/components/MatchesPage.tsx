import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { api, Match } from '../utils/api';
import { AlertCircle, CheckCircle, GitMerge, Package } from 'lucide-react';

export function MatchesPage() {
  const { accessToken } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    if (!accessToken) return;

    try {
      const data = await api.getMyMatches(accessToken);
      setMatches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load matches');
    }
  }

  async function handleMarkAsReceived(matchId: number) {
    if (!accessToken || !confirm('Mark this match as received?')) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Update match status to fulfilled
      await api.updateMatchStatus(accessToken, matchId, 'fulfilled');
      setSuccess('Match marked as received! Item moved to Donations.');
      loadMatches();
    } catch (err: any) {
      setError(err.message || 'Failed to update match status');
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

      {success && (
        <Alert>
          <CheckCircle className="size-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="size-6 text-purple-600" />
            Current Matches
          </CardTitle>
          <CardDescription>
            Items promised to be donated - mark as received when you get them
          </CardDescription>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <GitMerge className="size-16 mx-auto mb-4 opacity-30" />
              <p>No current matches</p>
              <p className="text-sm mt-2">Matches will appear here when donors commit to your requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <div
                  key={match.match_id}
                  className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="size-5 text-green-600" />
                      <p className="font-medium">Match #{match.match_id}</p>
                    </div>
                    <Badge className="bg-green-600">Matched</Badge>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Your Request:</p>
                      <p className="font-medium text-green-700">
                        {match.requests_d9b92013?.item_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Category: {match.requests_d9b92013?.category}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {match.requests_d9b92013?.quantity}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Donation:</p>
                      <p className="font-medium text-blue-700">
                        {match.donations_d9b92013?.item_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Category: {match.donations_d9b92013?.category}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {match.donations_d9b92013?.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Matched on: {new Date(match.match_date).toLocaleDateString()}
                    </p>
                    <Button
                      onClick={() => handleMarkAsReceived(match.match_id)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="size-4 mr-2" />
                      Mark as Received
                    </Button>
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
