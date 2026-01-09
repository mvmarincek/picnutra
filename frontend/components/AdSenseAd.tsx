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
  format?: 'horizontal' | 'rectangle' | 'auto';
}

const AD_SLOTS = ['5278243728'];

export default function AdSenseAd({ slot, className = '', format = 'horizontal' }: AdSenseAdProps) {
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

  const getAdStyle = () => {
    switch (format) {
      case 'horizontal':
        return { display: 'inline-block', width: '100%', maxWidth: '728px', height: '90px' };
      case 'rectangle':
        return { display: 'inline-block', width: '300px', height: '250px' };
      default:
        return { display: 'block' };
    }
  };

  const getContainerStyle = () => {
    switch (format) {
      case 'horizontal':
        return { minHeight: adLoaded ? '90px' : '0px', maxHeight: '100px' };
      case 'rectangle':
        return { minHeight: adLoaded ? '250px' : '0px' };
      default:
        return { minHeight: adLoaded ? '100px' : '0px' };
    }
  };

  return (
    <div 
      className={`ad-container flex justify-center ${className}`} 
      style={{ 
        ...getContainerStyle(),
        width: '100%',
        overflow: 'hidden',
        transition: 'min-height 0.3s'
      }}
    >
      <ins
        className="adsbygoogle"
        style={getAdStyle()}
        data-ad-client="ca-pub-3364979853180818"
        data-ad-slot={selectedSlot}
        data-ad-format={format === 'auto' ? 'auto' : undefined}
        data-full-width-responsive={format === 'auto' ? 'true' : 'false'}
      />
    </div>
  );
}
