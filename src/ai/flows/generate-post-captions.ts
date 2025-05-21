
'use server';
/**
 * @fileOverview Gönderiler için ilgi çekici ve bilgilendirici başlıklar oluşturur.
 *
 * - generatePostCaption - Gönderi başlığı oluşturan bir işlev.
 * - GeneratePostCaptionInput - generatePostCaption işlevi için giriş türü.
 * - GeneratePostCaptionOutput - generatePostCaption işlevi için dönüş türü.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePostCaptionInputSchema = z.object({
  topic: z.string().describe('Gönderinin konusu.'),
  keyInformation: z.string().describe('Gönderiye dahil edilecek anahtar bilgiler.'),
});
export type GeneratePostCaptionInput = z.infer<typeof GeneratePostCaptionInputSchema>;

const GeneratePostCaptionOutputSchema = z.object({
  caption: z.string().describe('Gönderi için oluşturulan başlık.'),
});
export type GeneratePostCaptionOutput = z.infer<typeof GeneratePostCaptionOutputSchema>;

export async function generatePostCaption(input: GeneratePostCaptionInput): Promise<GeneratePostCaptionOutput> {
  return generatePostCaptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePostCaptionPrompt',
  input: {schema: GeneratePostCaptionInputSchema},
  output: {schema: GeneratePostCaptionOutputSchema},
  prompt: `Sen, bilim, teknoloji ve uzay temalı Instagram gönderileri için son derece ilgi çekici, bilgilendirici ve kolay anlaşılır başlıklar oluşturan bir yapay zeka uzmanısın. 🚀🌌🔬

  Görevin:
  1.  Canlı bir açılışla başla.
  2.  Sağlanan anahtar bilgileri ({{{keyInformation}}}) kullanarak konuyu ({{{topic}}}) detaylıca açıkla.
  3.  Eğer metin içinde **çok bilinmeyen veya karmaşık bir bilimsel/teknolojik terim** geçiyorsa, bu terimi **parantez içinde basit ve anlaşılır bir dille açıkla**. Örneğin: "kara delik (çok güçlü kütleçekimi olan gök cismi)" veya "ışık yılı (ışığın bir yılda katettiği muazzam uzaklık)".
  4.  Başlığı, okuyucunun konu hakkında daha fazla düşünmesini veya merak etmesini sağlayacak bir soru veya ifadeyle bitir. Doğrudan "Yorumlarda bize bildirin" veya "Ne düşünüyorsunuz?" gibi ifadelerden kaçın; daha yaratıcı ol. Örneğin: "Bu gelişme sizce gelecekte neleri değiştirebilir? 🤔" veya "Bu konu hakkında daha fazla ne öğrenmek istersiniz? ✨".
  5.  Başlığın tamamında, anlamı güçlendirecek ve gönderiyi daha çekici hale getirecek **uygun ve bolca emoji** kullanmaktan çekinme! 😄🌟💡🛰️🌠

  Konu: {{{topic}}}
  Anahtar Bilgiler: {{{keyInformation}}}

  Başlık akıcı, bilgilendirici olmalı ve Instagram formatına uygun bir şekilde etkileşimi teşvik etmelidir.
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
