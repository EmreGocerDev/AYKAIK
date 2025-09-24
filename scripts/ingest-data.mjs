import { createClient } from '@supabase/supabase-js';
import { createOpenAI } from '@ai-sdk/openai';
import { embed } from 'ai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

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

const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');

async function ingest() {
  try {
    console.log('1. Bilgi bankası dosyaları okunuyor...');
    const files = await fs.readdir(KNOWLEDGE_DIR);
    const txtFiles = files.filter(file => file.endsWith('.txt'));

    if (txtFiles.length === 0) {
      console.log(`'${KNOWLEDGE_DIR}' klasöründe .txt uzantılı dosya bulunamadı.`);
      return;
    }

    console.log(`2. Toplam ${txtFiles.length} dosya için embedding oluşturulup veritabanına eklenecek...`);
    const embeddingModel = mistral.embedding('mistral-embed');

    for (const file of txtFiles) {
      try {
        console.log(`   - Dosya: ${file} işleniyor...`);
        const filePath = path.join(KNOWLEDGE_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');

        // Mistral ile embedding oluştur
        const { embedding } = await embed({
          model: embeddingModel,
          value: content,
        });

        // Supabase'e yeni kayıt ekle
        const { error: insertError } = await supabase
          .from('documents')
          .insert({ content: content, embedding: embedding });

        if (insertError) {
          console.error(`   - Dosya: ${file} eklenirken hata:`, insertError.message);
        } else {
          console.log(`   - Dosya: ${file} başarıyla veritabanına eklendi.`);
        }
      } catch (e) {
        console.error(`   - Dosya: ${file} işlenirken bir hata oluştu:`, e.message);
      }
    }

    console.log('3. İçeri aktarma işlemi tamamlandı!');
  } catch (err) {
    console.error("Ana işlem sırasında bir hata oluştu. 'knowledge' klasörünün varlığından emin olun.", err);
  }
}

ingest();