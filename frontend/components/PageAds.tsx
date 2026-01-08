'use client';

import { useAuth } from '@/lib/auth';
import AdSenseAd from './AdSenseAd';

const AD_SLOTS = {
  HISTORY: '5278243728',
  RESULT: '5278243728',
  ABOUT: '5278243728',
  PROFILE: '5278243728',
};

type AllowedSlot = 'HISTORY' | 'RESULT' | 'ABOUT' | 'PROFILE';

interface PageAdsProps {
  slot: AllowedSlot;
  position?: 'inline' | 'bottom';
}

export default function PageAds({ slot, position = 'inline' }: PageAdsProps) {
  const { user } = useAuth();
  
  if (user?.plan !== 'free') {
    return null;
  }

  const slotId = AD_SLOTS[slot];
  if (!slotId) return null;

  if (position === 'bottom') {
    return (
      <div className="mt-8 mb-4 px-2">
        <div className="bg-gray-50 rounded-xl p-2">
          <p className="text-xs text-gray-400 text-center mb-2">Publicidade</p>
          <AdSenseAd 
            slot={slotId} 
            format="horizontal"
            className="rounded-lg overflow-hidden"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 px-2">
      <div className="bg-gray-50 rounded-xl p-2">
        <p className="text-xs text-gray-400 text-center mb-2">Publicidade</p>
        <AdSenseAd 
          slot={slotId} 
          format="rectangle"
          className="rounded-lg overflow-hidden"
        />
      </div>
    </div>
  );
}
