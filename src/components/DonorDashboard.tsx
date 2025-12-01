import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { api, Donation, Request, Match } from '../utils/api';
import { Plus, Package, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function DonorDashboard() {
  const { accessToken } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New donation form
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!accessToken) return;

    try {
      const [donationsData, requestsData, matchesData] = await Promise.all([
        api.getMyDonations(accessToken),
        api.getRequests('open'),
        api.getMyMatches(accessToken),
      ]);

      setDonations(donationsData);
      setRequests(requestsData);
      setMatches(matchesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    }
  }

  async function handleCreateDonation(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.createDonation(accessToken, {
        item_name: itemName,
        category,
        quantity: parseInt(quantity),
      });

      setSuccess('Donation created successfully!');
      setShowDonationDialog(false);
      setItemName('');
      setCategory('');
      setQuantity('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDonation(id: number) {
    if (!accessToken || !confirm('Are you sure you want to delete this donation?')) return;

    try {
      await api.deleteDonation(accessToken, id);
      setSuccess('Donation deleted successfully');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete donation');
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

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      available: { variant: 'default', icon: Clock, color: 'bg-blue-100 text-blue-800' },
      matched: { variant: 'secondary', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      delivered: { variant: 'default', icon: CheckCircle, color: 'bg-purple-100 text-purple-800' },
      cancelled: { variant: 'destructive', icon: AlertCircle, color: 'bg-red-100 text-red-800' },
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

      {/* My Donations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Donations</CardTitle>
              <CardDescription>Manage your food donations</CardDescription>
            </div>
            <Dialog open={showDonationDialog} onOpenChange={setShowDonationDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  New Donation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Donation</DialogTitle>
                  <DialogDescription>Add a new food item to donate</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDonation} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-name">Item Name</Label>
                    <Input
                      id="item-name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g., Canned Beans"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="w-full border rounded-md p-2"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="Produce">Produce</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Meat">Meat</option>
                      <option value="Grains">Grains</option>
                      <option value="Canned Goods">Canned Goods</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g., 10"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Donation'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="size-12 mx-auto mb-3 opacity-50" />
              <p>No donations yet. Create your first donation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {donations.map((donation) => (
                <div
                  key={donation.donation_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{donation.item_name}</p>
                    <p className="text-sm text-gray-600">
                      {donation.category} • Qty: {donation.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(donation.status)}
                    {donation.status === 'available' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDonation(donation.donation_id)}
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

      {/* Browse Open Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Available Requests</CardTitle>
          <CardDescription>Browse requests from organizations</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No open requests at the moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.request_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{request.item_name}</p>
                    <p className="text-sm text-gray-600">
                      {request.category} • Qty: {request.quantity}
                    </p>
                    <p className="text-sm text-green-600">
                      {request.organizations_d9b92013?.org_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {donations.some(
                      (d) =>
                        d.status === 'available' &&
                        d.category === request.category
                    ) && (
                      <select
                        className="border rounded-md p-2 text-sm"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleMatchDonation(
                              parseInt(e.target.value),
                              request.request_id
                            );
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Match with my donation</option>
                        {donations
                          .filter(
                            (d) =>
                              d.status === 'available' &&
                              d.category === request.category
                          )
                          .map((d) => (
                            <option key={d.donation_id} value={d.donation_id}>
                              {d.item_name} (Qty: {d.quantity})
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Matches */}
      <Card>
        <CardHeader>
          <CardTitle>My Matches</CardTitle>
          <CardDescription>Your donations that have been matched</CardDescription>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No matches yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <div
                  key={match.match_id}
                  className="p-4 border rounded-lg bg-green-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-green-800">Match #{match.match_id}</p>
                    <Badge className="bg-green-600">Matched</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Your Donation:</p>
                      <p className="font-medium">
                        {match.donations_d9b92013?.item_name}
                      </p>
                      <p className="text-gray-600">
                        Qty: {match.donations_d9b92013?.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Organization:</p>
                      <p className="font-medium">
                        {match.requests_d9b92013?.organizations_d9b92013?.org_name}
                      </p>
                      <p className="text-gray-600">
                        Requested: {match.requests_d9b92013?.item_name}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Matched on: {new Date(match.match_date).toLocaleDateString()}
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
