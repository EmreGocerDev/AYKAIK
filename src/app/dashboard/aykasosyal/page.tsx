// YOL: src/app/dashboard/aykasosyal/page.tsx

"use client";

import GlassCard from "@/components/GlassCard";
import { useSettings } from "@/contexts/SettingsContext";
import { Send, FileText, CalendarPlus, Filter, ImagePlus, X } from "lucide-react";
import { useEffect, useState, useTransition, useRef, useCallback, ChangeEvent } from "react";
import { createSocialPost, createSocialEvent, getSocialFeed, getCurrentSocialUserId } from "@/app/aykasosyal/actions";
import PostCard, { SocialPost } from "@/components/aykasosyal/PostCard";
import toast from "react-hot-toast";
import type { Region } from "@/types/index";
import imageCompression from 'browser-image-compression';
import Image from "next/image";

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

    // Resim dosyası ve önizlemesi için state'ler
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Resim seçildiğinde çalışan fonksiyon
    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Seçilen resmi kaldıran fonksiyon
    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Form gönderimini yöneten fonksiyon (Resim yükleme ve optimizasyon dahil)
    const handleFormSubmit = async (formData: FormData) => {
        startPostingTransition(async () => {
            let imageUrl: string | null = null;

            // 1. Eğer resim seçildiyse, optimize et ve yükle
            if (imageFile) {
                const options = {
                    maxSizeMB: 1, // Max dosya boyutu 1MB
                    maxWidthOrHeight: 1280, // En uzun kenar max 1280px
                    useWebWorker: true,
                };
                try {
                    const compressedFile = await imageCompression(imageFile, options);
                    
                    const filePath = `${currentUserId}/${Date.now()}_${compressedFile.name}`;
                    
                    const { data, error: uploadError } = await supabase.storage
                        .from('social_posts')
                        .upload(filePath, compressedFile);

                    if (uploadError) {
                        throw new Error(`Resim yüklenemedi: ${uploadError.message}`);
                    }
                    
                    // Yüklenen resmin public URL'ini al
                    const { data: { publicUrl } } = supabase.storage
                        .from('social_posts')
                        .getPublicUrl(data.path);
                    
                    imageUrl = publicUrl;

                } catch (error) {
                    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
                    toast.error(message);
                    return;
                }
            }
            
            // 2. FormData'ya resim URL'ini ekle (varsa)
            if (imageUrl) {
                formData.append('image_url', imageUrl);
            }

            // 3. Gönderiyi oluşturmak için action'ı çağır
            const actionToCall = postType === 'text' ? createSocialPost : createSocialEvent;
            const result = await actionToCall(formData);

            if (result.success) {
                toast.success(result.message || "Paylaşım başarılı!");
                formRef.current?.reset();
                removeImage(); // Formu ve resmi temizle
                await loadFeed(selectedRegion);
            } else {
                toast.error(result.message || "Paylaşım başarısız.");
            }
        });
    };

    const handlePostUpdate = useCallback((updatedPost: SocialPost) => {
        setPosts(currentPosts => currentPosts.map(p => p.post_id === updatedPost.post_id ? updatedPost : p));
    }, []);

    const handlePostDelete = useCallback((postId: number) => {
        setPosts(currentPosts => currentPosts.filter(p => p.post_id !== postId));
    }, []);

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
                        
                        {/* Resim Önizleme Alanı */}
                        {imagePreview && (
                            <div className="mt-4 relative">
                                <Image src={imagePreview} alt="Önizleme" width={500} height={500} className="rounded-lg w-full h-auto max-h-96 object-contain" />
                                <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white hover:bg-black/80">
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-3">
                            {/* Resim Ekleme Butonu */}
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-cyan-400 hover:bg-white/10 rounded-full" title="Resim Ekle">
                                <ImagePlus size={20} />
                            </button>
                            
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
                                        onPostUpdate={handlePostUpdate}
                                        onPostDelete={handlePostDelete}
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