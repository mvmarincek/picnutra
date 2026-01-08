'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const ADSENSE_CLIENT_ID = 'ca-pub-3364979853180818';

interface AdSenseAdProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  className?: string;
  style?: React.CSSProperties;
}

export default function AdSenseAd({ slot, format = 'auto', className = '', style }: AdSenseAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isAdPushed = useRef(false);

  useEffect(() => {
    if (isAdPushed.current) return;
    
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && adRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isAdPushed.current = true;
        }
      } catch (err) {
        console.log('AdSense push error');
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div 
      className={`ad-container ${className}`}
      style={{ 
        minHeight: '100px',
        width: '100%',
        overflow: 'hidden',
        ...style
      }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
