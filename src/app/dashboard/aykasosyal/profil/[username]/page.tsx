import { getSocialProfileByUsername } from "@/app/aykasosyal/actions";
import GlassCard from "@/components/GlassCard";
import { Calendar, MapPin } from "lucide-react";
import ProfilePostList from "@/components/aykasosyal/ProfilePostList";
import { SocialPost } from "@/components/aykasosyal/PostCard";

export default async function ProfilePage({ params }: { params: { username: string } }) {
    const data = await getSocialProfileByUsername(params.username);

    if (!data?.profile) {
        return (
            <div className="p-8 text-white text-center">
                <h1 className="text-2xl font-bold">Kullanıcı Bulunamadı</h1>
                <p className="text-gray-400">@{params.username} adında bir kullanıcı yok.</p>
            </div>
        );
    }

    const profile = data.profile;
    const initialPosts: SocialPost[] = data.posts || [];

    return (
        <div className="p-4 md:p-8 text-white">
            <div className="max-w-3xl mx-auto">
                {/* DÜZELTME: Belirttiğiniz özel GlassCard tasarımı buraya eklendi */}
                <GlassCard 
                    className="mb-8"
                    tintValue={-5}
                    blurPx={16}
                    grainOpacity={0}
                    borderRadiusPx={16}
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-cyan-300 text-4xl mb-4">
                            {profile.full_name.charAt(0)}
                        </div>
                        <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                        <p className="text-lg text-gray-400">@{profile.username}</p>
                        {profile.bio && <p className="mt-2 max-w-lg">{profile.bio}</p>}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                            {profile.region_name && <span className="flex items-center gap-1"><MapPin size={14}/> {profile.region_name}</span>}
                            <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(profile.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })} tarihinde katıldı.</span>
                        </div>
                    </div>
                </GlassCard>

                <h2 className="text-2xl font-semibold mb-6">Paylaşımlar</h2>
                
                <ProfilePostList 
                    initialPosts={initialPosts} 
                    username={params.username}
                    profileInfo={{ full_name: profile.full_name, username: profile.username }}
                />
            </div>
        </div>
    );
}