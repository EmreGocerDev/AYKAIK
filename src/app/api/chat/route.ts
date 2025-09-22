// YOL: src/app/api/chat/route.ts

import { createAdminClient } from '@/lib/supabase/admin';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, embed } from 'ai';

export const runtime = 'edge';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  console.log('--- YENİ SOHBET İSTEĞİ GELDİ ---');
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;
    console.log('1. Kullanıcı Sorusu Alındı:', userQuery);

    const embeddingModel = google.embedding('text-embedding-004');
    
    console.log('2. Embedding oluşturuluyor...');
    const { embedding } = await embed({
      model: embeddingModel,
      value: userQuery,
    });
    console.log('   Embedding başarıyla oluşturuldu.');

    const supabase = createAdminClient();
    console.log('3. Supabase`de ilgili dokümanlar aranıyor...');
    const { data: documents, error: rpcError } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
    });

    if (rpcError) {
      console.error("Supabase RPC Hatası:", rpcError);
      return new Response(`Veritabanı aranırken bir hata oluştu: ${rpcError.message}`, { status: 500 });
    }
    
    console.log(`   Arama tamamlandı. Bulunan doküman sayısı: ${documents?.length || 0}`);
    if (!documents || documents.length === 0) {
      console.log('   Hiç doküman bulunamadığı için standart cevap dönülüyor.');
      return new Response("Bu konuda size yardımcı olacak bir bilgiye sahip değilim. Lütfen yöneticinize danışın.", { status: 200 });
    }

    // DÜZELTME: 'doc' parametresi için 'any' yerine daha spesifik bir tip tanımlandı.
    const context = documents.map((doc: { content: string }) => doc.content).join('\n\n');
    console.log('4. AI için "BAĞLAM" oluşturuldu. Karakter uzunluğu:', context.length);

    const systemPrompt = `
      Sen Ayka Enerji İK Portalı için bir yardımcı asistansın.
      Sadece ve sadece aşağıda sana verilen BAĞLAM metnini kullanarak kullanıcının sorusuna cevap ver.
      Eğer cevap bağlamın içinde yoksa, "Bu konuda bilgim yok, lütfen yöneticinize danışın." de.
      Cevaplarını kısa, net ve adımlar halinde ver.
      BAĞLAM:
      ---
      ${context}
      ---
    `;

    console.log('5. Gemini modeli ile cevap üretimi başlatılıyor...');
    const result = await streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages: messages,
    });
    console.log('   Cevap üretimi (stream) başarıyla başlatıldı. Akış gönderiliyor.');

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("API Route'da beklenmedik bir hata oluştu:", error);
    return new Response(`Sunucuda beklenmedik bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen Hata'}`, { status: 500 });
  }
}