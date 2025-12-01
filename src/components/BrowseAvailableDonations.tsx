import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { api, Donation } from '../utils/api';
import { AlertCircle, Package, Check } from 'lucide-react';

export function BrowseAvailableDonations() {
  const { accessToken } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState<number | null>(null);

  useEffect(() => {
    loadDonations();
  }, []);

  async function loadDonations() {
    if (!accessToken) return;

    try {
      // Get all available donations from donors
      const availableDonations = await api.getDonations('available');
      setDonations(availableDonations);
    } catch (err: any) {
      setError(err.message || 'Failed to load donations');
    }
  }

  async function handleAcceptDonation(donationId: number) {
    if (!accessToken) return;
    
    setError('');
    setSuccess('');
    setLoading(donationId);

    try {
      // Create a match for this donation
      await api.createMatch(accessToken, {
        donation_id: donationId,
      });

      setSuccess('Donation accepted! Check your Matches page.');
      loadDonations(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to accept donation');
    } finally {
      setLoading(null);
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
        <Alert className="border-green-500 bg-green-50 text-green-800">
          <Check className="size-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-6 text-green-600" />
            Available Donations
          </CardTitle>
          <CardDescription>
            Browse donations from donors and accept ones that match your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="size-16 mx-auto mb-4 opacity-30" />
              <p>No donations available at the moment</p>
              <p className="text-sm mt-2">
                Check back later for new donations from donors
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {donations.map((donation) => (
                <div
                  key={donation.donation_id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{donation.item_name}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {donation.category}
                      </Badge>
                    </div>
                    <Badge className="bg-green-600">
                      Available
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Quantity:</span>
                      <span className="font-medium">{donation.quantity}</span>
                    </div>
                    {donation.description && (
                      <div className="text-sm">
                        <span className="text-gray-500">Description:</span>
                        <p className="mt-1">{donation.description}</p>
                      </div>
                    )}
                    {donation.location && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Location:</span>
                        <span>{donation.location}</span>
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      Posted: {new Date(donation.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAcceptDonation(donation.donation_id)}
                    disabled={loading === donation.donation_id}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {loading === donation.donation_id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <Check className="size-4 mr-2" />
                        Accept Donation
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

