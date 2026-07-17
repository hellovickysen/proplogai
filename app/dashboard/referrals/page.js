import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * The Referrals section was rebranded to "Rewards" (Refer a friend + Partners).
 * Keep this route as a permanent redirect so old links, bookmarks, and the
 * sidebar Credits links continue to work.
 */
export default function ReferralsRedirect({ searchParams }) {
  const tab = searchParams?.tab ? `?tab=${encodeURIComponent(searchParams.tab)}` : '';
  redirect(`/dashboard/rewards${tab}`);
}
