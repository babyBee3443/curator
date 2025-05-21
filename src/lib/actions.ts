
'use server';
import { suggestSingleContentIdea as suggestSingleContentIdeaFlow, type SuggestSingleContentIdeaOutput } from '@/ai/flows/suggest-content-ideas';
import { generatePostCaption as generatePostCaptionFlow, type GeneratePostCaptionInput, type GeneratePostCaptionOutput } from '@/ai/flows/generate-post-captions';
import { optimizePostHashtags as optimizePostHashtagsFlow, type OptimizePostHashtagsInput, type OptimizePostHashtagsOutput } from '@/ai/flows/optimize-post-hashtags';
import { generatePostImage as generatePostImageFlow, type GeneratePostImageInput, type GeneratePostImageOutput } from '@/ai/flows/generate-post-image';

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

    // Resim ve başlık üretimini paralelleştiriyoruz.
    const [imageResult, captionResult] = await Promise.all([
      generatePostImageFlow({ prompt: idea.topic }), // SADECE KONUYU GÖNDER
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
