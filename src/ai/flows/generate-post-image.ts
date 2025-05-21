
'use server';
/**
 * @fileOverview Instagram gönderileri için yapay zeka ile resim oluşturur.
 *
 * - generatePostImage - Gönderi resmi oluşturan bir işlev.
 * - GeneratePostImageInput - generatePostImage işlevi için giriş türü.
 * - GeneratePostImageOutput - generatePostImage işlevi için dönüş türü.
 */

import {ai} from '@/ai/genkit';
import {z}  from 'genkit';

const GeneratePostImageInputSchema = z.object({
  prompt: z.string().describe('Resim oluşturmak için kullanılacak KISA konu başlığı (örneğin sadece "Kara Delikler" veya "Mars Yüzeyi").'),
});
export type GeneratePostImageInput = z.infer<typeof GeneratePostImageInputSchema>;

const GeneratePostImageOutputSchema = z.object({
  imageUrl: z.string().describe("Oluşturulan resmin data URI'si. Format: 'data:image/png;base64,<encoded_data>'."),
});
export type GeneratePostImageOutput = z.infer<typeof GeneratePostImageOutputSchema>;

export async function generatePostImage(input: GeneratePostImageInput): Promise<GeneratePostImageOutput> {
  return generatePostImageFlow(input);
}

// Bu akış, bir metin isteminden resim oluşturmak için Gemini 2.0 Flash Experimental modelini kullanır.
const generatePostImageFlow = ai.defineFlow(
  {
    name: 'generatePostImageFlow',
    inputSchema: GeneratePostImageInputSchema,
    outputSchema: GeneratePostImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp', // Resim oluşturma için bu model kullanılmalıdır.
      prompt: `"${input.prompt}" konusunu ifade eden, bilim, teknoloji veya uzay temalı, canlı ve yüksek kaliteli bir görsel oluştur. Fotoğraf gerçekçiliğinde veya dijital sanat tarzında olabilir. ÇOK ÖNEMLİ: Bu görselde KESİNLİKLE hiçbir metin, yazı, harf, rakam, sayı veya logo OLMAMALIDIR. Sadece ve sadece görsel öğeler içermelidir. Tamamen yazısız, saf bir resim.`,
      config: {
        responseModalities: ['IMAGE', 'TEXT'], // Hem resim hem de metin modaliteleri gereklidir.
        // safetySettings: [
        //   {
        //     category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        //     threshold: 'BLOCK_NONE',
        //   },
        // ],
      },
    });

    if (!media || !media.url) {
      throw new Error('Resim oluşturulamadı veya geçersiz resim verisi alındı.');
    }
    return { imageUrl: media.url };
  }
);

