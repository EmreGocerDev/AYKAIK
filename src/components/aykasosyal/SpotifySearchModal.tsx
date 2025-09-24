// YOL: src/components/aykasosyal/SpotifySearchModal.tsx

"use client";

import { useState, useEffect } from 'react';
import { searchSpotifyTracks } from '@/app/aykasosyal/actions';
import { X, Search, Music } from 'lucide-react';
import Image from 'next/image';
import GlassCard from '../GlassCard';
import { useSettings } from '@/contexts/SettingsContext'; // <-- 1. ADIM: useSettings hook'u import edildi

type Track = {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
};
type ModalProps = {
  onClose: () => void;
  onTrackSelect: (trackId: string) => void;
};
export default function SpotifySearchModal({ onClose, onTrackSelect }: ModalProps) {
  // 2. ADIM: Ayarlar hook'tan alındı
  const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings(); 
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim().length > 2) {
        setLoading(true);
        setError(null);
        searchSpotifyTracks(query).then(res => {
          if (res.success) {
            setResults(res.data);
          } else {
            setError(res.message || "Arama başarısız.");
            setResults([]); //
          }
          setLoading(false);
        });
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [query]);
  const handleSelect = (trackId: string) => {
    onTrackSelect(trackId);
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-modal-open">
      {/* 3. ADIM: Ayarlar GlassCard'a prop olarak eklendi */}
      <GlassCard 
        {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}
        className="w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2"><Music /> Spotify da Şarkı Ara</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X /></button>
        </div>

        <div className="relative flex-shrink-0 mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Şarkı veya sanatçı adı..."
            className="w-full bg-black/20 p-3 pl-10 rounded-lg border border-white/10"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
          {loading && <p className="text-center text-gray-400">Aranıyor...</p>}
          {error && <p className="text-center text-red-400">{error}</p>}
          {!loading && results.map(track => (
            <button
              key={track.id}
              onClick={() => handleSelect(track.id)}
              className="w-full flex items-center gap-4 p-2 rounded-lg hover:bg-white/10 text-left"
            >
              <Image src={track.albumArt} alt={track.name} width={48} height={48} className="w-12 h-12 rounded" />
              <div>
                <p className="font-semibold text-white">{track.name}</p>
                <p className="text-sm text-gray-400">{track.artist}</p>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}