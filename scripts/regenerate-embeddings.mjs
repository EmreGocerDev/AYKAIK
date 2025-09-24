import { createClient } from '@supabase/supabase-js';
import { createOpenAI } from '@ai-sdk/openai';
import { embed } from 'ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Mistral client'ını oluştur
const mistral = createOpenAI({
  baseURL: 'https://api.mistral.ai/v1',
  apiKey: process.env.MISTRAL_API_KEY,
});

// Supabase client'ını oluştur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function regenerate() {
  console.log('1. Supabase\'den mevcut dokümanlar çekiliyor...');
  
  const { data: documents, error: fetchError } = await supabase
    .from('documents')
    .select('id, content');

  if (fetchError) {
    console.error('Dokümanlar çekilirken hata oluştu:', fetchError);
    return;
  }
  if (!documents || documents.length === 0) {
    console.log('Veritabanında güncellenecek doküman bulunamadı.');
    return;
  }

  console.log(`2. Toplam ${documents.length} doküman için embedding'ler Mistral ile yeniden oluşturulacak...`);

  const embeddingModel = mistral.embedding('mistral-embed');

  for (const doc of documents) {
    try {
      console.log(`   - ID: ${doc.id} işleniyor...`);

      // Mistral ile yeni embedding oluştur
      const { embedding } = await embed({
        model: embeddingModel,
        value: doc.content,
      });

      // Supabase'deki ilgili satırı yeni embedding ile güncelle
      const { error: updateError } = await supabase
        .from('documents')
        .update({ embedding: embedding })
        .eq('id', doc.id);

      if (updateError) {
        console.error(`   - ID: ${doc.id} güncellenirken hata:`, updateError.message);
      } else {
        console.log(`   - ID: ${doc.id} başarıyla güncellendi.`);
      }
    } catch (e) {
      console.error(`   - ID: ${doc.id} için embedding oluşturulurken bir hata oluştu:`, e.message);
    }
  }

  console.log('3. İşlem tamamlandı!');
}

regenerate();