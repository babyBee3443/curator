
'use server';

import type { Post, FullPostGenerationOutput } from '@/types';
import nodemailer from 'nodemailer';
import { suggestSingleContentIdea as suggestSingleContentIdeaFlow } from '@/ai/flows/suggest-content-ideas';
import { generatePostCaption as generatePostCaptionFlow } from '@/ai/flows/generate-post-captions';
import { optimizePostHashtags as optimizePostHashtagsFlow } from '@/ai/flows/optimize-post-hashtags';
import { generatePostImage as generatePostImageFlow } from '@/ai/flows/generate-post-image';

// Bu loglar, dosya her yüklendiğinde (sunucu başladığında veya dosya değiştiğinde) çalışır.
console.log('[ACTIONS.TS] MODÜL YÜKLENDİ - Ortam Değişkenleri Kontrolü (Modül Yüklenirken):');
console.log(`[ACTIONS.TS] > process.env.EMAIL_USER: "${process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0,3) + '...' : 'BULUNAMADI'}"`);
console.log(`[ACTIONS.TS] > process.env.EMAIL_APP_PASSWORD: "${process.env.EMAIL_APP_PASSWORD ? 'DEĞER MEVCUT (gizli)' : 'BULUNAMADI'}"`);


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
    console.log('[ACTIONS.TS] Resim sonucu:', imageResult ? imageResult.imageUrl.substring(0,30) + '...' : 'Resim Yok');
    console.log('[ACTIONS.TS] Başlık sonucu:', captionResult ? captionResult.caption.substring(0,30) + '...' : 'Başlık Yok');

    if (!imageResult || !imageResult.imageUrl) {
      console.error('[ACTIONS.TS] Resim üretilemedi.');
      throw new Error('Yapay zeka bir resim üretemedi.');
    }
    if (!captionResult || !captionResult.caption) {
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

  const senderEmail = process.env.EMAIL_USER;
  const senderAppPassword = process.env.EMAIL_APP_PASSWORD;

  console.log(`[sendPostByEmail] Ortam Değişkenleri Kontrolü (Fonksiyon İçi):`);
  console.log(`[sendPostByEmail] > senderEmail (EMAIL_USER) DEĞERİ: "${senderEmail}" (tip: ${typeof senderEmail})`);
  console.log(`[sendPostByEmail] > senderAppPassword DEĞERİ: "${senderAppPassword ? 'DEĞER MEVCUT (gizli)' : 'BULUNAMADI veya BOŞ'}" (tip: ${typeof senderAppPassword})`);

  if (!senderEmail || !senderAppPassword) {
    const errorMessage = 'E-posta gönderimi yapılandırma hatası: Gönderen bilgileri (EMAIL_USER veya EMAIL_APP_PASSWORD) .env dosyasında eksik veya okunamadı. Lütfen .env dosyasını doğru yapılandırdığınızdan ve sunucuyu yeniden başlattığınızdan emin olun. Ayarlar sayfasındaki talimatları kontrol edin ve terminal loglarına bakın.';
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

  let imageUrlDisplayHtml = '';
  let imageTagHtml = '';
  const attachments: nodemailer.Attachment[] = [];
  const imageCID = 'postimage@kozmos.curator';

  if (post.imageUrl) {
    const isDataUrl = post.imageUrl.startsWith('data:image');
    if (isDataUrl) {
      imageUrlDisplayHtml = `<p><strong>Resim:</strong> E-postaya gömülü (aşağıda)</p>`;
      let extension = 'png';
      const mimeTypeMatch = post.imageUrl.match(/data:(image\/[^;]+);base64,/);
      if (mimeTypeMatch && mimeTypeMatch[1]) {
          const mimeType = mimeTypeMatch[1];
          if (mimeType === 'image/jpeg') extension = 'jpg';
          else if (mimeType === 'image/png') extension = 'png';
          else if (mimeType === 'image/gif') extension = 'gif';
      }
      attachments.push({
        filename: `post_image.${extension}`,
        path: post.imageUrl,
        cid: imageCID
      });
      imageTagHtml = `<p><img src="cid:${imageCID}" alt="Yapay Zeka Tarafından Üretilen Resim" style="max-width: 500px; height: auto; border: 1px solid #ddd; border-radius: 4px; padding: 5px;" /></p>`;
    } else {
      imageUrlDisplayHtml = `<p><strong>Resim URL'si:</strong> <a href="${post.imageUrl}" target="_blank" rel="noopener noreferrer">${post.imageUrl}</a></p>`;
      imageTagHtml = `<p><img src="${post.imageUrl}" alt="Yapay Zeka Tarafından Üretilen Resim" style="max-width: 500px; height: auto; border: 1px solid #ddd; border-radius: 4px; padding: 5px;" /></p>`;
    }
  } else {
    imageUrlDisplayHtml = `<p><strong>Resim:</strong> Yok</p>`;
  }

  const emailSubject = `Kozmos Küratörü Yeni Gönderi Fikri: ${post.topic}`;
  const emailHtml = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          h1 { color: #2c3e50; }
          h2 { color: #34495e; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          h3 { color: #7f8c8d; }
          .content-block { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 15px; border: 1px solid #eee; }
          .caption { white-space: pre-line; font-size: 1.1em; }
          .hashtags { color: #3498db; }
          img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; padding: 5px; margin-top:10px; }
          a { color: #3498db; text-decoration: none; }
          a:hover { text-decoration: underline; }
          hr { border: 0; border-top: 1px solid #eee; margin: 20px 0; }
          .footer { font-size: 0.9em; color: #777; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Kozmos Küratörü Otomatik Gönderi</h1>
        <p>Merhaba,</p>
        <p>Yapay zeka sizin için aşağıdaki gönderi içeriğini otomatik olarak oluşturdu:</p>
        <hr>
        <div class="content-block">
          <h2>Konu: ${post.topic || 'Belirtilmemiş'}</h2>
          ${imageUrlDisplayHtml}
          ${imageTagHtml}
        </div>
        <div class="content-block">
          <h3>Başlık:</h3>
          <div class="caption">${post.caption || 'Başlık oluşturulmadı.'}</div>
        </div>
        <div class="content-block">
          <h3>Hashtag'ler:</h3>
          <p class="hashtags">${post.hashtags && post.hashtags.length > 0 ? post.hashtags.map(tag => `#${tag}`).join(' ') : 'Hashtag bulunmuyor.'}</p>
        </div>
        <hr>
        <p class="footer">Bu e-posta, Kozmos Küratörü uygulaması tarafından otomatik olarak gönderilmiştir.</p>
      </body>
    </html>
  `;

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Kozmos Küratörü Asistanı" <${senderEmail}>`,
    to: recipientEmail,
    subject: emailSubject,
    html: emailHtml,
    attachments: attachments.length > 0 ? attachments : undefined,
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

export async function triggerAutoPostAndEmail(recipientEmail: string): Promise<void> {
  console.log('[ACTIONS.TS] triggerAutoPostAndEmail çağrıldı. Alıcı:', recipientEmail);
  if (!recipientEmail || !recipientEmail.includes('@')) {
    console.error('[ACTIONS.TS] Otomatik gönderi için geçersiz veya eksik alıcı e-posta adresi:', recipientEmail);
    throw new Error('Otomatik gönderi için Ayarlar sayfasında geçerli bir alıcı e-posta adresi tanımlanmamış.');
  }

  try {
    // generateFullPostAction'dan dönen tip FullPostGenerationOutput
    const fullPostOutput: FullPostGenerationOutput = await generateFullPostAction();
    console.log('[ACTIONS.TS] Otomatik gönderi için içerik üretildi:', fullPostOutput.topic);

    // sendPostByEmail fonksiyonu Post tipinde bir nesne bekliyor.
    // FullPostGenerationOutput'u Post tipine dönüştürelim.
    const postForEmail: Post = {
      id: `auto-post-${Date.now()}-${Math.random().toString(36).substring(2,9)}`, // Benzersiz ID
      topic: fullPostOutput.topic,
      keyInformation: fullPostOutput.keyInformation, // Bu bilgi e-postada doğrudan kullanılmıyor ama Post tipine uygunluk için
      caption: fullPostOutput.caption,
      hashtags: fullPostOutput.hashtags,
      imageUrl: fullPostOutput.imageUrl,
      imageHint: fullPostOutput.topic.toLowerCase().split(" ").slice(0,2).join(" ") || "bilim teknoloji",
      simulatedPostTime: new Date(), // Oluşturulma zamanı
      status: 'approved', // Otomatik e-posta için 'onaylanmış' kabul edilebilir
    };

    const emailResult = await sendPostByEmail(postForEmail, recipientEmail);
    if (!emailResult.success) {
      console.error('[ACTIONS.TS] Otomatik e-posta gönderilemedi:', emailResult.message);
      throw new Error(`Otomatik e-posta gönderilemedi: ${emailResult.message}`);
    }
    console.log('[ACTIONS.TS] Otomatik gönderi başarıyla e-postalandı.');
  } catch (error) {
    console.error('[ACTIONS.TS] triggerAutoPostAndEmail sırasında hata:', error);
    if (error instanceof Error) {
      throw new Error(`Otomatik gönderi işlemi sırasında hata: ${error.message}`);
    }
    throw new Error('Otomatik gönderi işlemi sırasında bilinmeyen bir hata oluştu.');
  }
}
