
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
  console.log(`Instagram'da paylaşılmak üzere alınan gönderi (ID: ${post.id})`);

  if (!accessToken) {
    console.error(`Gönderi (ID: ${post.id}) paylaşılamadı: Erişim Belirteci (Access Token) eksik.`);
    throw new Error(`Erişim Belirteci (Access Token) eksik. Lütfen Ayarlar sayfasından belirtecinizi girin.`);
  }

  if (post.imageUrl.startsWith('data:image')) {
    console.warn(`Gönderi (ID: ${post.id}): Resim URL'si bir veri URI'si. Instagram Graph API doğrudan veri URI'lerini kabul etmez. API çağrısı muhtemelen başarısız olacaktır. Resmin herkese açık bir URL olması gerekir.`);
    // Kullanıcıya bu durum hakkında bir mesaj döndürebiliriz, ancak şimdilik sadece konsola yazıyoruz.
    // Gerçek bir uygulamada bu durum kullanıcıya net bir şekilde bildirilmeli.
  }

  const fullCaption = `${post.caption}\n\n${post.hashtags.map(h => `#${h.trim()}`).join(' ')}`;
  const instagramApiVersion = 'v19.0'; // Güncel API versiyonunu kontrol edin

  try {
    console.log(`[TEST AMAÇLI - GÜVENSİZ] Instagram API çağrısı deneniyor. Belirteç: ${accessToken.substring(0,10)}...`);

    // Adım 1: Medya Konteyneri Oluşturma
    // ÖNEMLİ: image_url HERKESE AÇIK BİR URL OLMALIDIR. Veri URI'si ise bu çağrı BAŞARISIZ OLACAKTIR.
    const mediaContainerParams = new URLSearchParams({
      image_url: post.imageUrl,
      caption: fullCaption,
      access_token: accessToken,
    });

    const mediaContainerResponse = await fetch(`https://graph.facebook.com/${instagramApiVersion}/me/media`, {
      method: 'POST',
      body: mediaContainerParams,
    });

    const mediaContainerData = await mediaContainerResponse.json();

    if (!mediaContainerResponse.ok || mediaContainerData.error) {
      console.error('Instagram medya konteyneri oluşturma hatası:', mediaContainerData.error);
      throw new Error(`Instagram API Hatası (Medya Konteyneri): ${mediaContainerData.error?.message || 'Bilinmeyen hata'}`);
    }

    const creationId = mediaContainerData.id;
    if (!creationId) {
      throw new Error('Instagram API: Medya konteyneri ID alınamadı.');
    }
    console.log('Instagram medya konteyneri oluşturuldu, ID:', creationId);

    // Adım 2: Medya Konteynerini Yayınlama
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    });

    const publishResponse = await fetch(`https://graph.facebook.com/${instagramApiVersion}/me/media_publish`, {
      method: 'POST',
      body: publishParams,
    });

    const publishData = await publishResponse.json();

    if (!publishResponse.ok || publishData.error) {
      console.error('Instagram medya yayınlama hatası:', publishData.error);
      throw new Error(`Instagram API Hatası (Yayınlama): ${publishData.error?.message || 'Bilinmeyen hata'}`);
    }
    
    const instagramPostId = publishData.id;
    console.log(`Gönderi (ID: ${post.id}) Instagram'a başarıyla gönderildi (GERÇEK API DENEMESİ). Instagram Post ID: ${instagramPostId}`);
    return { 
      success: true, 
      message: `Gönderi (ID: ${post.id}) başarıyla Instagram'da yayınlandı (TEST). Instagram Post ID: ${instagramPostId}`,
      instagramPostId: instagramPostId
    };

  } catch (error) {
    console.error(`Gönderi (ID: ${post.id}) Instagram'a gönderilemedi (GERÇEK API DENEMESİ):`, error);
    if (error instanceof Error) {
      return { success: false, message: `Gönderi paylaşılamadı (TEST): ${error.message}` };
    }
    return { success: false, message: `Gönderi paylaşılamadı (TEST): Bilinmeyen bir API hatası oluştu.` };
  }
}
