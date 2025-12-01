import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { AlertCircle, FileText, Trash2 } from 'lucide-react';

export function MyRequests() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    if (!accessToken) return;

    setLoading(true);
    setError('');
    try {
      const data = await api.getMyRequests(accessToken);
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRequest(requestId: number) {
    if (!accessToken || !confirm('Are you sure you want to delete this request?')) return;

    setError('');
    setLoading(true);
    try {
      await api.deleteRequest(accessToken, requestId);
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete request');
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

      <Card className="shadow-md border border-border bg-card text-card-foreground">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg p-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="size-6" />
            My Requests
          </CardTitle>
          <CardDescription className="text-gray-100">
            View and manage your created requests. Pending requests remain visible until matched.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="size-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No requests found</p>
              <p className="text-sm mt-1">Your created requests will appear here once added.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((request) => (
                <div
                  key={request.request_id}
                  className="p-5 border rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-secondary dark:to-muted transition hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="size-5 text-blue-600 dark:text-blue-400" />
                      <p className="font-medium text-foreground">
                        Request #{request.request_id}
                      </p>
                    </div>
                    <Badge
                      className={
                        request.status === 'matched'
                          ? 'bg-green-600 text-white'
                          : 'bg-yellow-500 text-white'
                      }
                    >
                      {request.status === 'matched' ? 'Matched' : 'Pending'}
                    </Badge>
                  </div>

                  <div className="bg-white dark:bg-secondary rounded-lg p-3 mb-3 shadow-sm">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {request.item_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Category: {request.category}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Quantity: {request.quantity}
                    </p>
                    {request.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Notes: {request.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created on: {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRequest(request.request_id)}
                      disabled={loading}
                      className="bg-destructive hover:bg-red-700 text-destructive-foreground"
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete
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
