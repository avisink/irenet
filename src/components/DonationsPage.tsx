import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { api, Match } from '../utils/api';
import { AlertCircle, Package, CheckCircle } from 'lucide-react';

export function DonationsPage() {
  const { accessToken } = useAuth();
  const [receivedDonations, setReceivedDonations] = useState<Match[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReceivedDonations();
  }, []);

  async function loadReceivedDonations() {
    if (!accessToken) return;

    try {
      // Get all matches for this organization
      const allMatches = await api.getMyMatches(accessToken);
      // Filter for fulfilled matches (received donations)
      const received = allMatches.filter(match => match.status === 'fulfilled');
      setReceivedDonations(received);
    } catch (err: any) {
      setError(err.message || 'Failed to load donations');
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
            <Package className="size-6 text-green-600" />
            Received Donations
          </CardTitle>
          <CardDescription>
            All donations you have successfully received
          </CardDescription>
        </CardHeader>
        <CardContent>
          {receivedDonations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="size-16 mx-auto mb-4 opacity-30" />
              <p>No donations received yet</p>
              <p className="text-sm mt-2">
                When you mark matches as received, they will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedDonations.map((donation) => (
                <div
                  key={donation.match_id}
                  className="p-4 border rounded-lg bg-green-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="size-5 text-green-600" />
                      <p className="font-medium text-green-800">
                        Donation #{donation.match_id}
                      </p>
                    </div>
                    <Badge className="bg-purple-600">
                      <CheckCircle className="size-3 mr-1" />
                      Received
                    </Badge>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Item:</p>
                      <p className="font-medium">
                        {donation.donations_d9b92013?.item_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Category: {donation.donations_d9b92013?.category}
                      </p>
                      <p className="text-sm text-gray-600">
                        Quantity: {donation.donations_d9b92013?.quantity}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Matched Request:</p>
                      <p className="font-medium">
                        {donation.requests_d9b92013?.item_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Requested Qty: {donation.requests_d9b92013?.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Received on: {new Date(donation.match_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
