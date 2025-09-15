import { getEventDetails } from "@/app/aykasosyal/actions";
import GlassCard from "@/components/GlassCard";
import { Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function EventDetailPage({ params }: { params: { postId: string } }) {
    const postId = Number(params.postId);
    if (isNaN(postId)) {
        return <div className="p-8 text-white text-center">Geçersiz Etkinlik ID'si.</div>;
    }

    const data = await getEventDetails(postId);

    if (!data) {
        return (
            <div className="p-8 text-white text-center">
                <h1 className="text-2xl font-bold">Etkinlik Bulunamadı</h1>
                <p className="text-gray-400">Bu etkinlik silinmiş veya geçersiz olabilir.</p>
                <Link href="/dashboard/aykasosyal" className="mt-4 inline-flex items-center gap-2 text-cyan-400 hover:underline">
                    <ArrowLeft size={16} /> Akışa Geri Dön
                </Link>
            </div>
        );
    }
    
    const { post, attendees } = data;
    const event = post.event; 
    const author = post.author;

    if (!event) {
         return (
            <div className="p-8 text-white text-center">
                <h1 className="text-2xl font-bold">Etkinlik Detayları Eksik</h1>
                <p className="text-gray-400">Bu gönderi bir etkinlik olarak işaretlenmiş ancak detayları bulunamadı.</p>
                 <Link href="/dashboard/aykasosyal" className="mt-4 inline-flex items-center gap-2 text-cyan-400 hover:underline">
                    <ArrowLeft size={16} /> Akışa Geri Dön
                </Link>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 text-white">
            <div className="max-w-3xl mx-auto">
                <Link href="/dashboard/aykasosyal" className="mb-6 inline-flex items-center gap-2 text-cyan-400 hover:underline">
                    <ArrowLeft size={16} /> Akışa Geri Dön
                </Link>
                
                {/* DÜZENLEME: Ana etkinlik kartına sabit stil eklendi */}
                <GlassCard 
                    className="mb-8"
                    tintValue={-5}
                    blurPx={16}
                    grainOpacity={0}
                    borderRadiusPx={16}
                >
                    <p className="text-sm text-gray-400">Etkinlik</p>
                    <h1 className="text-3xl font-bold mt-1">{event.title}</h1>
                    <p className="text-cyan-300 mt-1">
                        <Link href={`/dashboard/aykasosyal/profil/${author.username}`} className="hover:underline">
                            {author.full_name}
                        </Link> 
                        tarafından düzenleniyor.
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                        <p className="flex items-center gap-3"><Calendar size={18} className="text-cyan-400"/> {new Date(event.event_datetime).toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                        {event.location && <p className="flex items-center gap-3"><MapPin size={18} className="text-cyan-400"/> {event.location}</p>}
                    </div>
                    {post.content && <p className="mt-4 text-gray-300 bg-black/20 p-4 rounded-lg">{post.content}</p>}
                </GlassCard>

                {/* DÜZENLEME: Katılımcı listesi kartına da sabit stil eklendi */}
                <GlassCard
                    tintValue={-5}
                    blurPx={16}
                    grainOpacity={0}
                    borderRadiusPx={16}
                >
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                        <Users /> Katılımcılar ({attendees?.length || 0})
                    </h2>
                    <div className="space-y-3">
                        {attendees && attendees.length > 0 ? (
                            attendees.map((attendee: any) => (
                                <Link key={attendee.user_id} href={`/dashboard/aykasosyal/profil/${attendee.username}`}>
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                                        <div className="w-10 h-10 bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-cyan-300">
                                            {attendee.full_name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{attendee.full_name}</p>
                                            <p className="text-sm text-gray-400">@{attendee.username}</p>
                                        </div>
                                        {attendee.region_name && <p className="ml-auto text-sm text-gray-500 bg-gray-700/50 px-2 py-1 rounded-full">{attendee.region_name}</p>}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="text-center text-gray-400 py-6">Bu etkinliğe henüz katılan yok.</p>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}