'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

type PayoutAccount = {
  id: string;
  stripeAccountId: string;
  country: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  lastEventAt: Date | null;
  lastEventType: string | null;
} | null;

type PayoutsCardProps = {
  account: PayoutAccount;
};

export function PayoutsCard({ account }: PayoutsCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSetupPayouts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create onboarding link');
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/express-login', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create login link');
      }

      // Open Stripe Express dashboard in new tab
      window.open(data.url, '_blank');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/stripe/refresh-status', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refresh status');
      }

      setSuccessMessage('Status refreshed successfully');
      
      // Refresh the page to show updated data
      router.refresh();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderStatusBadge = (enabled: boolean, label: string) => {
    return (
      <div className="flex items-center gap-2">
        {enabled ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-600" />
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
              {label}
            </Badge>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-gray-400" />
            <Badge variant="outline" className="text-gray-600">
              {label}
            </Badge>
          </>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payouts</CardTitle>
        <CardDescription>Connect your Stripe account to receive payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!account ? (
          // State 1: No account - Setup required
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Get paid for your sales</h4>
              <p className="text-sm text-blue-800 mb-4">
                Connect with Stripe to accept payments and receive payouts directly to your bank account.
              </p>
              <ul className="text-sm text-blue-800 space-y-1 mb-4">
                <li>✓ Secure payment processing</li>
                <li>✓ Fast payouts to your bank</li>
                <li>✓ Fraud protection included</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">{error}</div>
            )}

            <Button onClick={handleSetupPayouts} disabled={isLoading} className="w-full">
              {isLoading ? 'Redirecting...' : 'Set up payouts'}
            </Button>
          </div>
        ) : !account.detailsSubmitted ? (
          // State 2: Account exists but onboarding incomplete
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900 mb-1">Complete your setup</h4>
                  <p className="text-sm text-yellow-800">
                    You started setting up payouts but didn't finish. Complete the process to start accepting payments.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Account Status:</div>
              <div className="flex flex-wrap gap-3">
                {renderStatusBadge(account.detailsSubmitted, 'Details Submitted')}
                {renderStatusBadge(account.chargesEnabled, 'Charges Enabled')}
                {renderStatusBadge(account.payoutsEnabled, 'Payouts Enabled')}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">{error}</div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                {successMessage}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSetupPayouts} disabled={isLoading || isRefreshing} className="flex-1">
                {isLoading ? 'Redirecting...' : 'Resume setup'}
              </Button>
              <Button
                onClick={handleRefreshStatus}
                disabled={isLoading || isRefreshing}
                variant="outline"
                size="icon"
                title="Refresh status from Stripe"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        ) : (
          // State 3: Fully onboarded
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Payouts connected</h4>
                  <p className="text-sm text-green-800">
                    Your Stripe account is fully set up. You can now accept payments and receive payouts.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Account Status:</div>
              <div className="flex flex-wrap gap-3">
                {renderStatusBadge(account.detailsSubmitted, 'Details Submitted')}
                {renderStatusBadge(account.chargesEnabled, 'Charges Enabled')}
                {renderStatusBadge(account.payoutsEnabled, 'Payouts Enabled')}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <div className="text-xs text-gray-500">
                <div>Account ID: {account.stripeAccountId}</div>
                <div>Country: {account.country}</div>
                {account.lastEventAt && (
                  <div>Last updated: {new Date(account.lastEventAt).toLocaleString()}</div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">{error}</div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                {successMessage}
              </div>
            )}

            <div className="space-y-2">
              <Button onClick={handleOpenDashboard} disabled={isLoading || isRefreshing} variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                {isLoading ? 'Opening...' : 'Open Stripe dashboard'}
              </Button>
              <Button
                onClick={handleRefreshStatus}
                disabled={isLoading || isRefreshing}
                variant="ghost"
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh status'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
