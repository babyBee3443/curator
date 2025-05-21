
'use server';

import type { Post } from '@/types';
// nodemailer import kaldırıldı

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

// sharePostToInstagramAction basitleştirildi, sadece loglama yapacak yer tutucu.
export async function sharePostToInstagramAction(post: Post): Promise<{ success: boolean; message: string; instagramPostId?: string }> {
  console.log(`Instagram'da paylaşılmak üzere alınan gönderi (SİMÜLASYON - ID: ${post.id})`);
  // Gerçek API çağrısı veya token yönetimi burada olmayacak.
  // Bu fonksiyon, gelecekte gerçek Instagram API entegrasyonu için bir yer tutucudur.
  
  // Simülasyon başarılı mesajı
  const simulatedMessage = `Gönderi (ID: ${post.id}) için Instagram paylaşım simülasyonu tetiklendi. (Gerçek API çağrısı yapılmadı.)`;
  console.log(simulatedMessage);
  
  return { 
    success: true, // Simülasyon her zaman başarılı dönecek
    message: simulatedMessage,
    instagramPostId: `simulated_${Date.now()}` // Simüle edilmiş bir ID
  };
}

// sendContentByEmailAction fonksiyonu tamamen kaldırıldı.

import { suggestSingleContentIdea as suggestSingleContentIdeaFlow } from '@/ai/flows/suggest-content-ideas';
import { generatePostCaption as generatePostCaptionFlow } from '@/ai/flows/generate-post-captions';
import { optimizePostHashtags as optimizePostHashtagsFlow } from '@/ai/flows/optimize-post-hashtags';
import { generatePostImage as generatePostImageFlow } from '@/ai/flows/generate-post-image';
