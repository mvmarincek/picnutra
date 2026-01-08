'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const slotEnvMap: Record<string, string | undefined> = {
  HOME_BANNER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME,
  RESULT_BANNER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULT,
  HISTORY_BANNER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HISTORY,
  PROFILE_BANNER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_PROFILE,
  PROCESSING_BANNER: process.env.NEXT_PUBLIC_ADSENSE_SLOT_PROCESSING,
};

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
}

export default function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const slotId = slotEnvMap[slot] || slot;
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle && clientId && slotId) {
        window.adsbygoogle.push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, [clientId, slotId]);

  if (!clientId || !slotId) {
    return null;
  }

  return (
    <div className={`ad-container ${className}`} style={{ maxHeight: '33vh', overflow: 'hidden' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', maxHeight: '33vh' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="false"
      />
    </div>
  );
}
