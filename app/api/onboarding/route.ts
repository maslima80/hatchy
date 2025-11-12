import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, country, currency, contactEmail, whatsapp, phone, complete } = body;

    // Update profile
    await db
      .update(profiles)
      .set({
        name: name || undefined,
        country: country || undefined,
        currency: currency || undefined,
        contactEmail: contactEmail || undefined,
        whatsapp: whatsapp || undefined,
        phone: phone || undefined,
        onboardingCompleted: complete || false,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding update error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
