
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

export async function sharePostToInstagramAction(post: Post, accessToken?: string): Promise<{ success: boolean; message: string }> {
  console.log(`Instagram'da paylaşılmak üzere alınan gönderi (ID: ${post.id})`);

  if (!accessToken) {
    console.error(`Gönderi (ID: ${post.id}) paylaşılamadı: Erişim Belirteci (Access Token) eksik.`);
    throw new Error(`Erişim Belirteci (Access Token) eksik. Lütfen Ayarlar sayfasından belirtecinizi girin (Sadece Test Amaçlı!).`);
  }

  console.log(`Kullanılacak Erişim Belirteci (SİMÜLASYON - İlk 10 karakter): ${accessToken.substring(0, 10)}...`);
  console.log('Gönderi verileri (SİMÜLASYON):', {
    caption: post.caption,
    imageUrl: post.imageUrl ? post.imageUrl.substring(0, 60) + '...' : 'No image URL', // Data URI'ler çok uzun olabilir
    hashtags: post.hashtags,
  });

  // SİMÜLASYON: Burada gerçek Instagram API çağrısı yapılırdı.
  // Örnek:
  // const instagramApiUrl = `https://graph.facebook.com/v19.0/me/media`;
  // const response = await fetch(instagramApiUrl, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     image_url: post.imageUrl, // veya video_url
  //     caption: `${post.caption}\n\n${post.hashtags.map(h => `#${h}`).join(' ')}`,
  //     access_token: accessToken,
  //   }),
  // });
  // const data = await response.json();
  // if (!response.ok || data.error) { throw new Error(data.error?.message || 'Instagram API hatası'); }
  // Ardından media_publish çağrısı gerekebilir.

  await new Promise(resolve => setTimeout(resolve, 1500)); // API çağrısını simüle etmek için gecikme
  const isSuccess = Math.random() > 0.1; // %90 başarı şansı simülasyonu

  if (isSuccess) {
    console.log(`Gönderi (ID: ${post.id}) Instagram'a başarıyla gönderildi (SİMÜLASYON).`);
    return { success: true, message: `Gönderi (ID: ${post.id}) başarıyla paylaşıldı (Simülasyon). Belirteç kullanıldı.` };
  } else {
    console.error(`Gönderi (ID: ${post.id}) Instagram'a gönderilemedi (SİMÜLASYON).`);
    throw new Error(`Gönderi (ID: ${post.id}) paylaşılamadı. Ağ hatası veya API sorunu olabilir (Simülasyon).`);
  }
}


// --- Instagram Bağlantısı için ESKİ Yer Tutucu Eylemler (Artık doğrudan Ayarlar sayfasında yönetiliyor) ---
// Bu eylemler artık Ayarlar sayfasındaki istemci tarafı mantıkla ele alındığı için kaldırılabilir veya yorum satırına alınabilir.
// Şimdilik referans olarak bırakıyorum ama aktif olarak kullanılmıyorlar.

// export async function getInstagramConnectionStatusAction(): Promise<{ connected: boolean; username: string | null; error?: string }> {
//   console.warn('getInstagramConnectionStatusAction çağrıldı - BU BİR SİMÜLASYONDUR.');
//   return { connected: false, username: null };
// }

// export async function initiateInstagramOAuthAction(): Promise<{ redirectUrl?: string; error?: string }> {
//   console.warn('initiateInstagramOAuthAction çağrıldı - BU BİR SİMÜLASYONDUR.');
//   return { error: 'Instagram OAuth akışı başlatma özelliği henüz tam olarak uygulanmadı.' };
// }

// export async function completeInstagramOAuthAction(code: string): Promise<{ success: boolean; username?: string; error?: string }> {
//   console.warn('completeInstagramOAuthAction çağrıldı - BU BİR SİMÜLASYONDUR.');
//   if (code) {
//     return { success: true, username: 'simulated_user' };
//   }
//   return { success: false, error: 'Geçersiz yetkilendirme kodu (Simülasyon).' };
// }

// export async function disconnectInstagramAction(): Promise<{ success: boolean; error?: string }> {
//   console.warn('disconnectInstagramAction çağrıldı - BU BİR SİMÜLASYONDUR.');
//   return { success: true };
// }

    