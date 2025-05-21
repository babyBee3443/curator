
'use server';

import type { Post } from '@/types';
import nodemailer from 'nodemailer';

// Ortam değişkenlerini kontrol et (Next.js normalde .env.local'i otomatik yükler)
// Ancak, bu eylemin çağrıldığı bağlamda kesin emin olmak için loglayalım.
console.log('[ACTIONS.TS] Ortam Değişkenleri Kontrolü:');
console.log(`[ACTIONS.TS] process.env.EMAIL_SENDER_ADDRESS okunuyor: "${process.env.EMAIL_SENDER_ADDRESS ? process.env.EMAIL_SENDER_ADDRESS.substring(0,3) + '...' : 'BULUNAMADI'}" (tip: ${typeof process.env.EMAIL_SENDER_ADDRESS})`);
console.log(`[ACTIONS.TS] process.env.EMAIL_APP_PASSWORD okunuyor: "${process.env.EMAIL_APP_PASSWORD ? 'DEĞER MEVCUT (gizli)' : 'BULUNAMADI'}" (tip: ${typeof process.env.EMAIL_APP_PASSWORD})`);


export interface FullPostGenerationOutput {
  topic: string;
  keyInformation: string;
  caption: string;
  hashtags: string[];
  imageUrl: string;
}

export async function generateFullPostAction(): Promise<FullPostGenerationOutput> {
  console.log('generateFullPostAction başlatıldı.');
  try {
    const idea = await suggestSingleContentIdeaFlow();
    console.log('Fikir üretildi:', idea);
    if (!idea.topic || !idea.keyInformation) {
      console.error('Geçersiz fikir üretildi.');
      throw new Error('Yapay zeka geçerli bir içerik fikri üretemedi.');
    }

    const imagePrompt = idea.topic;

    const [imageResult, captionResult] = await Promise.all([
      generatePostImageFlow({ prompt: imagePrompt }),
      generatePostCaptionFlow({ topic: idea.topic, keyInformation: idea.keyInformation })
    ]);
    console.log('Resim sonucu:', imageResult);
    console.log('Başlık sonucu:', captionResult);

    if (!imageResult.imageUrl) {
      console.error('Resim üretilemedi.');
      throw new Error('Yapay zeka bir resim üretemedi.');
    }
    if (!captionResult.caption) {
      console.error('Başlık üretilemedi.');
      throw new Error('Yapay zeka bir başlık üretemedi.');
    }

    const hashtagsResult = await optimizePostHashtagsFlow({ postCaption: captionResult.caption, topic: idea.topic });
    console.log('Hashtag sonucu:', hashtagsResult);

    return {
      topic: idea.topic,
      keyInformation: idea.keyInformation,
      caption: captionResult.caption,
      hashtags: hashtagsResult.hashtags || [],
      imageUrl: imageResult.imageUrl,
    };
  } catch (error) {
    console.error('Tam gönderi oluşturulurken hata oluştu:', error);
    if (error instanceof Error) {
        throw new Error(`Yapay zeka tam gönderi oluştururken bir sorunla karşılaştı: ${error.message}`);
    }
    throw new Error('Yapay zeka tam gönderi oluştururken bilinmeyen bir sorunla karşılaştı. Lütfen daha sonra tekrar deneyin.');
  }
}

export async function sharePostToInstagramAction(post: Post): Promise<{ success: boolean; message: string; instagramPostId?: string }> {
  console.log(`Instagram'da paylaşılmak üzere alınan gönderi (SİMÜLASYON - ID: ${post.id})`);
  const simulatedMessage = `Gönderi (ID: ${post.id}) için Instagram paylaşım simülasyonu tetiklendi. (Gerçek API çağrısı yapılmadı.)`;
  console.log(simulatedMessage);
  
  return { 
    success: true,
    message: simulatedMessage,
    instagramPostId: `simulated_${Date.now()}`
  };
}

export async function sendPostByEmail(
  post: Post,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  const senderEmail = process.env.EMAIL_SENDER_ADDRESS;
  const senderAppPassword = process.env.EMAIL_APP_PASSWORD;

  console.log(`[sendPostByEmail] Başlatıldı. Alıcı: ${recipientEmail}`);
  console.log(`[sendPostByEmail] Okunan Gönderen E-posta: ${senderEmail ? senderEmail.substring(0,3) + '...' : 'BULUNAMADI'}`);
  console.log(`[sendPostByEmail] Okunan Uygulama Şifresi: ${senderAppPassword ? 'MEVCUT (gizli)' : 'BULUNAMADI'}`);

  if (!senderEmail || !senderAppPassword) {
    const errorMessage = 'E-posta gönderimi yapılandırma hatası: Gönderen bilgileri eksik. Lütfen .env.local dosyasını doğru yapılandırdığınızdan ve sunucuyu yeniden başlattığınızdan emin olun.';
    console.error(`[sendPostByEmail] Hata: ${errorMessage}`);
    return { success: false, message: errorMessage };
  }

  if (!recipientEmail || !recipientEmail.includes('@')) {
    const errorMessage = 'Geçersiz alıcı e-posta adresi.';
    console.error(`[sendPostByEmail] Hata: ${errorMessage}`);
    return { success: false, message: errorMessage };
  }

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
    <h2>Konu: ${post.topic}</h2>
    <p><strong>Resim URL'si:</strong> <a href="${post.imageUrl}">${post.imageUrl}</a></p>
    ${post.imageUrl.startsWith('data:image') ? `<p><img src="${post.imageUrl}" alt="Yapay Zeka Tarafından Üretilen Resim" style="max-width: 500px; height: auto;" /></p>` : ''}
    <h3>Başlık:</h3>
    <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; white-space: pre-line;">${post.caption}</div>
    <h3>Hashtag'ler:</h3>
    <p>${post.hashtags.map(tag => `#${tag}`).join(' ')}</p>
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
    const info = await transporter.sendMail(mailOptions);
    console.log(`[sendPostByEmail] E-posta başarıyla gönderildi. Alıcı: ${recipientEmail}, Konu: "${emailSubject}", Message ID: ${info.messageId}`);
    return {
      success: true,
      message: `E-posta başarıyla "${recipientEmail}" adresine gönderildi.`,
    };
  } catch (error) {
    console.error(`[sendPostByEmail] E-posta gönderme hatası. Alıcı: ${recipientEmail}, Konu: "${emailSubject}"`, error);
    let errorMessage = 'E-posta gönderilemedi. Lütfen sunucu loglarını kontrol edin.';
    if (error instanceof Error) {
      errorMessage = `E-posta gönderilemedi: ${error.message}. Gmail ayarlarınızı ve uygulama şifrenizi kontrol edin.`;
       // @ts-ignore
      if (error.responseCode === 535) { // Authentication credentials invalid
        errorMessage = 'E-posta gönderilemedi: Gmail kimlik doğrulama hatası (535). Uygulama şifrenizi ve gönderen e-posta adresini kontrol edin. Google hesabınızda 2 Adımlı Doğrulama\'nın etkin ve bir Uygulama Şifresi oluşturulmuş olması gerekir.';
      }
    }
    return { success: false, message: errorMessage };
  }
}


import { suggestSingleContentIdea as suggestSingleContentIdeaFlow } from '@/ai/flows/suggest-content-ideas';
import { generatePostCaption as generatePostCaptionFlow } from '@/ai/flows/generate-post-captions';
import { optimizePostHashtags as optimizePostHashtagsFlow } from '@/ai/flows/optimize-post-hashtags';
import { generatePostImage as generatePostImageFlow } from '@/ai/flows/generate-post-image';
