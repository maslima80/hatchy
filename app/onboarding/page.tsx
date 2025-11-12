'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { COUNTRIES, getCurrencyForCountry } from '@/lib/currency';
import { Check } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // User data
  const [name, setName] = useState('');
  const [country, setCountry] = useState('US');
  const [currency, setCurrency] = useState('USD');
  const [contactEmail, setContactEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  // Auto-set currency when country changes
  useEffect(() => {
    setCurrency(getCurrencyForCountry(country));
  }, [country]);

  const handleStep1Next = async () => {
    if (!name || name.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (!contactEmail) {
      setError('Contact email is required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      setError('Please enter a valid email');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, country, currency, contactEmail, whatsapp, phone }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      setStep(2);
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleFinish = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complete: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('Failed to complete onboarding. Please try again.');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8F9FF] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl">🐣</div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F9FF] to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">🐣</span>
            <span className="text-2xl font-bold text-[#6C5CE7]">Hatchy</span>
          </div>
          <h1 className="text-3xl font-bold text-[#111] mb-2">Welcome aboard!</h1>
          <p className="text-gray-600">Let's set up your account in 2 quick steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center max-w-xs mx-auto">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    s < step
                      ? 'bg-[#6C5CE7] text-white'
                      : s === step
                      ? 'bg-[#6C5CE7] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 2 && (
                  <div
                    className={`w-24 h-1 mx-2 ${
                      s < step ? 'bg-[#6C5CE7]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-xs mx-auto mt-2 text-xs text-gray-600">
            <span>Your Info</span>
            <span>Review</span>
          </div>
        </div>

        {/* Step Content */}
        <Card>
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>Tell us about yourself</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      disabled={loading}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Input
                      id="currency"
                      value={currency}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp (optional)</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="+1234567890"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">For customer support</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleStep1Next}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Saving...' : 'Next'}
                  </Button>
                </div>
              </CardContent>
            </>
          )}


          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Review & Confirm</CardTitle>
                <CardDescription>Everything look good?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">Personal Info</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Name:</span>
                        <span className="font-medium">{name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Country:</span>
                        <span className="font-medium">
                          {COUNTRIES.find((c) => c.code === country)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Currency:</span>
                        <span className="font-medium">{currency}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">Contact</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="font-medium">{contactEmail}</span>
                      </div>
                      {whatsapp && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">WhatsApp:</span>
                          <span className="font-medium">{whatsapp}</span>
                        </div>
                      )}
                      {phone && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Phone:</span>
                          <span className="font-medium">{phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Finishing...' : 'Finish & Go to Dashboard'}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
