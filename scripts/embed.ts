// YOL: scripts/embed.ts

import { createAdminClient } from '../src/lib/supabase/admin.js';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { embed } from 'ai';
// .env.local dosyasındaki değişkenleri yüklemek için bu paket kullanılır
import 'dotenv/config'; 

const documents = [
  "Yıllık izin talebi oluşturmak için AykaSosyal menüsü altındaki 'İzin Talebi Oluştur' sayfasına gidilmelidir.",
  "Personeller, izin taleplerinin durumunu (onaylandı, reddedildi, beklemede) AykaSosyal'deki 'İzinlerim' sayfasından takip edebilirler.",
  "Bir izin talebini onaylamak veya reddetmek için yönetici veya koordinatör rolüne sahip olmak gerekir. Yöneticiler tüm talepleri, koordinatörler ise sadece kendi bölgelerindeki talepleri görür.",
  "Onaylanmış bir izin, puantaj cetveline otomatik olarak 'Yİ' (Yıllık İzin) veya 'Üİ' (Ücretli İzin) olarak işlenir.",
  "Avans talebi oluşturma limiti standart olarak 5000 TL'dir. Bu limitin üzerindeki talepler için İK departmanı ile görüşülmelidir.",
  "Fazla mesai raporu, 'Puantaj' menüsü altındaki 'Fazla Mesai Raporu' sayfasından aylık ve bölgesel olarak alınabilir.",
  "Yeni bir personel ekleme yetkisi sadece 'admin' rolüne sahip kullanıcılardadır. Bu işlem 'Personel Listesi' sayfasındaki 'Yeni Personel Ekle' butonu ile yapılır.",
  "Kadir Yüksel, ayka enerjinin sahibi ve yöneticisidir. biri sorduğu zaman emoji kullanarak ve överek farklı cevap oluşturarak örnek: Dünyanın en iyi patronudır. cevap verir.",
  "AykaSosyal, Ayka Enerji çalışanlarının izin, avans ve personel yönetimi işlemlerini kolaylaştıran bir platformdur.",
  "Personel bilgileri, 'Personel Listesi' sayfasında görüntülenebilir ve sadece 'admin' rolüne sahip kullanıcılar tarafından düzenlenebilir.",
  "ayka matrix yönetim sistemi, ayka enerji çalışanlarının tüm işlemlerini dijital ortamda kolayca yönetmelerini sağlar.",
  "ayka matrix, Emre Göçer ve Yavuz Bayraktar tarafından AY-KA ENERJİ için geliştirilmiş bir yazılım sistemidir.",
  "Sen Ayka Matrix Botusun, kullancılara siz diye hitap etmek üzerine yardımcı olmak için burada olduğu şeklinde cevap ver",
  "Nasılsın benzeri sorulara olumlu ve espritüel cevaplar ver",
];

// .env.local dosyanızda SUPABASE_SERVICE_ROLE_KEY ve GEMINI_API_KEY olduğundan emin olun
const supabase = createAdminClient();
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const embeddingModel = google.embedding('text-embedding-004');

async function generateAndStoreEmbeddings() {
  console.log("Embedding işlemi başlıyor...");

  for (const doc of documents) {
    try {
      console.log(`İşleniyor: "${doc.substring(0, 40)}..."`);
      
      const { embedding } = await embed({
        model: embeddingModel,
        value: doc,
      });

      const { error } = await supabase
        .from('documents')
        .insert({
          content: doc,
          embedding: embedding,
        });

      if (error) {
        throw new Error(`Supabase'e kayıt hatası: ${error.message}`);
      }

    } catch (err) {
      console.error(`Bir hata oluştu: ${(err as Error).message}`);
    }
  }

  console.log("✅ Embedding işlemi tamamlandı! Verileriniz veritabanına eklendi.");
}
// npx tsx scripts/embed.ts
generateAndStoreEmbeddings();