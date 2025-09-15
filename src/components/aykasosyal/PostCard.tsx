"use client";

import { Heart, MessageCircle } from "lucide-react";
import { useTransition } from "react";
import { toggleSocialLike } from "@/app/aykasosyal/actions";
import toast from "react-hot-toast";

// RPC fonksiyonundan dönecek veri tipi
type PostAuthor = {
    id: string;
    full_name: string;
    username: string;
}

type PostComment = {
    id: number;
    content: string;
    created_at: string;
    author: PostAuthor;
}

export type SocialPost = {
    post_id: number;
    post_content: string;
    post_created_at: string;
    author_id: string;
    author_full_name: string;
    author_username: string;
    like_count: number;
    is_liked_by_user: boolean;
    comments: PostComment[];
}

type PostCardProps = {
    post: SocialPost;
}

function timeSince(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "ay";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "g";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "s";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "d";
    return Math.floor(seconds) + "sn";
}

export default function PostCard({ post }: PostCardProps) {
    const [isPending, startTransition] = useTransition();

    const handleLikeClick = () => {
        startTransition(async () => {
            const result = await toggleSocialLike(post.post_id);
            if (!result.success) {
                toast.error(result.message || "İşlem başarısız.");
            }
        });
    };

    return (
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-cyan-300">
                {post.author_full_name.charAt(0)}
            </div>
            <div className="flex-1">
                <div className="flex items-baseline gap-2">
                    <p className="font-bold text-white hover:underline cursor-pointer">{post.author_full_name}</p>
                    <p className="text-sm text-gray-400">@{post.author_username}</p>
                    <span className="text-sm text-gray-500">·</span>
                    <p className="text-sm text-gray-500">{timeSince(new Date(post.post_created_at))}</p>
                </div>
                <p className="mt-1 text-gray-200 whitespace-pre-wrap">{post.post_content}</p>
                
                <div className="flex items-center gap-6 mt-4 text-gray-400">
                    <button 
                        onClick={handleLikeClick} 
                        disabled={isPending}
                        className={`flex items-center gap-2 hover:text-red-500 transition-colors ${post.is_liked_by_user ? 'text-red-500' : ''}`}
                    >
                        <Heart size={18} fill={post.is_liked_by_user ? 'currentColor' : 'none'} /> {post.like_count}
                    </button>
                    <button className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                        <MessageCircle size={18} /> {post.comments?.length || 0}
                    </button>
                </div>
            </div>
        </div>
    );
}