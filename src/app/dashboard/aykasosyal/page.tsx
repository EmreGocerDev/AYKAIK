"use client";

import GlassCard from "@/components/GlassCard";
import { useSettings } from "@/contexts/SettingsContext";
import { Send, FileText, CalendarPlus, Filter } from "lucide-react";
import { useEffect, useState, useTransition, useRef, useCallback } from "react";
import { createSocialPost, createSocialEvent, getSocialFeed, getCurrentSocialUserId } from "@/app/aykasosyal/actions";
import PostCard, { SocialPost } from "@/components/aykasosyal/PostCard";
import toast from "react-hot-toast";
import type { Region } from "@/types/index";

export default function AykaSosyalPage() {
    const { supabase, tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPosting, startPostingTransition] = useTransition();
    const [postType, setPostType] = useState<'text' | 'event'>('text');
    const formRef = useRef<HTMLFormElement>(null);
    const [regions, setRegions] = useState<Region[]>([]);
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            const [regionsData, userIdData] = await Promise.all([
                supabase.from('regions').select('id, name').order('name'),
                getCurrentSocialUserId()
            ]);
            if (regionsData.data) setRegions(regionsData.data);
            if (userIdData) setCurrentUserId(userIdData);
        };
        fetchInitialData();
    }, [supabase]);

    const loadFeed = useCallback(async (regionId: string) => {
        setLoading(true);
        const feedPosts = await getSocialFeed(regionId);
        setPosts(feedPosts as SocialPost[]);
        setLoading(false);
    }, []);
    
    useEffect(() => {
        loadFeed(selectedRegion);
    }, [selectedRegion, loadFeed]);

    const handleFormSubmit = async (formData: FormData) => {
        const actionToCall = postType === 'text' ? createSocialPost : createSocialEvent;
        startPostingTransition(async () => {
            const result = await actionToCall(formData);
            if (result.success) {
                toast.success(result.message || "Paylaşım başarılı!");
                formRef.current?.reset();
                await loadFeed(selectedRegion); 
            } else {
                toast.error(result.message || "Paylaşım başarısız.");
            }
        });
    };

    return (
        <div className="p-4 md:p-8 text-white">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">AykaSosyal Akışı</h1>
                </div>

                <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }} className="mb-6 !p-4">
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-gray-400"/>
                        <label htmlFor="region-filter" className="font-semibold text-white">Bölgeye Göre Filtrele:</label>
                        <select
                            id="region-filter"
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="bg-black/20 py-2 px-4 rounded-lg border border-white/10 w-full md:w-auto"
                        >
                            <option value="all">Tüm Bölgeler</option>
                            {regions.map(region => (
                                <option key={region.id} value={region.id}>{region.name}</option>
                            ))}
                        </select>
                    </div>
                </GlassCard>
                
                <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }} className="mb-8">
                    <form action={handleFormSubmit} ref={formRef}>
                         <div className="flex items-center gap-2 mb-3">
                            <button type="button" onClick={() => setPostType('text')} className={`px-4 py-2 text-sm rounded-full flex items-center gap-2 ${postType === 'text' ? 'bg-cyan-600 text-white' : 'bg-black/20 text-gray-300'}`}> <FileText size={16}/> Yazı Paylaş </button>
                            <button type="button" onClick={() => setPostType('event')} className={`px-4 py-2 text-sm rounded-full flex items-center gap-2 ${postType === 'event' ? 'bg-cyan-600 text-white' : 'bg-black/20 text-gray-300'}`}> <CalendarPlus size={16}/> Etkinlik Oluştur </button>
                        </div>
                        {postType === 'event' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 animate-in fade-in duration-300">
                                <input name="title" required placeholder="Etkinlik Başlığı" className="w-full bg-black/20 p-3 rounded-lg border border-white/10" />
                                <input name="event_datetime" required type="datetime-local" className="w-full bg-black/20 p-3 rounded-lg border border-white/10 [color-scheme:dark]" />
                                <input name="location" placeholder="Konum (Opsiyonel)" className="w-full sm:col-span-2 bg-black/20 p-3 rounded-lg border border-white/10" />
                            </div>
                        )}
                        <textarea name="content" placeholder={postType === 'text' ? "Aklınızdan ne geçiyor?" : "Etkinlik hakkında bir açıklama yazın..."}
                            className="w-full bg-black/20 p-3 rounded-lg border border-white/10" rows={3} maxLength={280} required />
                        <div className="flex justify-end items-center mt-3">
                            <button type="submit" className="flex items-center gap-2 bg-cyan-600 px-4 py-2 rounded-lg hover:bg-cyan-700 disabled:opacity-50" disabled={isPosting}>
                                <Send size={16} /> {isPosting ? 'Paylaşılıyor...' : 'Paylaş'}
                            </button>
                        </div>
                    </form>
                </GlassCard>

                {loading ? (
                    <div className="text-center text-gray-400 py-10">Akış yükleniyor...</div>
                ) : (
                    <div className="space-y-6">
                        {posts.length > 0 ? (
                            posts.map(post => (
                                <GlassCard key={post.post_id} {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }}>
                                    <PostCard 
                                        post={post} 
                                        currentUserId={currentUserId}
                                        onActionSuccess={() => loadFeed(selectedRegion)} 
                                    />
                                </GlassCard>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 py-10"> <p>Bu bölgede hiç gönderi paylaşılmamış.</p> <p>İlk gönderiyi sen paylaş!</p> </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}