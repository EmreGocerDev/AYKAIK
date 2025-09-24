// YOL: src/components/ParallaxBackground.tsx

"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getParallaxLayers } from '@/app/actions'; // Yeni action'ı import ediyoruz

// Katmanlarımızın tipini tanımlıyoruz
type ParallaxLayer = {
  src: string;
  factor: number;
  zIndex: number;
};

// Bileşen artık hangi klasörü kullanacağını prop olarak alacak
type ParallaxBackgroundProps = {
  folderName: string;
};

export default function ParallaxBackground({ folderName }: ParallaxBackgroundProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // Katmanları artık bir state içinde tutacağız
  const [layers, setLayers] = useState<ParallaxLayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Component yüklendiğinde veya folderName değiştiğinde katmanları sunucudan çek
  useEffect(() => {
    const fetchLayers = async () => {
      setLoading(true);
      const fetchedLayers = await getParallaxLayers(folderName);
      setLayers(fetchedLayers);
      setLoading(false);
    };

    fetchLayers();
  }, [folderName]);

  // Fare hareketlerini dinlemek için olan useEffect aynı kalıyor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  if (loading) {
    // Veri yüklenirken boş bir arkaplan göster
    return <div className="fixed inset-0 bg-black z-0"></div>;
  }
  
  return (
    <div className="fixed inset-0 overflow-hidden z-0">
      {layers.map((layer, index) => { // Hard-coded dizi yerine state'i map'liyoruz
        const translateX = (position.x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * layer.factor;
        const translateY = (position.y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * layer.factor;

        return (
          <Image
            key={layer.src} // Key olarak index yerine benzersiz src kullanmak daha iyi
            src={layer.src}
            alt={`Parallax layer ${index + 1}`}
            fill
            className="object-contain transition-transform duration-100 ease-linear"
            style={{
              zIndex: layer.zIndex,
              transform: `scale(1.15) translate(${translateX}px, ${translateY}px)`,
            }}
            priority={index < 2}
          />
        );
      })}
    </div>
  );
}