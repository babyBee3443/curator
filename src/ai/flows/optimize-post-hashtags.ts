'use server';

/**
 * @fileOverview Bu dosya, bir Instagram gönderisi için hashtag'leri optimize etmek üzere bir Genkit akışı tanımlar.
 *
 * - `optimizePostHashtags` - Optimize edilmiş hashtag'leri almak için çağrılacak ana işlev.
 * - `OptimizePostHashtagsInput` - `optimizePostHashtags` işlevi için giriş türü.
 * - `OptimizePostHashtagsOutput` - `optimizePostHashtags` işlevi için çıkış türü.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizePostHashtagsInputSchema = z.object({
  postCaption: z
    .string()
    .describe('Hashtag\'lerinin optimize edilmesi gereken Instagram gönderisinin başlığı.'),
  topic: z
    .string()
    .describe('Gönderinin konusu. örneğin bilim, teknoloji, uzay.'),
});
export type OptimizePostHashtagsInput = z.infer<typeof OptimizePostHashtagsInputSchema>;

const OptimizePostHashtagsOutputSchema = z.object({
  hashtags: z
    .array(z.string())
    .describe('Verilen Instagram gönderisi için optimize edilmiş hashtag dizisi (önünde # olmadan).'),
});

export type OptimizePostHashtagsOutput = z.infer<typeof OptimizePostHashtagsOutputSchema>;

export async function optimizePostHashtags(input: OptimizePostHashtagsInput): Promise<OptimizePostHashtagsOutput> {
  return optimizePostHashtagsFlow(input);
}

const optimizePostHashtagsPrompt = ai.definePrompt({
  name: 'optimizePostHashtagsPrompt',
  input: {schema: OptimizePostHashtagsInputSchema},
  output: {schema: OptimizePostHashtagsOutputSchema},
  prompt: `Siz, Instagram için hashtag optimizasyonu konusunda uzmanlaşmış bir sosyal medya pazarlama uzmanısınız.
  Aşağıdaki Instagram gönderi başlığı ve konusu verildiğinde, ilgili ve yüksek etkileşimli hashtag'lerin bir listesini sağlayın.
  Hashtag'ler gönderinin içeriğiyle doğrudan ilgili olmalı ve belirtilen konuda trend olmalıdır.

  Konu: {{{topic}}}
  Gönderi Başlığı: {{{postCaption}}}

  SADECE bir hashtag dizisi döndürün. Yanıtınıza başka bir metin eklemeyin.
  Döndürülen hashtag'ler '#' sembolünü İÇERMEMELİDİR. Örneğin, "bilim" gibi, "#bilim" değil. Sadece kelimeleri veya kelime gruplarını listeleyin.
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
    // AI'nın yine de # eklemesi ihtimaline karşı burada da temizleyelim.
    if (output && output.hashtags) {
      output.hashtags = output.hashtags.map(tag => tag.replace(/^#+/, '').trim()).filter(tag => tag.length > 0);
    }
    return output!;
  }
);
