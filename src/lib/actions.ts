
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

// Bu eylemler mevcut işlevsellik için korunuyor, ancak yeni UI doğrudan bunları kullanmıyor olabilir.
export async function generateCaptionAction(input: GeneratePostCaptionInput): Promise<GeneratePostCaptionOutput> {
  try {
    return await generatePostCaptionFlow(input);
  } catch (error) {
    console.error('Gönderi başlığı oluşturulurken hata oluştu:', error);
    throw new Error('Yapay zeka başlık oluştururken bir sorunla karşılaştı. Lütfen konu ve anahtar bilgileri kontrol edip tekrar deneyin.');
  }
}

export async function optimizeHashtagsAction(input: OptimizePostHashtagsInput): Promise<OptimizePostHashtagsOutput> {
  try {
    return await optimizePostHashtagsFlow(input);
  } catch (error) {
    console.error('Hashtag\'ler optimize edilirken hata oluştu:', error);
    throw new Error('Yapay zeka hashtagleri optimize ederken bir sorunla karşılaştı. Lütfen başlığın ve konunun dolu olduğundan emin olun.');
  }
}

export async function generateImageAction(input: GeneratePostImageInput): Promise<GeneratePostImageOutput> {
  try {
    return await generatePostImageFlow(input);
  } catch (error) {
    console.error('Resim oluşturulurken hata oluştu:', error);
    throw new Error('Yapay zeka resim oluştururken bir sorunla karşılaştı. Lütfen isteminizi kontrol edip tekrar deneyin veya farklı bir konu deneyin.');
  }
}

export async function sharePostToInstagramAction(post: Post): Promise<{ success: boolean; message: string }> {
  console.log(`Instagram'da paylaşılmak üzere alınan gönderi (ID: ${post.id}):`, {
    caption: post.caption,
    imageUrl: post.imageUrl ? post.imageUrl.substring(0, 100) + '...' : 'No image URL',
    hashtags: post.hashtags,
  });

  await new Promise(resolve => setTimeout(resolve, 1500));
  const isSuccess = Math.random() > 0.1; // %90 başarı şansı simülasyonu

  if (isSuccess) {
    console.log(`Gönderi (ID: ${post.id}) Instagram'a başarıyla gönderildi (SİMÜLASYON).`);
    return { success: true, message: `Gönderi (ID: ${post.id}) başarıyla paylaşıldı (Simülasyon).` };
  } else {
    console.error(`Gönderi (ID: ${post.id}) Instagram'a gönderilemedi (SİMÜLASYON).`);
    throw new Error(`Gönderi (ID: ${post.id}) paylaşılamadı. Ağ hatası veya API sorunu olabilir (Simülasyon).`);
  }
}

// --- Instagram Bağlantısı için Yer Tutucu Eylemler ---

export async function getInstagramConnectionStatusAction(): Promise<{ connected: boolean; username: string | null; error?: string }> {
  console.warn('getInstagramConnectionStatusAction çağrıldı - BU BİR SİMÜLASYONDUR.');
  // Gerçek bir uygulamada, burada güvenli bir şekilde saklanan OAuth token'ları vb. kontrol edilir.
  // Şimdilik, örneğin bir veritabanı veya güvenli sunucu tarafı depolama olmadığını varsayalım.
  // Bu fonksiyonun istemci tarafında simüle edilmesi daha uygun olabilir (localStorage ile)
  // ya da backend'de gerçek bir durum yönetimi gerektirir.
  // Örnek olarak her zaman "bağlı değil" döndürelim ki UI'da mantığı görebilelim.
  return { connected: false, username: null };
}

export async function initiateInstagramOAuthAction(): Promise<{ redirectUrl?: string; error?: string }> {
  console.warn('initiateInstagramOAuthAction çağrıldı - BU BİR SİMÜLASYONDUR.');
  // Gerçek bir uygulamada, bu fonksiyon Instagram OAuth için bir yönlendirme URL'si oluşturur
  // ve bunu istemciye döndürür. İstemci kullanıcıyı bu URL'ye yönlendirir.
  // Örn: return { redirectUrl: 'https://api.instagram.com/oauth/authorize?client_id=...' };
  return { error: 'Instagram OAuth akışı başlatma özelliği henüz tam olarak uygulanmadı.' };
}

export async function completeInstagramOAuthAction(code: string): Promise<{ success: boolean; username?: string; error?: string }> {
  console.warn('completeInstagramOAuthAction çağrıldı - BU BİR SİMÜLASYONDUR.');
  // Instagram'dan geri dönen `code` ile access token alınır ve güvenli bir şekilde saklanır.
  // Kullanıcı adı gibi bilgiler de alınabilir.
  if (code) {
    // Simülasyon: Başarılı
    return { success: true, username: 'simulated_user' };
  }
  return { success: false, error: 'Geçersiz yetkilendirme kodu (Simülasyon).' };
}

export async function disconnectInstagramAction(): Promise<{ success: boolean; error?: string }> {
  console.warn('disconnectInstagramAction çağrıldı - BU BİR SİMÜLASYONDUR.');
  // Saklanan token'lar silinir/geçersiz kılınır.
  return { success: true };
}
