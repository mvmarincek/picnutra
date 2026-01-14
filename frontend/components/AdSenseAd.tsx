'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseAdProps {
  slot?: string;
  className?: string;
}

const AD_SLOTS = ['5278243728'];

export default function AdSenseAd({ slot, className = '' }: AdSenseAdProps) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [selectedSlot] = useState(() => slot || AD_SLOTS[Math.floor(Math.random() * AD_SLOTS.length)]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`ad-container flex justify-center ${className}`} 
      style={{ 
        minHeight: adLoaded ? '90px' : '0px',
        maxHeight: '120px',
        width: '100%',
        overflow: 'hidden',
        transition: 'min-height 0.3s'
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '90px' }}
        data-ad-client="ca-pub-3364979853180818"
        data-ad-slot={selectedSlot}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}
