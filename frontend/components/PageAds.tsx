'use client';

import { useAuth } from '@/lib/auth';
import AdSenseAd from './AdSenseAd';

interface PageAdsProps {
  position?: 'top' | 'bottom' | 'inline';
}

export default function PageAds({ position = 'inline' }: PageAdsProps) {
  const { user } = useAuth();
  
  if (user?.plan !== 'free') {
    return null;
  }

  return (
    <div className={`${position === 'top' ? 'mb-4' : position === 'bottom' ? 'mt-6' : 'my-4'}`}>
      <AdSenseAd />
    </div>
  );
}
