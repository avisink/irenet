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
                  className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GitMerge className="size-5 text-green-600" />
                      <p className="font-medium text-green-800">Match #{match.match_id}</p>
                    </div>
                    <Badge
                      className={
                        match.status === 'fulfilled'
                          ? 'bg-purple-600'
                          : 'bg-green-600'
                      }
                    >
                      {match.status === 'fulfilled' ? 'Delivered' : 'Matched'}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="size-4 text-green-600" />
                        <p className="text-xs text-gray-500 font-medium">Your Donation:</p>
                      </div>
                      <p className="font-medium text-green-700">
                        {match.donations_d9b92013?.item_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Category: {match.donations_d9b92013?.category}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {match.donations_d9b92013?.quantity}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="size-4 text-blue-600" />
                        <p className="text-xs text-gray-500 font-medium">Organization:</p>
                      </div>
                      <p className="font-medium text-blue-700">
                        {match.requests_d9b92013?.organizations_d9b92013?.org_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Requested: {match.requests_d9b92013?.item_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {match.requests_d9b92013?.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="text-xs text-gray-500">
                      Matched on: {new Date(match.match_date).toLocaleDateString()}
                    </p>
                    {match.status === 'fulfilled' && (
                      <p className="text-xs text-purple-600 font-medium">
                        ✓ Delivered to organization
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
