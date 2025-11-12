import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { payoutAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createExpressLoginLink } from '@/lib/payouts';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's payout account
    const [account] = await db
      .select()
      .from(payoutAccounts)
      .where(eq(payoutAccounts.userId, session.user.id))
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: 'No payout account found. Please complete onboarding first.' }, { status: 404 });
    }

    // Create Express dashboard login link
    const loginUrl = await createExpressLoginLink(account.stripeAccountId);

    return NextResponse.json({ url: loginUrl });
  } catch (error: any) {
    console.error('Express login error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create login link' }, { status: 500 });
  }
}
