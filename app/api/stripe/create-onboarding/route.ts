import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrCreateConnectAccount, createOnboardingLink } from '@/lib/payouts';
import { isCountrySupported } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { country } = body;

    // Validate country if provided
    if (country && !isCountrySupported(country)) {
      return NextResponse.json(
        { error: `Country ${country} is not supported by Stripe Connect` },
        { status: 400 }
      );
    }

    // Get or create Connect account
    const account = await getOrCreateConnectAccount(session.user.id, country);

    // Create onboarding link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/dashboard/settings?stripe=done`;
    const refreshUrl = `${baseUrl}/dashboard/settings?stripe=resume`;

    const onboardingUrl = await createOnboardingLink(account.stripeAccountId, returnUrl, refreshUrl);

    return NextResponse.json({ url: onboardingUrl });
  } catch (error: any) {
    console.error('Create onboarding error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create onboarding link' }, { status: 500 });
  }
}
