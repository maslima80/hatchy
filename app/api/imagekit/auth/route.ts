import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getImageKitAuthParams } from '@/lib/imagekit';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authParams = getImageKitAuthParams();
    
    return NextResponse.json(authParams);
  } catch (error: any) {
    console.error('ImageKit auth error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get auth params' },
      { status: 500 }
    );
  }
}
