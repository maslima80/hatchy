'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Shop {
  id: number;
  title: string;
}

export function PrintifyIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [shops, setShops] = useState<Shop[]>([]);
  const [defaultShopId, setDefaultShopId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load existing connection on mount
  useEffect(() => {
    loadConnection();
  }, []);

  const loadConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/printify/shops');
      
      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        setShops(data.shops || []);
        setDefaultShopId(data.defaultShopId || '');
        setMaskedKey('••••••••••••••••');
      } else if (response.status === 404) {
        // No connection yet
        setIsConnected(false);
      }
    } catch (err) {
      console.error('Failed to load connection:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your Printify API key');
      return;
    }

    setTesting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/integrations/printify/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsConnected(true);
        setShops(data.shops || []);
        setDefaultShopId(data.defaultShopId || '');
        setMaskedKey('••••••••••••••••');
        setApiKey('');
        setEditing(false);
        setSuccess(data.message || 'Connected successfully!');
      } else {
        setError(data.error || 'Failed to connect');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setTesting(false);
    }
  };

  const handleSetDefaultShop = async (shopId: string) => {
    try {
      const response = await fetch('/api/integrations/printify/set-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId }),
      });

      if (response.ok) {
        setDefaultShopId(shopId);
        setSuccess('Default shop updated');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to update default shop');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Printify Integration</CardTitle>
          <CardDescription>Connect your Printify account to import POD products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Printify Integration</CardTitle>
        <CardDescription>
          Connect your Printify account to import POD products into your Hatchy catalog
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        {isConnected && !editing && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-900">Connected to Printify</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-900">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-900">{success}</span>
          </div>
        )}

        {/* Not Connected - Show API Key Input */}
        {!isConnected && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">Printify API Key</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Get your API key from{' '}
                <a
                  href="https://printify.com/app/account/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Printify Settings → API
                </a>
              </p>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your Printify API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
            </div>
            <Button onClick={handleConnect} disabled={testing || !apiKey.trim()}>
              {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Test & Save
            </Button>
          </div>
        )}

        {/* Connected - Show Shops and Settings */}
        {isConnected && (
          <div className="space-y-4">
            {/* API Key (masked) */}
            {!editing && (
              <div>
                <Label>API Key</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="password" value={maskedKey} disabled className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    Update
                  </Button>
                </div>
              </div>
            )}

            {/* Edit API Key */}
            {editing && (
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div>
                  <Label htmlFor="newApiKey">New API Key</Label>
                  <Input
                    id="newApiKey"
                    type="password"
                    placeholder="Enter new Printify API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleConnect} disabled={testing || !apiKey.trim()}>
                    {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save & Test
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setApiKey('');
                      setError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Shop Selector */}
            {shops.length > 0 && (
              <div>
                <Label htmlFor="defaultShop">Default Shop</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Products will be imported from this shop by default
                </p>
                <Select
                  value={defaultShopId}
                  onValueChange={handleSetDefaultShop}
                >
                  <SelectTrigger id="defaultShop">
                    <SelectValue placeholder="Select a shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={String(shop.id)}>
                        {shop.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Shop Count Badge */}
            {shops.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{shops.length} shop{shops.length !== 1 ? 's' : ''} available</Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
