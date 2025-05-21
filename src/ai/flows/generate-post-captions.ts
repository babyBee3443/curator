'use server';
/**
 * @fileOverview Generates engaging and informative captions for posts.
 *
 * - generatePostCaption - A function that generates a post caption.
 * - GeneratePostCaptionInput - The input type for the generatePostCaption function.
 * - GeneratePostCaptionOutput - The return type for the generatePostCaption function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePostCaptionInputSchema = z.object({
  topic: z.string().describe('The topic of the post.'),
  keyInformation: z.string().describe('Key information to include in the post.'),
});
export type GeneratePostCaptionInput = z.infer<typeof GeneratePostCaptionInputSchema>;

const GeneratePostCaptionOutputSchema = z.object({
  caption: z.string().describe('The generated caption for the post.'),
});
export type GeneratePostCaptionOutput = z.infer<typeof GeneratePostCaptionOutputSchema>;

export async function generatePostCaption(input: GeneratePostCaptionInput): Promise<GeneratePostCaptionOutput> {
  return generatePostCaptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePostCaptionPrompt',
  input: {schema: GeneratePostCaptionInputSchema},
  output: {schema: GeneratePostCaptionOutputSchema},
  prompt: `You are an AI assistant designed to create engaging and informative captions for Instagram posts.

  Your goal is to generate a caption that includes an opening, key information, and a call to action.
  The post focuses on the topic: {{{topic}}}.

  Incorporate this key information: {{{keyInformation}}}

  The caption should be concise, informative, and encourage interaction.
  Include relevant emojis.
  End with a call to action such as "What do you think?", "Let us know in the comments!", or similar.
  `,
});

const generatePostCaptionFlow = ai.defineFlow(
  {
    name: 'generatePostCaptionFlow',
    inputSchema: GeneratePostCaptionInputSchema,
    outputSchema: GeneratePostCaptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
