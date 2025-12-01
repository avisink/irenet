import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { AlertCircle, Package, Trash2, CheckCircle, Clock } from 'lucide-react';

export function MyDonations() {
  const { accessToken } = useAuth();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDonations();
  }, []);

  async function loadDonations() {
    if (!accessToken) return;

    setLoading(true);
    setError('');
    try {
      const data = await api.getMyDonations(accessToken);
      setDonations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load donations');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDonation(donationId: number) {
    if (!accessToken || !confirm('Are you sure you want to delete this donation?')) return;

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.deleteDonation(accessToken, donationId);
      setSuccess('Donation deleted successfully');
      setDonations((prev) => prev.filter((d) => d.donation_id !== donationId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete donation');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      available: { icon: Clock, color: 'bg-blue-100 text-blue-800' },
      matched: { icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      delivered: { icon: CheckCircle, color: 'bg-purple-100 text-purple-800' },
      cancelled: { icon: AlertCircle, color: 'bg-red-100 text-red-800' },
    };

    const config = variants[status] || variants.available;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="size-3 mr-1" />
        {status}
      </Badge>
    );
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
            <Package className="size-6 text-green-600" />
            My Donations
          </CardTitle>
          <CardDescription>
            View and manage your food donations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="size-16 mx-auto mb-4 opacity-30" />
              <p>No donations yet</p>
              <p className="text-sm mt-2">Create your first donation to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => (
                <div
                  key={donation.donation_id}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="size-5 text-green-600" />
                      <p className="font-medium">
                        {donation.item_name}
                      </p>
                    </div>
                    {getStatusBadge(donation.status)}
                  </div>

                  <div className="space-y-1 mb-3">
                    <p className="text-sm text-gray-600">
                      Category: {donation.category}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantity: {donation.quantity}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="text-xs text-gray-500">
                      Created on: {new Date(donation.created_at).toLocaleDateString()}
                    </p>
                    {donation.status === 'available' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDonation(donation.donation_id)}
                        disabled={loading}
                      >
                        <Trash2 className="size-4 text-red-600" />
                      </Button>
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