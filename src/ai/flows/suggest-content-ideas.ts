
'use server';

/**
 * @fileOverview Belirtilen persona ve stillere uygun olarak Instagram için tam teşekküllü tek bir gönderi fikri üretir.
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
      'Gönderinin 3-5 kelimelik kısa ve öz konusu/başlığı. Diğer AI modelleri (başlık, hashtag, resim) için de kullanılacak. Önerilen konunun aşağıdaki 6 stilden hangisine uyduğunu açıkça belirtmelidir (Örn: "Gündelik Teknoloji: Makasın İcadı" veya "Donanım Gerçeği: CPU Saat Hızları").'
    ),
  keyInformation: z
    .string()
    .describe(
      'Bu konu hakkında, yaklaşık 100-150 kelimelik bilgilendirici, net, gerçeğe dayalı ve ilgi çekici bir gönderi metni oluşturmak için temel teşkil edecek ZENGİN ve DETAYLI bilgi. Bu metin, hem nihai gönderi başlığına temel oluşturacak hem de resim üretme istemi için yeterli detayı içermelidir. Tüm bilgilerin kamuya açık ve doğrulanabilir kaynaklardan geldiğinden emin ol.'
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
  prompt: `Sen, genel teknoloji, bilim ve insan icatları hakkında şaşırtıcı, doğrulanmış ve ilgi çekici gönderiler oluşturma konusunda uzmanlaşmış, son derece zeki ve gerçeklere dayalı bir içerik üretici yapay zekasın. Görevin, bir Instagram hesabı için içerik oluşturmak.

LÜTFEN AŞAĞIDAKİ TARZLARDAN BİRİNİ SEÇEREK **TEK BİR** GÖNDERİ FİKRİ ÜRET:

1.  **Gündelik Teknoloji Hakkında Büyüleyici Gerçekler:** (Örn: Makas nasıl icat edildi, QWERTY klavyeler neden var?)
2.  **Yaygın Cihazlarda Şaşırtıcı Kısayollar veya İpuçları:** (Bilgisayarlar, telefonlar vb. için)
3.  **Donanım Hakkında Bilinmeyen Gerçekler:** (CPU'lar, GPU'lar, RAM, klavyeler vb.)
4.  **Aletlerin ve Makinelerin Evrimi:** (Antik çağlardan modern zamanlara)
5.  **Gelişmekte Olan Teknolojilerin Harika Kullanım Alanları:** (Yapay zeka, robotik vb. - POLİTİK VEYA DOĞRULANMAMIŞ İDDİALAR KESİNLİKLE YOKTUR. Sadece doğrulanmış ve tarafsız bilgiler.)
6.  **Gündelik Aletler, Cihazlar Hakkında Eğlenceli ve Garip Gerçekler:**

Üreteceğin fikir şunları içermelidir:
1.  \`topic\`: Gönderinin 3-5 kelimelik kısa ve öz konusu/başlığı. Bu, diğer AI modelleri (başlık, hashtag, resim) için de kullanılacak. Önerilen konunun yukarıdaki 6 stilden hangisine uyduğunu belirtmelidir (Örn: "Gündelik Teknoloji: Makasın İcadı" veya "Donanım Gerçeği: CPU Saat Hızları").
2.  \`keyInformation\`: Bu konu hakkında, yaklaşık 100-150 kelimelik bilgilendirici, net, gerçeğe dayalı ve ilgi çekici bir gönderi metni oluşturmak için temel teşkil edecek ZENGİN ve DETAYLI bilgi. Bu metin, hem nihai gönderi başlığına temel oluşturacak hem de resim üretme istemi için yeterli detayı içermelidir. Tüm bilgilerin kamuya açık ve doğrulanabilir kaynaklardan geldiğinden emin ol.

Lütfen sadece bu iki alanı içeren bir JSON nesnesi döndür. Yanıtında başka hiçbir açıklama veya metin olmasın.
Örnek Çıktı Formatı:
{
  "topic": "Gündelik Teknoloji: QWERTY Klavyenin Kökeni",
  "keyInformation": "QWERTY klavye düzeni, yazma hızını yavaşlatmak için değil, aslında mekanik daktilolardaki harf kollarının birbirine takılmasını önlemek için tasarlanmıştır. Christopher Latham Sholes tarafından 1870'lerde geliştirilen bu düzen, sık kullanılan harf çiftlerini birbirinden uzaklaştırarak sıkışmaları azaltmayı hedefliyordu. Günümüzde dijital klavyelerde bu mekanik kısıtlama olmamasına rağmen, QWERTY alışkanlık ve yaygınlık nedeniyle standart olarak kalmıştır. Bu durum, 'path dependence' (yola bağımlılık) kavramının ilginç bir örneğidir."
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
