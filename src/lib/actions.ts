'use server';
import { suggestContentIdeas as suggestContentIdeasFlow, type SuggestContentIdeasOutput } from '@/ai/flows/suggest-content-ideas';
import { generatePostCaption as generatePostCaptionFlow, type GeneratePostCaptionInput, type GeneratePostCaptionOutput } from '@/ai/flows/generate-post-captions';
import { optimizePostHashtags as optimizePostHashtagsFlow, type OptimizePostHashtagsInput, type OptimizePostHashtagsOutput } from '@/ai/flows/optimize-post-hashtags';

export async function suggestIdeasAction(): Promise<SuggestContentIdeasOutput> {
  try {
    return await suggestContentIdeasFlow({});
  } catch (error) {
    console.error('İçerik fikirleri önerilirken hata oluştu:', error);
    return { ideas: [] };
  }
}

export async function generateCaptionAction(input: GeneratePostCaptionInput): Promise<GeneratePostCaptionOutput> {
  try {
    return await generatePostCaptionFlow(input);
  } catch (error) {
    console.error('Gönderi başlığı oluşturulurken hata oluştu:', error);
    return { caption: 'Başlık oluşturulurken hata. Lütfen tekrar deneyin.' };
  }
}

export async function optimizeHashtagsAction(input: OptimizePostHashtagsInput): Promise<OptimizePostHashtagsOutput> {
  try {
    return await optimizePostHashtagsFlow(input);
  } catch (error) {
    console.error('Hashtag\'ler optimize edilirken hata oluştu:', error);
    return { hashtags: [] };
  }
}
