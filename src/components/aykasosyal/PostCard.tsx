"use client";

import { Heart, MessageCircle, Calendar, MapPin, Send, Users, Trash2 } from "lucide-react";
import { useState, useTransition, useRef } from "react";
import { toggleSocialLike, toggleRsvpToEvent, addSocialComment, deleteSocialPost, deleteSocialComment } from "@/app/aykasosyal/actions";
import toast from "react-hot-toast";
import Link from "next/link";

export type SocialPost = {
    post_id: number;
    post_content: string;
    post_created_at: string;
    post_type: 'text' | 'event';
    author_id: string;
    author_full_name: string;
    author_username: string;
    like_count: number;
    is_liked_by_user: boolean;
    comments: { id: number; content: string; created_at: string; author: { id: string; full_name: string; username: string; }; }[] | null;
    event_details: { id: number; post_id: number; title: string; event_datetime: string; location: string | null; description: string | null; } | null;
    rsvp_count: number;
    is_rsvpd_by_user: boolean;
}

type PostCardProps = { 
    post: SocialPost;
    currentUserId: string | null;
    onActionSuccess: () => void;
}

function timeSince(dateString: string): string {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return "şimdi";
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

export default function PostCard({ post, currentUserId, onActionSuccess }: PostCardProps) {
    const [isLiking, startLikeTransition] = useTransition();
    const [isRsvping, startRsvpTransition] = useTransition();
    const [isCommenting, startCommentTransition] = useTransition();
    const [isDeleting, startDeleteTransition] = useTransition();
    const [showComments, setShowComments] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const handleLikeClick = () => {
        startLikeTransition(async () => {
            const result = await toggleSocialLike(post.post_id);
            if (result.success) {
                onActionSuccess();
            } else {
                toast.error(result.message || "Beğenme işlemi başarısız.");
            }
        });
    };

    const handleRsvpClick = () => {
        startRsvpTransition(async () => {
            const result = await toggleRsvpToEvent(post.post_id);
            if (result.success) {
                onActionSuccess();
            } else {
                toast.error(result.message || "Katılım işlemi başarısız.");
            }
        });
    };

    const handleCommentSubmit = async (formData: FormData) => {
        startCommentTransition(async () => {
            const result = await addSocialComment(post.post_id, formData);
            if (result.success) {
                formRef.current?.reset();
                onActionSuccess();
            } else {
                toast.error(result.message || "Yorum eklenemedi.");
            }
        });
    };
    
    const handleDeletePost = () => {
        if (window.confirm("Bu gönderiyi kalıcı olarak silmek istediğinizden emin misiniz?")) {
            startDeleteTransition(async () => {
                const result = await deleteSocialPost(post.post_id);
                if (result.success) {
                    toast.success("Gönderi silindi.");
                    onActionSuccess();
                } else {
                    toast.error(result.message || "Gönderi silinemedi.");
                }
            });
        }
    };
    
    const handleDeleteComment = (commentId: number) => {
        if (window.confirm("Bu yorumu silmek istediğinizden emin misiniz?")) {
            startDeleteTransition(async () => {
                const result = await deleteSocialComment(commentId);
                 if (result.success) {
                    toast.success("Yorum silindi.");
                    onActionSuccess();
                } else {
                    toast.error(result.message || "Yorum silinemedi.");
                }
            });
        }
    };

    const formattedEventDate = post.event_details ?
        new Date(post.event_details.event_datetime).toLocaleString('tr-TR', {
        dateStyle: 'full',
        timeStyle: 'short'
    }) : '';
    return (
        <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-cyan-300 hover:opacity-90 transition-opacity">
                <Link href={`/dashboard/aykasosyal/profil/${post.author_username}`}>
                    {post.author_full_name.charAt(0)}
                </Link>
           
             </div>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <Link href={`/dashboard/aykasosyal/profil/${post.author_username}`}><p className="font-bold text-white hover:underline cursor-pointer">{post.author_full_name}</p></Link>
              
                         <Link href={`/dashboard/aykasosyal/profil/${post.author_username}`}><p className="text-sm text-gray-400">@{post.author_username}</p></Link>
                        <span className="text-sm text-gray-500">·</span>
                        <p className="text-sm text-gray-500">{timeSince(post.post_created_at)}</p>
                    </div>
               
                     {post.author_id === currentUserId && (
                        <button onClick={handleDeletePost} disabled={isDeleting} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                            <Trash2 size={16}/>
                        </button>
      
                     )}
                </div>
                
                {post.post_type === 'event' && post.event_details ?
(
                    <div className="mt-2 border-l-4 border-cyan-500 pl-4 py-2 bg-black/20 rounded-r-lg">
                        <h3 className="font-bold text-lg text-white">{post.event_details.title}</h3>
                        <p className="text-gray-300 my-2">{post.post_content}</p>
                    
                         <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2"><Calendar size={16} className="text-cyan-400"/> {formattedEventDate}</p>
                            {post.event_details.location && <p className="flex items-center gap-2"><MapPin size={16} className="text-cyan-400"/> {post.event_details.location}</p>}
                        
                        </div>
                    </div>
                ) : (
                    <p className="mt-1 text-gray-200 whitespace-pre-wrap">{post.post_content}</p>
                )}
                
       
                 <div className="flex items-center gap-6 mt-4 text-gray-400">
                    <button onClick={handleLikeClick} disabled={isLiking} className={`flex items-center gap-2 hover:text-red-500 transition-colors ${post.is_liked_by_user ? 'text-red-500' : ''}`}>
                        <Heart size={18} fill={post.is_liked_by_user ? 'currentColor' : 'none'} /> {post.like_count}
                    </button>
                    <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 hover:text-cyan-400 transition-colors">
                        <MessageCircle size={18} /> {post.comments?.length || 0}
                    </button>
                    {post.post_type === 'event' && (
                         <div className="flex items-center gap-4">
                            
                            <Link href={`/dashboard/aykasosyal/etkinlik/${post.post_id}`} className="hover:underline text-gray-400 hover:text-white transition-colors">
                                <span className="flex items-center gap-2">
                                    <Users size={18}/> {post.rsvp_count} Katılımcı
                     
                               </span>
                            </Link>
                            <button onClick={handleRsvpClick} disabled={isRsvping} className={`px-3 py-1 text-xs rounded-full transition-colors ${post.is_rsvpd_by_user ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 font-semibold' : 'bg-white/10 text-gray-200 hover:bg-white/20'}`}>
                
                                 {isRsvping ? '...' : (post.is_rsvpd_by_user ? 'Katılıyorsun' : 'Katıl')}
                            </button>
                        </div>
                    )}
    
                 </div>

                {showComments && (
                    <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in duration-300">
                        <form action={handleCommentSubmit} ref={formRef} className="flex items-center gap-2 mb-4">
             
                             <input name="content" type="text" placeholder="Yorumunu ekle..." required className="flex-1 bg-black/20 p-2 rounded-lg border border-white/10 text-sm" />
                            <button type="submit" disabled={isCommenting} className="p-2 bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50">
                                <Send size={16} />
   
                             </button>
                        </form>

                        <div className="space-y-3">
                          
                           {post.comments?.map(comment => (
                                <div key={comment.id} className="group flex items-start gap-2 text-sm">
                                    <div className="w-6 h-6 mt-1 bg-gray-600 rounded-full flex-shrink-0 items-center justify-center font-bold text-cyan-200 text-xs hidden sm:flex">{comment.author.full_name.charAt(0)}</div>
         
                                     <div className="bg-black/20 p-2 rounded-lg flex-1 flex justify-between items-start">
                                        <div>
                          
                                           <div className="flex items-baseline gap-2">
                                                <p className="font-semibold text-white">{comment.author.full_name}</p>
                             
                                                 <p className="text-xs text-gray-500">{timeSince(comment.created_at)}</p>
                                            </div>
                                   
                                             <p className="text-gray-300">{comment.content}</p>
                                        </div>
                                        {comment.author.id === currentUserId && (
      
                                               <button onClick={() => handleDeleteComment(comment.id)} disabled={isDeleting} className="p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={14} />
  
                                               </button>
                                        )}
                  
                                     </div>
                                </div>
                            ))}
                      
                       </div>
                    </div>
                )}
            </div>
        </div>
    );
}