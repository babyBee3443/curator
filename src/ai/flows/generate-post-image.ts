
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
  prompt: z.string().describe('Resim oluşturmak için kullanılacak metin istemi (örneğin gönderi konusu veya anahtar bilgiler).'),
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
      prompt: `Bir Instagram gönderisi için canlı ve çekici bir resim oluştur: ${input.prompt}. Resim, bilim, teknoloji veya uzay temasıyla alakalı olmalı. Fotoğraf gerçekçiliğinde veya dijital sanat tarzında olabilir.`,
      config: {
        responseModalities: ['IMAGE', 'TEXT'], // Hem resim hem de metin modaliteleri gereklidir.
        // Gerekirse güvenlik ayarları eklenebilir.
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
    // Gemini 2.0 Flash Exp genellikle image/png döndürür.
    return { imageUrl: media.url };
  }
);
