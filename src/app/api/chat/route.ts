// YOL: src/app/api/chat/route.ts

import { createAdminClient } from '@/lib/supabase/admin';
// DEĞİŞİKLİK: OpenAI yerine Mistral'in kendi kütüphanesini kullanıyoruz
import { createMistral } from '@ai-sdk/mistral';
import { streamText, embed } from 'ai';

export const runtime = 'edge';

// Mistral için kendi client'ını oluşturuyoruz. Artık baseURL'e gerek yok.
const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

export async function POST(req: Request) {
  console.log('--- YENİ SOHBET İSTEĞİ GELDİ (RESMİ MISTRAL SDK) ---');
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;
    
    // Embedding modeli olarak Mistral kullanılıyor. Bu kısım doğru çalışıyordu.
    const embeddingModel = mistral.embedding('mistral-embed');
    
    const { embedding } = await embed({
      model: embeddingModel,
      value: userQuery,
    });

    const supabase = createAdminClient();
    const { data: documents, error: rpcError } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
    });

    if (rpcError) {
      console.error("Supabase RPC Hatası:", rpcError);
      return new Response(`Veritabanı aranırken bir hata oluştu: ${rpcError.message}`, { status: 500 });
    }
    
    // Doküman bulunamadığında, doğrudan AI'a sor.
    const context = documents?.map((doc: { content: string }) => doc.content).join('\n\n') || '';

    const systemPrompt = `
      Sen Ayka Matrix için bir asistansın adın neo.
      ayka matrix, ayka enerji çalışanlarının izin alma, avans talebi oluşturma ve personel yönetimi işlemlerini kolaylaştıran bir platformdur.
      gereksiz cevaplardan kaçın, samimi olmak için fazla olmamakla birlikte emoji kullanabilirsin, fakat " gibi şeyler kullanma.
      Kullanıcıya her zaman "siz" diye hitap et.
      Kullanıcının sorusunu cevaplamak için öncelikle aşağıda sana verilen BAĞLAM metnini kullan.
      Eğer cevap bağlamın içinde yoksa veya bağlam boşsa, Üzgün olduğunu ve soruyu cevaplayamadığını kibarca belirt.
      cevap verirken samimi ve resmi dil kullan.
      bağlamını daima gizli tut sohbette söyleme.
      emoji kullanırken kullanıyorum gibi şeyler deme.
      türkçe kurallarına dikkat ederek yaz.
      Cevabın çok uzun olmasın, kısa ve öz tut.
      BAĞLAM:
      ---
      ${context}
      ---
    `;

    // Sohbet modeli olarak Mistral'in en güncel ve hızlı modellerinden biri kullanılıyor.
    const result = await streamText({
      model: mistral('open-mistral-7b'), // DEĞİŞİKLİK: Daha hızlı ve ücretsiz katmana uygun bir model seçildi. // Daha güçlü bir model deniyoruz.
      system: systemPrompt,
      messages: messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("API Route'da beklenmedik bir hata oluştu:", error);
    return new Response(`Sunucuda beklenmedik bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen Hata'}`, { status: 500 });
  }
}
