'use client';

import dynamic from 'next/dynamic';

const SearchBar = dynamic(() => import('./SearchBar'), {
  ssr: false,
  loading: () => (
    <div className="relative flex-1 max-w-[600px] mx-auto hidden sm:block">
      <div className="w-full h-9 bg-white/[0.04] border border-white/[0.08] rounded-[10px]" />
    </div>
  ),
});

export default function LazySearchBar(props) {
  return <SearchBar {...props} />;
}
