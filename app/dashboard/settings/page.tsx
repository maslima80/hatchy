import { getSession, getUserProfile } from '@/lib/auth';
import { db } from '@/lib/db';
import { payoutAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { COUNTRIES } from '@/lib/currency';
import { PayoutsCard } from './components/PayoutsCard';
import { PrintifyIntegration } from './components/PrintifyIntegration';

export default async function SettingsPage() {
  const session = await getSession();
  const profile = await getUserProfile(session!.user.id);

  // Fetch payout account
  const [payoutAccount] = await db
    .select()
    .from(payoutAccounts)
    .where(eq(payoutAccounts.userId, session!.user.id))
    .limit(1);

  const countryName = COUNTRIES.find((c) => c.code === profile?.country)?.name || profile?.country;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#111]">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Payouts */}
      <PayoutsCard account={payoutAccount || null} />

      {/* Printify Integration */}
      <PrintifyIntegration />

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your account details from onboarding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Name</p>
              <p className="text-sm text-gray-900">{profile?.name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Country</p>
              <p className="text-sm text-gray-900">{countryName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Default Currency</p>
              <p className="text-sm text-gray-900">{profile?.currency || 'Not set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>How customers can reach you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Contact Email</p>
            <p className="text-sm text-gray-900">{profile?.contactEmail || 'Not set'}</p>
          </div>
          {profile?.whatsapp && (
            <div>
              <p className="text-sm font-medium text-gray-700">WhatsApp</p>
              <p className="text-sm text-gray-900">{profile.whatsapp}</p>
            </div>
          )}
          {profile?.phone && (
            <div>
              <p className="text-sm font-medium text-gray-700">Phone</p>
              <p className="text-sm text-gray-900">{profile.phone}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm font-medium text-gray-700">Email</p>
            <p className="text-sm text-gray-900">{session?.user.email}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
