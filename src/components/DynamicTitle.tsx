// YOL: src/components/DynamicTitle.tsx

"use client";

import { useEffect } from 'react';

type DynamicTitleProps = {
  activeTitle: string;
  inactiveTitle: string;
};

export default function DynamicTitle({ activeTitle, inactiveTitle }: DynamicTitleProps) {
  useEffect(() => {
    // Başlangıçta başlığı ayarla
    document.title = activeTitle;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        document.title = inactiveTitle;
      } else {
        document.title = activeTitle;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Component kaldırıldığında event listener'ı temizle
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTitle, inactiveTitle]);

  return null; // Bu bileşen ekrana bir şey çizmez
}