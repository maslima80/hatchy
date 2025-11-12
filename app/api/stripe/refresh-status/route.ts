import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { payoutAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateAccountStatus } from '@/lib/payouts';

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
      return NextResponse.json({ error: 'No payout account found' }, { status: 404 });
    }

    // Manually refresh status from Stripe
    console.log('[Manual Refresh] Fetching status for account:', account.stripeAccountId);
    
    const stripeAccount = await updateAccountStatus(account.stripeAccountId, 'manual_refresh');

    console.log('[Manual Refresh] Status updated:', {
      accountId: account.stripeAccountId,
      chargesEnabled: stripeAccount.charges_enabled,
      payoutsEnabled: stripeAccount.payouts_enabled,
      detailsSubmitted: stripeAccount.details_submitted,
    });

    // Fetch updated account from database
    const [updatedAccount] = await db
      .select()
      .from(payoutAccounts)
      .where(eq(payoutAccounts.userId, session.user.id))
      .limit(1);

    return NextResponse.json({ 
      success: true,
      account: updatedAccount,
    });
  } catch (error: any) {
    console.error('[Manual Refresh] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to refresh status' }, { status: 500 });
  }
}
