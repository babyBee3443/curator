
'use server';
import { suggestSingleContentIdea as suggestSingleContentIdeaFlow, type SuggestSingleContentIdeaOutput } from '@/ai/flows/suggest-content-ideas';
import { generatePostCaption as generatePostCaptionFlow, type GeneratePostCaptionInput, type GeneratePostCaptionOutput } from '@/ai/flows/generate-post-captions';
import { optimizePostHashtags as optimizePostHashtagsFlow, type OptimizePostHashtagsInput, type OptimizePostHashtagsOutput } from '@/ai/flows/optimize-post-hashtags';
import { generatePostImage as generatePostImageFlow, type GeneratePostImageInput, type GeneratePostImageOutput } from '@/ai/flows/generate-post-image';
import type { Post } from '@/types';

export interface FullPostGenerationOutput {
  topic: string;
  keyInformation: string;
  caption: string;
  hashtags: string[];
  imageUrl: string;
}

export async function generateFullPostAction(): Promise<FullPostGenerationOutput> {
  console.log('generateFullPostAction başlatıldı.');
  try {
    const idea = await suggestSingleContentIdeaFlow();
    console.log('Fikir üretildi:', idea);
    if (!idea.topic || !idea.keyInformation) {
      console.error('Geçersiz fikir üretildi.');
      throw new Error('Yapay zeka geçerli bir içerik fikri üretemedi.');
    }

    // Resim oluşturma istemi için sadece kısa başlığı kullanalım.
    const imagePrompt = idea.topic; 

    const [imageResult, captionResult] = await Promise.all([
      generatePostImageFlow({ prompt: imagePrompt }),
      generatePostCaptionFlow({ topic: idea.topic, keyInformation: idea.keyInformation })
    ]);
    console.log('Resim sonucu:', imageResult);
    console.log('Başlık sonucu:', captionResult);

    if (!imageResult.imageUrl) {
      console.error('Resim üretilemedi.');
      throw new Error('Yapay zeka bir resim üretemedi.');
    }
    if (!captionResult.caption) {
      console.error('Başlık üretilemedi.');
      throw new Error('Yapay zeka bir başlık üretemedi.');
    }

    const hashtagsResult = await optimizePostHashtagsFlow({ postCaption: captionResult.caption, topic: idea.topic });
    console.log('Hashtag sonucu:', hashtagsResult);

    return {
      topic: idea.topic,
      keyInformation: idea.keyInformation,
      caption: captionResult.caption,
      hashtags: hashtagsResult.hashtags || [],
      imageUrl: imageResult.imageUrl,
    };
  } catch (error) {
    console.error('Tam gönderi oluşturulurken hata oluştu:', error);
    if (error instanceof Error) {
        throw new Error(`Yapay zeka tam gönderi oluştururken bir sorunla karşılaştı: ${error.message}`);
    }
    throw new Error('Yapay zeka tam gönderi oluştururken bilinmeyen bir sorunla karşılaştı. Lütfen daha sonra tekrar deneyin.');
  }
}

export async function sharePostToInstagramAction(post: Post, accessToken?: string): Promise<{ success: boolean; message: string; instagramPostId?: string }> {
  console.log(`[TEST] Instagram'da paylaşılmak üzere alınan gönderi (ID: ${post.id})`);

  if (!accessToken) {
    console.error(`[TEST] Gönderi (ID: ${post.id}) paylaşılamadı: Erişim Belirteci (Access Token) eksik.`);
     return { success: false, message: 'Erişim Belirteci (Access Token) eksik. Lütfen Ayarlar sayfasından belirtecinizi girin.'};
  }

  if (post.imageUrl.startsWith('data:image')) {
    console.warn(`[TEST] Gönderi (ID: ${post.id}): Resim URL'si bir veri URI'si. Instagram Graph API doğrudan veri URI'lerini kabul etmez. API çağrısı muhtemelen başarısız olacaktır. Resmin herkese açık bir URL olması gerekir.`);
  }

  const fullCaption = `${post.caption}\n\n${post.hashtags.map(h => `#${h.trim()}`).join(' ')}`;
  const instagramApiVersion = 'v19.0'; // veya güncel bir sürüm

  try {
    console.log(`[GERÇEK API DENEMESİ - GÜVENSİZ YÖNTEM] Instagram API çağrısı deneniyor. Belirtecin ilk 10 karakteri: ${accessToken.substring(0,10)}...`);
    console.log(`[GERÇEK API DENEMESİ] Kullanılacak resim URL'si: ${post.imageUrl}`);
    console.log(`[GERÇEK API DENEMESİ] Kullanılacak başlık: ${fullCaption.substring(0, 100)}...`);

    // Adım 1: Medya Konteyneri Oluşturma
    // Carousel gönderileri için 'children' parametresi kullanılır. Tek medya için doğrudan image_url veya video_url.
    const mediaContainerParams = new URLSearchParams({
      image_url: post.imageUrl,
      caption: fullCaption,
      access_token: accessToken,
    });

    console.log('[GERÇEK API DENEMESİ] Instagram Medya Konteyneri API çağrısı yapılıyor (POST /me/media)...');
    const mediaContainerResponse = await fetch(`https://graph.facebook.com/${instagramApiVersion}/me/media`, {
      method: 'POST',
      body: mediaContainerParams,
    });
    
    const mediaContainerData = await mediaContainerResponse.json();

    console.log('[GERÇEK API DENEMESİ] Medya Konteyneri API yanıt durumu:', mediaContainerResponse.status);
    console.log('[GERÇEK API DENEMESİ] Medya Konteyneri API yanıt verisi:', JSON.stringify(mediaContainerData, null, 2));


    if (!mediaContainerResponse.ok || mediaContainerData.error) {
      const errorMessage = mediaContainerData.error?.message || `API isteği başarısız oldu (HTTP ${mediaContainerResponse.status}). Resim URL'sinin herkese açık olduğundan ve belirtecinizin doğru izinlere sahip olduğundan emin olun. Detaylar için konsolu kontrol edin.`;
      console.error('[GERÇEK API DENEMESİ] Instagram medya konteyneri oluşturma hatası:', mediaContainerData.error || `HTTP ${mediaContainerResponse.status}`);
      return { success: false, message: `Instagram API Hatası (Medya Konteyneri): ${errorMessage}` };
    }

    const creationId = mediaContainerData.id;
    if (!creationId) {
      console.error('[GERÇEK API DENEMESİ] Instagram API: Medya konteyneri ID alınamadı. Yanıt:', mediaContainerData);
      return { success: false, message: 'Instagram API: Medya konteyneri ID alınamadı.' };
    }
    console.log('[GERÇEK API DENEMESİ] Instagram medya konteyneri oluşturuldu, creation_id:', creationId);

    // Adım 2: Medya Konteynerini Yayınlama
    // creation_id alındıktan sonra bu ID ile yayınlama yapılır.
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    });

    console.log('[GERÇEK API DENEMESİ] Instagram Medya Yayınlama API çağrısı yapılıyor (POST /me/media_publish)...');
    // Belirli bir süre bekleme (isteğe bağlı, konteynerin işlenmesi için)
    // await new Promise(resolve => setTimeout(resolve, 5000)); // Örnek 5 saniye bekleme

    const publishResponse = await fetch(`https://graph.facebook.com/${instagramApiVersion}/me/media_publish`, {
      method: 'POST',
      body: publishParams,
    });

    const publishData = await publishResponse.json();
    console.log('[GERÇEK API DENEMESİ] Medya Yayınlama API yanıt durumu:', publishResponse.status);
    console.log('[GERÇEK API DENEMESİ] Medya Yayınlama API yanıt verisi:', JSON.stringify(publishData, null, 2));
    
    if (!publishResponse.ok || publishData.error) {
      const errorMessage = publishData.error?.message || `API isteği başarısız oldu (HTTP ${publishResponse.status}). Detaylar için konsolu kontrol edin.`;
      console.error('[GERÇEK API DENEMESİ] Instagram medya yayınlama hatası:', publishData.error || `HTTP ${publishResponse.status}`);
      return { success: false, message: `Instagram API Hatası (Yayınlama): ${errorMessage}` };
    }
    
    const instagramPostId = publishData.id;
    if (!instagramPostId) {
        console.error('[GERÇEK API DENEMESİ] Instagram API: Yayınlama sonrası gönderi ID alınamadı. Yanıt:', publishData);
        return { success: false, message: 'Instagram API: Yayınlama sonrası gönderi ID alınamadı.' };
    }
    console.log(`[GERÇEK API DENEMESİ] Gönderi (ID: ${post.id}) Instagram'a başarıyla gönderildi. Instagram Post ID: ${instagramPostId}`);
    return { 
      success: true, 
      message: `Gönderi (ID: ${post.id}) başarıyla Instagram'da yayınlandı (GERÇEK API DENEMESİ). Instagram Post ID: ${instagramPostId}`,
      instagramPostId: instagramPostId
    };

  } catch (error) {
    console.error(`[GERÇEK API DENEMESİ] Gönderi (ID: ${post.id}) Instagram'a gönderilemedi:`, error);
    if (error instanceof Error) {
      return { success: false, message: `Gönderi paylaşılamadı (GERÇEK API DENEMESİ): ${error.message}` };
    }
    return { success: false, message: `Gönderi paylaşılamadı (GERÇEK API DENEMESİ): Bilinmeyen bir API hatası oluştu.` };
  }
}

export async function sendContentByEmailAction(post: Post, recipientEmail: string): Promise<{ success: boolean; message: string }> {
  console.log(`[E-POSTA SİMÜLASYONU] Alınan gönderi (ID: ${post.id}), Alıcı: ${recipientEmail}`);
  const fromEmailSimulated = 'getdusbox@gmail.com'; // Kullanıcının belirttiği gönderen e-posta adresi (SİMÜLASYON İÇİN)

  // E-posta içeriğini hazırlayalım (HTML veya metin olarak)
  const emailSubject = `Kozmos Küratörü Yeni Gönderi Önerisi: ${post.topic}`;
  let emailBody = `Merhaba,\n\nYapay zeka sizin için yeni bir Instagram gönderi içeriği hazırladı:\n\n`;
  emailBody += `Konu: ${post.topic}\n\n`;
  emailBody += `Başlık Önerisi:\n${post.caption}\n\n`;
  emailBody += `Hashtag Önerileri:\n${post.hashtags.map(h => `#${h}`).join(' ')}\n\n`;
  emailBody += `Resim URL'si (veya Veri URI'si):\n${post.imageUrl}\n\n`;
  emailBody += `Bu içerik, ${fromEmailSimulated} (simüle edilmiş gönderen) adresinden ${recipientEmail} adresine gönderilmek üzere hazırlandı.\n\n`;
  emailBody += `Saygılarımızla,\nKozmos Küratörü (Yapay Zeka Asistanı)\n\n`;
  emailBody += `--- SİMÜLASYON NOTU ---\n`;
  emailBody += `Bu bir e-posta gönderim simülasyonudur. Gerçek e-posta gönderimi yapılmamıştır.\n`;
  emailBody += `Gerçek gönderim için sunucu tarafında Nodemailer gibi bir kütüphane ve ${fromEmailSimulated} hesabına ait bir Google Uygulama Şifresi (sizin sağladığınız gibi) kullanılarak bir altyapı kurulması gerekir. Bu şifre güvenli bir şekilde (örneğin ortam değişkenleri ile) sunucu tarafı kodunuzda yönetilmelidir.\n`;

  console.log("--- E-POSTA SİMÜLASYON BAŞLANGICI ---");
  console.log("Gönderen (Simüle):", fromEmailSimulated);
  console.log("Alıcı:", recipientEmail);
  console.log("Konu:", emailSubject);
  console.log("İçerik:\n", emailBody);
  console.log("--- E-POSTA SİMÜLASYON SONU ---");

  // Bu kısım gerçek Nodemailer kodunu içermeyecek, sadece simülasyon.
  try {
    // Burada normalde Nodemailer ile e-posta gönderme kodu olurdu.
    // await transporter.sendMail({ from: fromEmailSimulated, to: recipientEmail, subject: emailSubject, text: emailBody });
    // Simülasyon başarılı kabul ediliyor.
    return {
      success: true,
      message: `E-posta gönderme simülasyonu başarılı. Gönderi detayları ve e-posta içeriği konsola loglandı. (Alıcı: ${recipientEmail}, Simüle Edilmiş Gönderen: ${fromEmailSimulated})`,
    };
  } catch (error) {
    console.error('[E-POSTA SİMÜLASYONU] Hata:', error);
    return {
      success: false,
      message: `E-posta gönderme simülasyonu sırasında bir hata oluştu: ${(error as Error).message}`,
    };
  }
}
