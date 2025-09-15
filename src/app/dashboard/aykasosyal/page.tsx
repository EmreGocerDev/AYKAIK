"use client";

import GlassCard from "@/components/GlassCard";
import { useSettings } from "@/contexts/SettingsContext";
import { Send } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { createSocialPost, getSocialFeed } from "@/app/aykasosyal/actions";
import PostCard, { SocialPost } from "@/components/aykasosyal/PostCard";
import toast from "react-hot-toast";

export default function AykaSosyalPage() {
    const { tintValue, blurPx, borderRadiusPx, grainOpacity } = useSettings();
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const loadFeed = async () => {
            setLoading(true);
            const feedPosts = await getSocialFeed();
            setPosts(feedPosts as SocialPost[]);
            setLoading(false);
        };
        loadFeed();
    }, []);

    const handlePostSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await createSocialPost(formData);
            if (result.success) {
                // Formu temizle
                const form = document.getElementById('create-post-form') as HTMLFormElement;
                form.reset();
            } else {
                toast.error(result.message || "Gönderi paylaşılamadı.");
            }
        });
    };

    return (
        <div className="p-4 md:p-8 text-white">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">AykaSosyal Akışı</h1>
                
                <GlassCard {...{ tintValue, blurPx, borderRadiusPx, grainOpacity }} className="mb-8">
                    <form action={handlePostSubmit} id="create-post-form">
                        <textarea
                            name="content"
                            placeholder="Aklınızdan ne geçiyor?"
                            className="w-full bg-black/20 p-3 rounded-lg border border-white/10 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white placeholder-gray-400"
                            rows={3}
                            maxLength={280}
                        />
                        <div className="flex justify-end items-center mt-3">
                            <button type="submit" className="flex items-center gap-2 bg-cyan-600 px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50" disabled={isPending}>
                                <Send size={16} /> {isPending ? 'Paylaşılıyor...' : 'Paylaş'}
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
                                    <PostCard post={post} />
                                </GlassCard>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 py-10">
                                <p>Henüz hiç gönderi paylaşılmamış.</p>
                                <p>İlk gönderiyi sen paylaş!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}