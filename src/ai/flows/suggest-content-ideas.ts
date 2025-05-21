'use server';

/**
 * @fileOverview Bilim, teknoloji ve uzay alanlarında Instagram gönderi fikirleri üretmek için içerik öneri akışı.
 *
 * - suggestContentIdeas - İçerik fikirleri öneren bir işlev.
 * - SuggestContentIdeasInput - suggestContentIdeas işlevi için giriş türü.
 * - SuggestContentIdeasOutput - suggestContentIdeas işlevi için dönüş türü.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestContentIdeasInputSchema = z.object({}).describe('Giriş gerekmez.');
export type SuggestContentIdeasInput = z.infer<typeof SuggestContentIdeasInputSchema>;

const SuggestContentIdeasOutputSchema = z.object({
  ideas: z
    .array(z.string())
    .describe('Bilim, teknoloji ve uzay ile ilgili içerik fikirleri dizisi.'),
});
export type SuggestContentIdeasOutput = z.infer<typeof SuggestContentIdeasOutputSchema>;

export async function suggestContentIdeas(): Promise<SuggestContentIdeasOutput> {
  return suggestContentIdeasFlow({});
}

const prompt = ai.definePrompt({
  name: 'suggestContentIdeasPrompt',
  input: {schema: SuggestContentIdeasInputSchema},
  output: {schema: SuggestContentIdeasOutputSchema},
  prompt: `Siz, bilim, teknoloji ve uzay odaklı bir Instagram hesabı için ilgi çekici içerik fikirleri sağlamak üzere tasarlanmış bir yapay zeka asistanısınız.

  Instagram gönderileri için uygun, trend olan konuların ve yenilikçi fikirlerin bir listesini sağlayın. Fikirler liste halinde biçimlendirilmelidir.
  Bu alanlardaki güncel olayları, son keşifleri ve popüler tartışmaları dikkate alın.

  Yanıtı, kısa ve ilgi çekici içerik fikirlerinin numaralandırılmış bir listesi olarak verin. Instagram'da yüksek etkileşim oluşturması muhtemel fikirlere odaklanın.
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
