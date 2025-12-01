import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { api, Request, Donation } from '../utils/api';
import { AlertCircle, CheckCircle, FileText, Package } from 'lucide-react';

export function BrowseRequestsPage() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!accessToken) return;

    setLoading(true);
    setError('');
    try {
      const [requestsData, donationsData] = await Promise.all([
        api.getRequests('open'),
        api.getMyDonations(accessToken),
      ]);
      setRequests(requestsData);
      setDonations(donationsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleMatchDonation(donationId: number, requestId: number) {
    if (!accessToken) return;

    setError('');
    setSuccess('');

    try {
      await api.createMatch(accessToken, { donation_id: donationId, request_id: requestId });
      setSuccess('Match created successfully!');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create match');
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
            <FileText className="size-6 text-blue-600" />
            Available Requests
          </CardTitle>
          <CardDescription>
            Browse requests from organizations and match them with your donations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="size-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No open requests at the moment</p>
              <p className="text-sm mt-2">Check back later to see what organizations need</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.request_id}
                  className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="size-5 text-blue-600" />
                        <p className="font-medium text-lg">{request.item_name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Category:</span> {request.category}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Quantity Needed:</span> {request.quantity}
                        </p>
                        <p className="text-sm text-green-600 font-medium">
                          <span className="text-gray-600 font-normal">Organization:</span>{' '}
                          {request.organizations_d9b92013?.org_name}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-600 text-white">Open</Badge>
                  </div>

                  {donations.some(
                    (d) => d.status === 'available' && d.category === request.category
                  ) ? (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-2">
                        Match with one of your donations:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {donations
                          .filter(
                            (d) => d.status === 'available' && d.category === request.category
                          )
                          .map((d) => (
                            <Button
                              key={d.donation_id}
                              size="sm"
                              variant="outline"
                              onClick={() => handleMatchDonation(d.donation_id, request.request_id)}
                              className="border-green-600 text-green-700 hover:bg-green-50"
                            >
                              <Package className="size-3 mr-2" />
                              {d.item_name} (Qty: {d.quantity})
                            </Button>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-4 pt-4 border-t">
                      You don't have any available donations in this category
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
