'use server';

/**
 * @fileOverview Bilim, teknoloji ve uzay alanlarında Instagram için tam teşekküllü tek bir gönderi fikri üretir.
 *
 * - suggestSingleContentIdea - Tek bir yapılandırılmış içerik fikri öneren bir işlev.
 * - SuggestSingleContentIdeaOutput - suggestSingleContentIdea işlevi için dönüş türü.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Giriş gerekmiyor, bu yüzden boş bir şema kullanabiliriz veya input'u kaldırabiliriz.
const SuggestSingleContentIdeaInputSchema = z.object({}).describe('Giriş gerekmez.');

const SuggestSingleContentIdeaOutputSchema = z.object({
  topic: z
    .string()
    .describe(
      'Gönderinin kısa, öz konusu/başlığı. Diğer AI modelleri için de kullanılacak.'
    ),
  keyInformation: z
    .string()
    .describe(
      'Konu hakkında detaylı, ilgi çekici bilgi. Bu metin, hem resim üretme istemi hem de daha detaylı bir başlık oluşturma istemi olarak kullanılabilecek kadar zengin olmalıdır.'
    ),
});
export type SuggestSingleContentIdeaOutput = z.infer<
  typeof SuggestSingleContentIdeaOutputSchema
>;

export async function suggestSingleContentIdea(): Promise<SuggestSingleContentIdeaOutput> {
  return suggestSingleContentIdeaFlow({});
}

const prompt = ai.definePrompt({
  name: 'suggestSingleContentIdeaPrompt',
  input: {schema: SuggestSingleContentIdeaInputSchema},
  output: {schema: SuggestSingleContentIdeaOutputSchema},
  prompt: `Sen, bilim, teknoloji ve uzay odaklı bir Instagram hesabı için **tek bir** tam teşekküllü gönderi fikri üretmekle görevli bir yapay zeka asistanısın.
  Lütfen sadece bilim, teknoloji veya uzay konularından birini seç.
  Üreteceğin fikir şunları içermelidir:
  1.  \`topic\`: Gönderinin 3-5 kelimelik kısa ve öz konusu/başlığı. Bu, hashtag optimizasyonu için de kullanılacak.
  2.  \`keyInformation\`: Bu konu hakkında 2-3 cümlelik ilgi çekici, bilgilendirici ve Instagram formatına uygun bir metin. Bu metin, aynı zamanda bir resim üretme istemi ve daha detaylı bir başlık (caption) oluşturma istemi olarak da kullanılabilecek kadar spesifik ve zengin olmalıdır.

  Lütfen sadece bu iki alanı içeren bir JSON nesnesi döndür. Yanıtında başka hiçbir açıklama veya metin olmasın.
  Örnek Çıktı Formatı:
  {
    "topic": "Mars Yüzeyindeki Su İzleri",
    "keyInformation": "NASA'nın son keşifleri, Mars'ın geçmişte sıvı suya ev sahipliği yapmış olabileceğine dair güçlü kanıtlar sunuyor. Perseverance gezgini tarafından gönderilen yeni görüntüler, kurumuş nehir yataklarını ve mineral birikintilerini gösteriyor. Bu, kızıl gezegende yaşam olasılığını yeniden gündeme getiriyor."
  }
  `,
});

const suggestSingleContentIdeaFlow = ai.defineFlow(
  {
    name: 'suggestSingleContentIdeaFlow',
    inputSchema: SuggestSingleContentIdeaInputSchema, // Giriş almadığı için boş şema
    outputSchema: SuggestSingleContentIdeaOutputSchema,
  },
  async () => {
    const {output} = await prompt({});
    if (!output?.topic || !output?.keyInformation) {
      throw new Error('Yapay zeka geçerli bir içerik fikri üretemedi.');
    }
    return output;
  }
);
