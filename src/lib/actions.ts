
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
    // 1. İçerik Fikri Üret
    const idea = await suggestSingleContentIdeaFlow();
    console.log('Fikir üretildi:', idea);
    if (!idea.topic || !idea.keyInformation) {
      console.error('Geçersiz fikir üretildi.');
      throw new Error('Yapay zeka geçerli bir içerik fikri üretemedi.');
    }

    // Sadece konu başlığını resim istemi olarak kullan
    const imagePrompt = idea.topic;

    // 2. Resim ve Başlık Üretimini Paralelleştir
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

    // 3. Hashtag Optimizasyonu
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
    throw new Error(`Erişim Belirteci (Access Token) eksik. Lütfen Ayarlar sayfasından belirtecinizi girin.`);
  }

  if (post.imageUrl.startsWith('data:image')) {
    console.warn(`[TEST] Gönderi (ID: ${post.id}): Resim URL'si bir veri URI'si. Instagram Graph API doğrudan veri URI'lerini kabul etmez. API çağrısı muhtemelen başarısız olacaktır. Resmin herkese açık bir URL olması gerekir.`);
    // Bu durum, kullanıcıya bir toast mesajıyla da bildirilebilir, ancak şimdilik sadece konsola logluyoruz.
    // Ayarlar sayfasında bu konuda zaten bir uyarı var.
  }

  const fullCaption = `${post.caption}\n\n${post.hashtags.map(h => `#${h.trim()}`).join(' ')}`;
  const instagramApiVersion = 'v19.0'; // Güncel API versiyonunu kontrol edin

  try {
    console.log(`[TEST DENEMESİ - GÜVENSİZ YÖNTEM] Instagram API çağrısı deneniyor. Belirtecin ilk 10 karakteri: ${accessToken.substring(0,10)}...`);
    console.log(`[TEST DENEMESİ] Kullanılacak resim URL'si: ${post.imageUrl}`);
    console.log(`[TEST DENEMESİ] Kullanılacak başlık: ${fullCaption.substring(0, 100)}...`);

    // Adım 1: Medya Konteyneri Oluşturma
    // ÖNEMLİ: image_url HERKESE AÇIK BİR URL OLMALIDIR. Veri URI'si ise bu çağrı BAŞARISIZ OLACAKTIR.
    const mediaContainerParams = new URLSearchParams({
      image_url: post.imageUrl,
      caption: fullCaption,
      access_token: accessToken,
    });

    console.log('[TEST DENEMESİ] Instagram Medya Konteyneri API çağrısı yapılıyor (POST /me/media)...');
    const mediaContainerResponse = await fetch(`https://graph.facebook.com/${instagramApiVersion}/me/media`, {
      method: 'POST',
      body: mediaContainerParams,
    });
    
    console.log('[TEST DENEMESİ] Medya Konteyneri API yanıt durumu:', mediaContainerResponse.status);
    const mediaContainerData = await mediaContainerResponse.json();
    console.log('[TEST DENEMESİ] Medya Konteyneri API yanıt verisi:', JSON.stringify(mediaContainerData, null, 2));

    if (!mediaContainerResponse.ok || mediaContainerData.error) {
      console.error('[TEST DENEMESİ] Instagram medya konteyneri oluşturma hatası:', mediaContainerData.error || `HTTP ${mediaContainerResponse.status}`);
      const errorMessage = mediaContainerData.error?.message || `API isteği başarısız oldu. HTTP Durum Kodu: ${mediaContainerResponse.status}. Resim URL'sinin herkese açık olduğundan ve belirtecinizin doğru izinlere sahip olduğundan emin olun.`;
      throw new Error(`Instagram API Hatası (Medya Konteyneri): ${errorMessage}`);
    }

    const creationId = mediaContainerData.id;
    if (!creationId) {
      console.error('[TEST DENEMESİ] Instagram API: Medya konteyneri ID alınamadı. Yanıt:', mediaContainerData);
      throw new Error('Instagram API: Medya konteyneri ID alınamadı.');
    }
    console.log('[TEST DENEMESİ] Instagram medya konteyneri oluşturuldu, creation_id:', creationId);

    // Adım 2: Medya Konteynerini Yayınlama
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    });

    console.log('[TEST DENEMESİ] Instagram Medya Yayınlama API çağrısı yapılıyor (POST /me/media_publish)...');
    const publishResponse = await fetch(`https://graph.facebook.com/${instagramApiVersion}/me/media_publish`, {
      method: 'POST',
      body: publishParams,
    });

    console.log('[TEST DENEMESİ] Medya Yayınlama API yanıt durumu:', publishResponse.status);
    const publishData = await publishResponse.json();
    console.log('[TEST DENEMESİ] Medya Yayınlama API yanıt verisi:', JSON.stringify(publishData, null, 2));
    
    if (!publishResponse.ok || publishData.error) {
      console.error('[TEST DENEMESİ] Instagram medya yayınlama hatası:', publishData.error || `HTTP ${publishResponse.status}`);
      const errorMessage = publishData.error?.message || `API isteği başarısız oldu. HTTP Durum Kodu: ${publishResponse.status}.`;
      throw new Error(`Instagram API Hatası (Yayınlama): ${errorMessage}`);
    }
    
    const instagramPostId = publishData.id;
    if (!instagramPostId) {
        console.error('[TEST DENEMESİ] Instagram API: Yayınlama sonrası gönderi ID alınamadı. Yanıt:', publishData);
        throw new Error('Instagram API: Yayınlama sonrası gönderi ID alınamadı.');
    }
    console.log(`[TEST DENEMESİ] Gönderi (ID: ${post.id}) Instagram'a başarıyla gönderildi (GERÇEK API DENEMESİ). Instagram Post ID: ${instagramPostId}`);
    return { 
      success: true, 
      message: `Gönderi (ID: ${post.id}) başarıyla Instagram'da yayınlandı (TEST DENEMESİ). Instagram Post ID: ${instagramPostId}`,
      instagramPostId: instagramPostId
    };

  } catch (error) {
    console.error(`[TEST DENEMESİ] Gönderi (ID: ${post.id}) Instagram'a gönderilemedi (GERÇEK API DENEMESİ BAŞARISIZ):`, error);
    if (error instanceof Error) {
      // Kullanıcıya gösterilecek mesaj zaten error.message içinde API'den gelen detayı içeriyor olmalı.
      return { success: false, message: `Gönderi paylaşılamadı (TEST DENEMESİ): ${error.message}` };
    }
    return { success: false, message: `Gönderi paylaşılamadı (TEST DENEMESİ): Bilinmeyen bir API hatası oluştu.` };
  }
}
