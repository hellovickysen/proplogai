"use client";

import ShareButton from '@/components/ShareButton';

export default function DashboardShareButton({ data }) {
  return <ShareButton type="daily" data={data} />;
}
