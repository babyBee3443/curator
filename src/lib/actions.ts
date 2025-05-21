
'use server';
import { suggestContentIdeas as suggestContentIdeasFlow, type SuggestContentIdeasOutput } from '@/ai/flows/suggest-content-ideas';
import { generatePostCaption as generatePostCaptionFlow, type GeneratePostCaptionInput, type GeneratePostCaptionOutput } from '@/ai/flows/generate-post-captions';
import { optimizePostHashtags as optimizePostHashtagsFlow, type OptimizePostHashtagsInput, type OptimizePostHashtagsOutput } from '@/ai/flows/optimize-post-hashtags';
import { generatePostImage as generatePostImageFlow, type GeneratePostImageInput, type GeneratePostImageOutput } from '@/ai/flows/generate-post-image';

export async function suggestIdeasAction(): Promise<SuggestContentIdeasOutput> {
  try {
    return await suggestContentIdeasFlow({});
  } catch (error) {
    console.error('İçerik fikirleri önerilirken hata oluştu:', error);
    // Kullanıcıya daha açıklayıcı bir hata mesajı döndürebiliriz.
    throw new Error('Yapay zeka içerik fikirleri önerirken bir sorunla karşılaştı. Lütfen daha sonra tekrar deneyin.');
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
