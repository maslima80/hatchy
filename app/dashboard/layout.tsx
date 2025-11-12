import { redirect } from 'next/navigation';
import { getSession, getUserProfile } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/signin');
  }

  // Check if onboarding is complete
  const profile = await getUserProfile(session.user.id);
  
  if (!profile || !profile.onboardingCompleted) {
    redirect('/onboarding');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
