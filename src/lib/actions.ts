'use server';
import { suggestContentIdeas as suggestContentIdeasFlow, type SuggestContentIdeasOutput } from '@/ai/flows/suggest-content-ideas';
import { generatePostCaption as generatePostCaptionFlow, type GeneratePostCaptionInput, type GeneratePostCaptionOutput } from '@/ai/flows/generate-post-captions';
import { optimizePostHashtags as optimizePostHashtagsFlow, type OptimizePostHashtagsInput, type OptimizePostHashtagsOutput } from '@/ai/flows/optimize-post-hashtags';

export async function suggestIdeasAction(): Promise<SuggestContentIdeasOutput> {
  try {
    return await suggestContentIdeasFlow({});
  } catch (error) {
    console.error('Error suggesting content ideas:', error);
    return { ideas: [] };
  }
}

export async function generateCaptionAction(input: GeneratePostCaptionInput): Promise<GeneratePostCaptionOutput> {
  try {
    return await generatePostCaptionFlow(input);
  } catch (error) {
    console.error('Error generating post caption:', error);
    return { caption: 'Error generating caption. Please try again.' };
  }
}

export async function optimizeHashtagsAction(input: OptimizePostHashtagsInput): Promise<OptimizePostHashtagsOutput> {
  try {
    return await optimizePostHashtagsFlow(input);
  } catch (error) {
    console.error('Error optimizing hashtags:', error);
    return { hashtags: [] };
  }
}
