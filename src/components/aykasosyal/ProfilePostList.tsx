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
                            post={{...post, author_full_name: profileInfo.full_name, author_username: profileInfo.username}} 
                            currentUserId={currentUserId}
                            onActionSuccess={refreshPosts} 
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