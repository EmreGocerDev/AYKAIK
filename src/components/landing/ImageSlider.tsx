// YOL: src/components/landing/ImageSlider.tsx

"use client";

import Image from "next/image";

export default function ImageSlider() {
  return (
    // DÜZELTME: "-z-10" sınıfı "z-0" olarak değiştirildi.
    // Bu, görselin sayfa arkaplanının arkasına gizlenmesini engeller.
    <div className="absolute top-0 left-0 w-full h-screen z-0">
      <Image
        src="/bg1.jpg"
        alt="Ayka Matrix Landing Page Background"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
}