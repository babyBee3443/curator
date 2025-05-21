
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

    // 2. Resim ve Başlık Üretimini Paralelleştir
    const [imageResult, captionResult] = await Promise.all([
      generatePostImageFlow({ prompt: idea.topic }), // SADECE KISA KONUYU GÖNDER
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

// Yeni Placeholder Eylem: Instagram'da Paylaşım Simülasyonu
export async function sharePostToInstagramAction(post: Post): Promise<{ success: boolean; message: string }> {
  console.log(`Instagram'da paylaşılmak üzere alınan gönderi (ID: ${post.id}):`, {
    caption: post.caption,
    imageUrl: post.imageUrl ? post.imageUrl.substring(0, 50) + '...' : 'No image URL', // Sadece başını logla
    hashtags: post.hashtags,
  });

  // Burada gerçek Instagram API çağrısı yapılacaktır.
  // Şimdilik sadece bir simülasyon yapıyoruz.
  // TODO: Gerçek Instagram API entegrasyonunu buraya ekleyin.

  // Simülasyon için rastgele bir gecikme ve sonuç
  await new Promise(resolve => setTimeout(resolve, 1500));

  const isSuccess = Math.random() > 0.2; // %80 başarı şansı simülasyonu

  if (isSuccess) {
    console.log(`Gönderi (ID: ${post.id}) Instagram'a başarıyla gönderildi (SİMÜLASYON).`);
    return { success: true, message: `Gönderi (ID: ${post.id}) Instagram'a başarıyla gönderildi (SİMÜLASYON).` };
  } else {
    console.error(`Gönderi (ID: ${post.id}) Instagram'a gönderilemedi (SİMÜLASYON).`);
    throw new Error(`Gönderi (ID: ${post.id}) Instagram'a gönderilemedi. Lütfen daha sonra tekrar deneyin (SİMÜLASYON).`);
  }
}
