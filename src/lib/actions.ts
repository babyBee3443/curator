
'use server';

// Ortam değişkenlerinin Next.js tarafından otomatik olarak yüklenmesi beklenir.
// dotenv.config() çağrısına burada gerek yoktur ve kafa karışıklığına yol açabilir.

import type { Post } from '@/types';
import nodemailer from 'nodemailer';

// Bu loglar, dosya her yüklendiğinde (sunucu başladığında veya dosya değiştiğinde) çalışır.
// Ortam değişkenlerinin Next.js tarafından doğru şekilde yüklenip yüklenmediğini gösterir.
console.log('[ACTIONS.TS] MODÜL YÜKLENDİ - Ortam Değişkenleri Kontrolü (Modül Yüklenirken):');
console.log(`[ACTIONS.TS] > process.env.EMAIL_USER: "${process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0,3) + '...' : 'BULUNAMADI'}"`);
console.log(`[ACTIONS.TS] > process.env.EMAIL_APP_PASSWORD: "${process.env.EMAIL_APP_PASSWORD ? 'DEĞER MEVCUT (gizli)' : 'BULUNAMADI'}"`);


export interface FullPostGenerationOutput {
  topic: string;
  keyInformation: string;
  caption: string;
  hashtags: string[];
  imageUrl: string;
}

export async function generateFullPostAction(): Promise<FullPostGenerationOutput> {
  console.log('[ACTIONS.TS] generateFullPostAction başlatıldı.');
  try {
    const idea = await suggestSingleContentIdeaFlow();
    console.log('[ACTIONS.TS] Fikir üretildi:', idea);
    if (!idea.topic || !idea.keyInformation) {
      console.error('[ACTIONS.TS] Geçersiz fikir üretildi.');
      throw new Error('Yapay zeka geçerli bir içerik fikri üretemedi.');
    }

    const imagePrompt = idea.topic; 

    const [imageResult, captionResult] = await Promise.all([
      generatePostImageFlow({ prompt: imagePrompt }),
      generatePostCaptionFlow({ topic: idea.topic, keyInformation: idea.keyInformation })
    ]);
    console.log('[ACTIONS.TS] Resim sonucu:', imageResult);
    console.log('[ACTIONS.TS] Başlık sonucu:', captionResult);

    if (!imageResult.imageUrl) {
      console.error('[ACTIONS.TS] Resim üretilemedi.');
      throw new Error('Yapay zeka bir resim üretemedi.');
    }
    if (!captionResult.caption) {
      console.error('[ACTIONS.TS] Başlık üretilemedi.');
      throw new Error('Yapay zeka bir başlık üretemedi.');
    }

    const hashtagsResult = await optimizePostHashtagsFlow({ postCaption: captionResult.caption, topic: idea.topic });
    console.log('[ACTIONS.TS] Hashtag sonucu:', hashtagsResult);

    return {
      topic: idea.topic,
      keyInformation: idea.keyInformation,
      caption: captionResult.caption,
      hashtags: hashtagsResult.hashtags || [],
      imageUrl: imageResult.imageUrl,
    };
  } catch (error) {
    console.error('[ACTIONS.TS] Tam gönderi oluşturulurken hata oluştu:', error);
    if (error instanceof Error) {
        throw new Error(`Yapay zeka tam gönderi oluştururken bir sorunla karşılaştı: ${error.message}`);
    }
    throw new Error('Yapay zeka tam gönderi oluştururken bilinmeyen bir sorunla karşılaştı. Lütfen daha sonra tekrar deneyin.');
  }
}

export async function sendPostByEmail(
  post: Post,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  console.log(`[sendPostByEmail] FONKSIYON ÇAĞRILDI. Alıcı: ${recipientEmail}`);
  
  const senderEmail = process.env.EMAIL_USER; // .env dosyanızdaki EMAIL_USER değişkenini kullanıyoruz
  const senderAppPassword = process.env.EMAIL_APP_PASSWORD;

  console.log(`[sendPostByEmail] Ortam Değişkenleri Kontrolü (Fonksiyon İçi):`);
  console.log(`[sendPostByEmail] > senderEmail (EMAIL_USER) DEĞERİ: "${senderEmail}" (tip: ${typeof senderEmail})`);
  console.log(`[sendPostByEmail] > senderAppPassword DEĞERİ: "${senderAppPassword ? 'DEĞER MEVCUT (gizli)' : 'BULUNAMADI veya BOŞ'}" (tip: ${typeof senderAppPassword})`);

  if (!senderEmail || !senderAppPassword) {
    const errorMessage = 'E-posta gönderimi yapılandırma hatası: Gönderen bilgileri (EMAIL_USER veya EMAIL_APP_PASSWORD) .env dosyasında eksik veya okunamadı. Lütfen .env dosyasını doğru yapılandırdığınızdan ve sunucuyu yeniden başlattığınızdan emin olun. Terminal loglarını kontrol edin.';
    console.error(`[sendPostByEmail] HATA: ${errorMessage}`);
    return { success: false, message: errorMessage };
  }

  console.log(`[sendPostByEmail] Ortam değişkenleri OKUNABİLDİ. Gönderen: ${senderEmail}`);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: senderAppPassword,
    },
  });

  const emailSubject = `Kozmos Küratörü Yeni Gönderi Fikri: ${post.topic}`;
  const emailHtml = `
    <h1>Kozmos Küratörü Yeni Gönderi Fikri</h1>
    <p>Merhaba,</p>
    <p>Yapay zeka sizin için aşağıdaki gönderi içeriğini oluşturdu:</p>
    <hr>
    <h2>Konu: ${post.topic || 'Belirtilmemiş'}</h2>
    <p><strong>Resim URL'si:</strong> <a href="${post.imageUrl}">${post.imageUrl}</a></p>
    ${post.imageUrl && post.imageUrl.startsWith('data:image') ? `<p><img src="${post.imageUrl}" alt="Yapay Zeka Tarafından Üretilen Resim" style="max-width: 500px; height: auto;" /></p>` : ''}
    <h3>Başlık:</h3>
    <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; white-space: pre-line;">${post.caption || 'Başlık oluşturulmadı.'}</div>
    <h3>Hashtag'ler:</h3>
    <p>${post.hashtags && post.hashtags.length > 0 ? post.hashtags.map(tag => `#${tag}`).join(' ') : 'Hashtag bulunmuyor.'}</p>
    <hr>
    <p>Bu içeriği Instagram'da paylaşabilirsiniz.</p>
    <p>İyi çalışmalar!</p>
  `;

  const mailOptions = {
    from: `"Kozmos Küratörü Asistanı" <${senderEmail}>`,
    to: recipientEmail,
    subject: emailSubject,
    html: emailHtml,
  };

  try {
    console.log(`[sendPostByEmail] E-posta gönderimi deneniyor... Alıcı: ${recipientEmail}, Konu: "${emailSubject}"`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[sendPostByEmail] E-POSTA BAŞARIYLA GÖNDERİLDİ. Message ID: ${info.messageId}`);
    return {
      success: true,
      message: `E-posta başarıyla "${recipientEmail}" adresine gönderildi.`,
    };
  } catch (error) {
    console.error(`[sendPostByEmail] E-POSTA GÖNDERME HATASI. Alıcı: ${recipientEmail}, Konu: "${emailSubject}"`, error);
    let errorMessage = 'E-posta gönderilemedi. Lütfen sunucu loglarını (terminal) ve Gmail hesap ayarlarınızı kontrol edin.';
    if (error instanceof Error) {
      errorMessage = `E-posta gönderilemedi: ${error.message}. Gmail ayarlarınızı ve uygulama şifrenizi kontrol edin.`;
       // @ts-ignore
      if (error.responseCode === 535 || (error.message && error.message.toLowerCase().includes('credentials'))) { 
        errorMessage = 'E-posta gönderilemedi: Gmail kimlik doğrulama hatası (535 - Geçersiz kimlik bilgileri). Uygulama şifrenizi ve gönderen e-posta adresini (EMAIL_USER) kontrol edin. Google hesabınızda 2 Adımlı Doğrulama\'nın etkin ve bir Uygulama Şifresi oluşturulmuş olması gerekir.';
      }
    }
    return { success: false, message: errorMessage };
  }
}


import { suggestSingleContentIdea as suggestSingleContentIdeaFlow } from '@/ai/flows/suggest-content-ideas';
import { generatePostCaption as generatePostCaptionFlow } from '@/ai/flows/generate-post-captions';
import { optimizePostHashtags as optimizePostHashtagsFlow } from '@/ai/flows/optimize-post-hashtags';
import { generatePostImage as generatePostImageFlow } from '@/ai/flows/generate-post-image';
