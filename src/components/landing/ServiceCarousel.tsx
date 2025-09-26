// YOL: src/components/landing/ServiceCarousel.tsx

"use client";

import { useState, useRef, ReactNode } from "react";
import DeckCard from "@/components/landing/DeckCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Service = {
  title: string;
  icon: ReactNode;
};

type CarouselProps = {
  services: Service[];
};

export default function ServiceCarousel({ services }: CarouselProps) {
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full max-w-7xl">
      {/* Sol Yön Tuşu */}
      <button 
        onClick={() => handleScroll('left')}
        className="absolute top-1/2 -translate-y-1/2 left-0 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm hidden md:block"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Kartları içeren kaydırılabilir alan */}
      <div 
        ref={scrollContainerRef}
        className="w-full flex items-center gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory p-4"
      >
        {services.map((service, index) => (
          <div key={service.title} className="flex-shrink-0 snap-center">
            <DeckCard 
              title={service.title} 
              icon={service.icon}
              isSelected={selectedServiceIndex === index}
              onClick={() => setSelectedServiceIndex(selectedServiceIndex === index ? null : index)}
            />
          </div>
        ))}
      </div>
      
      {/* Sağ Yön Tuşu */}
      <button 
        onClick={() => handleScroll('right')}
        className="absolute top-1/2 -translate-y-1/2 right-0 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm hidden md:block"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
}