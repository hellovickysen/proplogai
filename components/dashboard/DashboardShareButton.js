"use client";

import ShareButton from '@/components/share/ShareButton';

export default function DashboardShareButton({ data, type = 'daily' }) {
  return <ShareButton type={type} data={data} />;
}
