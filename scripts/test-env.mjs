import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// .env.local dosyasının mutlak yolunu bulalım
const envPath = path.resolve(process.cwd(), '.env.local');

console.log(`--- Hata Ayıklama Başladı ---`);
console.log(`Mevcut Çalışma Dizini: ${process.cwd()}`);
console.log(`.env.local dosyasının olması gereken tam yol: ${envPath}`);

// Dosyanın fiziksel olarak var olup olmadığını kontrol edelim
if (fs.existsSync(envPath)) {
    console.log("✅ .env.local dosyası belirtilen yolda bulundu.");
} else {
    console.error("❌ HATA: .env.local dosyası belirtilen yolda BULUNAMADI!");
    console.log("--- Hata Ayıklama Bitti ---");
    process.exit(1); // Script'i sonlandır
}

// dotenv ile dosyayı yüklemeyi deneyelim
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('❌ dotenv HATA!: Dosya okunurken veya işlenirken bir sorun oluştu.', result.error);
} else {
    console.log('✅ .env.local dosyası `dotenv` tarafından başarıyla yüklendi.');
}

console.log("\n--- Script Tarafından Okunan Değişkenler ---");
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY}`);
console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY}`);
console.log("----------------------------------------------");

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.GEMINI_API_KEY) {
    console.error("\n❌ SONUÇ: Değişkenlerden en az biri YÜKLENEMEDİ. Lütfen .env.local dosyanızın içeriğini ve formatını kontrol edin.");
} else {
    console.log("\n✅ SONUÇ: Tüm değişkenler başarıyla yüklendi!");
}
console.log("--- Hata Ayıklama Bitti ---");