// OptimizePostHashtags.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow to optimize hashtags for an Instagram post.
 *
 * - `optimizePostHashtags` - The main function to call to get optimized hashtags.
 * - `OptimizePostHashtagsInput` - The input type for the `optimizePostHashtags` function.
 * - `OptimizePostHashtagsOutput` - The output type for the `optimizePostHashtags` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizePostHashtagsInputSchema = z.object({
  postCaption: z
    .string()
    .describe('The caption of the Instagram post for which hashtags need to be optimized.'),
  topic: z
    .string()
    .describe('The topic of the post. e.g. science, technology, space.'),
});
export type OptimizePostHashtagsInput = z.infer<typeof OptimizePostHashtagsInputSchema>;

const OptimizePostHashtagsOutputSchema = z.object({
  hashtags: z
    .array(z.string())
    .describe('An array of optimized hashtags for the given Instagram post.'),
});

export type OptimizePostHashtagsOutput = z.infer<typeof OptimizePostHashtagsOutputSchema>;

export async function optimizePostHashtags(input: OptimizePostHashtagsInput): Promise<OptimizePostHashtagsOutput> {
  return optimizePostHashtagsFlow(input);
}

const optimizePostHashtagsPrompt = ai.definePrompt({
  name: 'optimizePostHashtagsPrompt',
  input: {schema: OptimizePostHashtagsInputSchema},
  output: {schema: OptimizePostHashtagsOutputSchema},
  prompt: `You are an expert in social media marketing, specializing in hashtag optimization for Instagram.
  Given the following Instagram post caption and topic, provide a list of relevant and high-engagement hashtags.
  The hashtags should be directly related to the content of the post and trending within the specified topic.

  Topic: {{{topic}}}
  Post Caption: {{{postCaption}}}

  Return ONLY an array of hashtags.  Do not include any other text in your response.
  `,
});

const optimizePostHashtagsFlow = ai.defineFlow(
  {
    name: 'optimizePostHashtagsFlow',
    inputSchema: OptimizePostHashtagsInputSchema,
    outputSchema: OptimizePostHashtagsOutputSchema,
  },
  async input => {
    const {output} = await optimizePostHashtagsPrompt(input);
    return output!;
  }
);
