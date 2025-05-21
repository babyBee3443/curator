// use server'

/**
 * @fileOverview Content suggestion flow for generating Instagram post ideas in science, technology, and space.
 *
 * - suggestContentIdeas - A function that suggests content ideas.
 * - SuggestContentIdeasInput - The input type for the suggestContentIdeas function.
 * - SuggestContentIdeasOutput - The return type for the suggestContentIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestContentIdeasInputSchema = z.object({}).describe('No input required.');
export type SuggestContentIdeasInput = z.infer<typeof SuggestContentIdeasInputSchema>;

const SuggestContentIdeasOutputSchema = z.object({
  ideas: z
    .array(z.string())
    .describe('An array of content ideas related to science, technology, and space.'),
});
export type SuggestContentIdeasOutput = z.infer<typeof SuggestContentIdeasOutputSchema>;

export async function suggestContentIdeas(): Promise<SuggestContentIdeasOutput> {
  return suggestContentIdeasFlow({});
}

const prompt = ai.definePrompt({
  name: 'suggestContentIdeasPrompt',
  input: {schema: SuggestContentIdeasInputSchema},
  output: {schema: SuggestContentIdeasOutputSchema},
  prompt: `You are an AI assistant designed to provide engaging content ideas for an Instagram account focused on science, technology, and space.

  Provide a list of trending topics and innovative ideas suitable for Instagram posts. The ideas should be formatted as a list.
  Consider the current events, recent discoveries, and popular discussions in these fields.

  Output the response as a numbered list of concise and engaging content ideas. Focus on ideas that are likely to generate high engagement on Instagram.
  `,
});

const suggestContentIdeasFlow = ai.defineFlow(
  {
    name: 'suggestContentIdeasFlow',
    inputSchema: SuggestContentIdeasInputSchema,
    outputSchema: SuggestContentIdeasOutputSchema,
  },
  async () => {
    const {output} = await prompt({});
    return output!;
  }
);
