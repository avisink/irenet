import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { api, Request, Donation, Match } from '../utils/api';
import { Plus, FileText, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function OrganizationDashboard() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New request form
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!accessToken) return;

    try {
      const [requestsData, donationsData, matchesData] = await Promise.all([
        api.getMyRequests(accessToken),
        api.getDonations('available'),
        api.getMyMatches(accessToken),
      ]);

      setRequests(requestsData);
      setDonations(donationsData);
      setMatches(matchesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    }
  }

  async function handleCreateRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.createRequest(accessToken, {
        item_name: itemName,
        category,
        quantity: parseInt(quantity),
      });

      setSuccess('Request created successfully!');
      setShowRequestDialog(false);
      setItemName('');
      setCategory('');
      setQuantity('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRequest(id: number) {
    if (!accessToken || !confirm('Are you sure you want to delete this request?')) return;

    try {
      await api.deleteRequest(accessToken, id);
      setSuccess('Request deleted successfully');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete request');
    }
  }

  async function handleMatchRequest(requestId: number, donationId: number) {
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
      open: { variant: 'default', icon: Clock, color: 'bg-blue-100 text-blue-800' },
      matched: { variant: 'secondary', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      fulfilled: { variant: 'default', icon: CheckCircle, color: 'bg-purple-100 text-purple-800' },
      cancelled: { variant: 'destructive', icon: AlertCircle, color: 'bg-red-100 text-red-800' },
    };

    const config = variants[status] || variants.open;
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

      {/* My Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Requests</CardTitle>
              <CardDescription>Manage your food requests</CardDescription>
            </div>
            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Request</DialogTitle>
                  <DialogDescription>Request food items you need</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRequest} className="space-y-4">
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
                    <Label htmlFor="quantity">Quantity Needed</Label>
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
                    {loading ? 'Creating...' : 'Create Request'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="size-12 mx-auto mb-3 opacity-50" />
              <p>No requests yet. Create your first request!</p>
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
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(request.status)}
                    {request.status === 'open' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRequest(request.request_id)}
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

      {/* Browse Available Donations */}
      <Card>
        <CardHeader>
          <CardTitle>Available Donations</CardTitle>
          <CardDescription>Browse donations from donors</CardDescription>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No available donations at the moment</p>
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
                    {requests.some(
                      (r) =>
                        r.status === 'open' &&
                        r.category === donation.category
                    ) && (
                      <select
                        className="border rounded-md p-2 text-sm"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleMatchRequest(
                              parseInt(e.target.value),
                              donation.donation_id
                            );
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">Match with my request</option>
                        {requests
                          .filter(
                            (r) =>
                              r.status === 'open' &&
                              r.category === donation.category
                          )
                          .map((r) => (
                            <option key={r.request_id} value={r.request_id}>
                              {r.item_name} (Qty: {r.quantity})
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
          <CardDescription>Your requests that have been matched</CardDescription>
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
                    <p className="font-medium text-green-800">Fulfilled Request</p>
                    <Badge className="bg-green-600">Matched</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Your Request:</p>
                      <p className="font-medium">
                        {match.requests_d9b92013?.item_name}
                      </p>
                      <p className="text-gray-600">
                        Qty: {match.requests_d9b92013?.quantity}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Donation:</p>
                      <p className="font-medium">
                        {match.donations_d9b92013?.item_name}
                      </p>
                      <p className="text-gray-600">
                        Qty: {match.donations_d9b92013?.quantity}
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
