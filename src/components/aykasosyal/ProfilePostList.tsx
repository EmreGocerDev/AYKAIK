// YOL: src/components/aykasosyal/ProfilePostList.tsx

"use client";

import { useState, useCallback, useEffect } from "react";
import GlassCard from "@/components/GlassCard";
import PostCard, { SocialPost } from "@/components/aykasosyal/PostCard";
import { getSocialProfileByUsername, getCurrentSocialUserId } from "@/app/aykasosyal/actions";

type ProfilePostListProps = {
    initialPosts: SocialPost[];
    username: string;
    profileInfo: {
        full_name: string;
        username: string;
        // GÜNCELLENDİ: PostCard'a doğru avatarı geçmek için bu bilgiye de ihtiyacımız var.
        avatar_url: string | null; 
    }
}

export default function ProfilePostList({ initialPosts, username, profileInfo }: ProfilePostListProps) {
    const [posts, setPosts] = useState(initialPosts);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserId = async () => {
            const userIdData = await getCurrentSocialUserId();
            setCurrentUserId(userIdData);
        };
        fetchUserId();
    }, []);

    // YENİ FONKSİYON: Arayüzdeki gönderi listesini anında güncellemek için
    const handlePostUpdate = useCallback((updatedPost: SocialPost) => {
        setPosts(currentPosts => 
            currentPosts.map(p => 
                p.post_id === updatedPost.post_id ? updatedPost : p
            )
        );
    }, []);

    // YENİ FONKSİYON: Gönderi silindiğinde arayüzden anında kaldırmak için
    const handlePostDelete = useCallback((postId: number) => {
        setPosts(currentPosts =>
            currentPosts.filter(p => p.post_id !== postId)
        );
    }, []);

    // Yorum ekleme/silme sonrası tam yenileme için kullanılacak fonksiyon
    const refreshPosts = useCallback(async () => {
        const data = await getSocialProfileByUsername(username);
        if (data && data.posts) {
            setPosts(data.posts);
        }
    }, [username]);

    return (
        <div className="space-y-6">
            {posts.length > 0 ? (
                posts.map(post => (
                    <GlassCard 
                        key={post.post_id}
                        tintValue={-5}
                        blurPx={16}
                        grainOpacity={0}
                        borderRadiusPx={16}
                    >
                        <PostCard 
                            // GÜNCELLENDİ: Post objesine doğru yazar bilgilerini ekliyoruz
                            post={{
                                ...post, 
                                author_full_name: profileInfo.full_name, 
                                author_username: profileInfo.username,
                                author_avatar_url: profileInfo.avatar_url
                            }} 
                            currentUserId={currentUserId}
                            // GÜNCELLENDİ: 'onActionSuccess' yerine yeni prop'lar kullanılıyor
                            onPostUpdate={handlePostUpdate}
                            onPostDelete={handlePostDelete}
                            
                        />
                    </GlassCard>
                ))
            ) : (
                <GlassCard
                    tintValue={-5}
                    blurPx={16}
                    grainOpacity={0}
                    borderRadiusPx={16}
                >
                    <p className="text-center text-gray-400 py-8">Bu kullanıcının henüz hiç paylaşımı yok.</p>
                </GlassCard>
            )}
        </div>
    );
}