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
  prompt: `Siz, Instagram gönderileri için ilgi çekici ve bilgilendirici başlıklar oluşturmak üzere tasarlanmış bir yapay zeka asistanısınız.

  Amacınız, bir açılış, anahtar bilgiler ve bir eylem çağrısı içeren bir başlık oluşturmaktır.
  Gönderi şu konuya odaklanmaktadır: {{{topic}}}.

  Şu anahtar bilgileri dahil edin: {{{keyInformation}}}

  Başlık kısa, bilgilendirici olmalı ve etkileşimi teşvik etmelidir.
  İlgili emojileri ekleyin.
  "Ne düşünüyorsunuz?", "Yorumlarda bize bildirin!" veya benzeri bir eylem çağrısıyla bitirin.
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
