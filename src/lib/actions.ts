
'use server';

import type { Post } from '@/types';
import nodemailer from 'nodemailer';

// Ortam değişkenlerinin Next.js tarafından doğru şekilde yüklenip yüklenmediğini anlamak için loglar.
// Bu loglar, dosya her yüklendiğinde (sunucu başladığında veya dosya değiştiğinde) çalışır.
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

    const imagePrompt = idea.topic; // Sadece kısa konu başlığını kullan

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
    <h1>Kozmos Küratörü Yeni Gönderi Fikri</h1>
    <p>Merhaba,</p>
    <p>Yapay zeka sizin için aşağıdaki gönderi içeriğini oluşturdu:</p>
    <hr>
    <h2>Konu: ${post.topic || 'Belirtilmemiş'}</h2>
    ${imageUrlDisplayHtml}
    ${imageTagHtml}
    <h3>Başlık:</h3>
    <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; white-space: pre-line;">${post.caption || 'Başlık oluşturulmadı.'}</div>
    <h3>Hashtag'ler:</h3>
    <p>${post.hashtags && post.hashtags.length > 0 ? post.hashtags.map(tag => `#${tag}`).join(' ') : 'Hashtag bulunmuyor.'}</p>
    <hr>
    <p>Bu içeriği Instagram'da paylaşabilirsiniz.</p>
    <p>İyi çalışmalar!</p>
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


import { suggestSingleContentIdea as suggestSingleContentIdeaFlow } from '@/ai/flows/suggest-content-ideas';
import { generatePostCaption as generatePostCaptionFlow } from '@/ai/flows/generate-post-captions';
import { optimizePostHashtags as optimizePostHashtagsFlow } from '@/ai/flows/optimize-post-hashtags';
import { generatePostImage as generatePostImageFlow } from '@/ai/flows/generate-post-image';

// Instagram API ile ilgili fonksiyonlar
export async function getInstagramConnectionStatusAction(): Promise<{isConnected: boolean; username?: string}> {
  console.log('[ACTIONS.TS] getInstagramConnectionStatusAction çağrıldı.');
  const token = typeof window !== 'undefined' ? localStorage.getItem('instagramAccessToken_cosmosCurator') : null;
  if (token) {
    // Basit bir kullanıcı adı simülasyonu, gerçek API'de bu /me çağrısı ile alınır.
    const username = localStorage.getItem('instagramUsername_cosmosCurator') || 'KullaniciAdi (Simüle)';
    return {isConnected: true, username: username};
  }
  return {isConnected: false};
}

export async function connectToInstagramAction(accessToken: string): Promise<{success: boolean; message: string; username?: string}> {
  console.log('[ACTIONS.TS] connectToInstagramAction çağrıldı. Belirteç (ilk 15 krk):', accessToken ? accessToken.substring(0,15) : "YOK");
  if (typeof window !== 'undefined') {
    // GERÇEK KULLANIM İÇİN GÜVENLİ DEĞİLDİR! SADECE TEST AMAÇLIDIR.
    localStorage.setItem('instagramAccessToken_cosmosCurator', accessToken);
    // Kullanıcı adını da basitçe saklayalım (normalde API'den alınır)
    // Bu kısım gerçek API çağrısı ile /me üzerinden alınmalı. Şimdilik manuel.
    localStorage.setItem('instagramUsername_cosmosCurator', 'KullaniciAdi (Belirteç Kaydedildi)');
  }
  return {success: true, message: 'Instagram erişim belirteci kaydedildi (Simülasyon - Güvensiz Yöntem!). Lütfen sayfayı yenileyin.', username: 'KullaniciAdi (Belirteç Kaydedildi)'};
}

export async function disconnectFromInstagramAction(): Promise<{success: boolean; message: string}> {
  console.log('[ACTIONS.TS] disconnectFromInstagramAction çağrıldı.');
  if (typeof window !== 'undefined') {
    localStorage.removeItem('instagramAccessToken_cosmosCurator');
    localStorage.removeItem('instagramUsername_cosmosCurator');
  }
  return {success: true, message: 'Instagram bağlantısı kesildi (Simülasyon). Lütfen sayfayı yenileyin.'};
}

export async function sharePostToInstagramAction(post: Post, accessToken?: string): Promise<{success: boolean; message: string}> {
  console.log(`[sharePostToInstagramAction] FONKSIYON ÇAĞRILDI. Konu: ${post.topic}`);

  if (!accessToken) {
    const errorMessage = 'Instagram\'a paylaşım yapılamadı: Erişim belirteci bulunamadı. Lütfen Ayarlar sayfasından Instagram hesabınızı bağlayın (belirtecinizi girin).';
    console.error('[sharePostToInstagramAction] HATA:', errorMessage);
    return { success: false, message: errorMessage };
  }

  const isDataUrlImage = post.imageUrl.startsWith('data:image');
  if (isDataUrlImage) {
      const errorMessage = 'Instagram Paylaşım Hatası: Resim URL\'si bir veri URI\'si. Instagram API, "image_url" için herkese açık bir HTTPS URL\'si bekler. Lütfen resmi herkese açık bir URL\'ye yükleyip o URL ile gönderi oluşturmayı deneyin veya Ayarlar sayfasındaki yönlendirmeleri takip edin.';
      console.error(`[sharePostToInstagramAction] HATA: ${errorMessage}`);
      return { success: false, message: errorMessage };
  }


  console.log(`[sharePostToInstagramAction] Belirteç ile GERÇEK API çağrısı denenecek: ${accessToken.substring(0,15)}...`);
  console.log(`[sharePostToInstagramAction] Gönderi Detayları:`);
  console.log(`[sharePostToInstagramAction] > Resim URL: ${post.imageUrl}`);
  console.log(`[sharePostToInstagramAction] > Başlık: ${post.caption}`);
  console.log(`[sharePostToInstagramAction] > Hashtag'ler: ${post.hashtags.join(', ')}`);

  try {
    const instagramUserId = "me"; // User Access Token ile "me" kullanılabilir.
    const apiVersion = "v19.0"; // Güncel API versiyonunu kullanın

    // Adım 1: Medya Konteyneri Oluşturma
    const mediaContainerUrl = `https://graph.facebook.com/${apiVersion}/${instagramUserId}/media`;
    const mediaContainerParams = new URLSearchParams();
    mediaContainerParams.append('image_url', post.imageUrl);
    mediaContainerParams.append('caption', `${post.caption}\n\n#${post.hashtags.join(' #')}`);
    mediaContainerParams.append('access_token', accessToken);

    console.log(`[sharePostToInstagramAction] Medya konteyneri oluşturuluyor... URL: ${mediaContainerUrl}`);
    console.log(`[sharePostToInstagramAction] Parametreler: image_url=${post.imageUrl}, caption=${post.caption.substring(0,30)}...`);


    const mediaResponse = await fetch(mediaContainerUrl, {
      method: 'POST',
      body: mediaContainerParams,
    });

    const mediaResult = await mediaResponse.json();

    if (!mediaResponse.ok || !mediaResult.id) {
      console.error('[sharePostToInstagramAction] HATA (Medya Konteyneri):', JSON.stringify(mediaResult, null, 2));
      const apiErrorMessage = mediaResult.error?.message || `HTTP ${mediaResponse.status} - ${mediaResponse.statusText}`;
      const userMessage = `Instagram Medya Konteyneri Hatası: ${apiErrorMessage}. Resim URL'sinin herkese açık ve geçerli olduğundan, belirtecinizin 'instagram_content_publish' iznine sahip olduğundan emin olun. Detaylar için sunucu ve tarayıcı konsol loglarını kontrol edin.`;
      return { success: false, message: userMessage };
    }

    const mediaContainerId = mediaResult.id;
    console.log(`[sharePostToInstagramAction] Medya konteyneri oluşturuldu. ID: ${mediaContainerId}`);

    // Adım 2: Medya Konteynerini Yayınlama
    const publishUrl = `https://graph.facebook.com/${apiVersion}/${instagramUserId}/media_publish`;
    const publishParams = new URLSearchParams();
    publishParams.append('creation_id', mediaContainerId);
    publishParams.append('access_token', accessToken);

    console.log(`[sharePostToInstagramAction] Medya yayınlanıyor... URL: ${publishUrl}`);

    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      body: publishParams,
    });

    const publishResult = await publishResponse.json();

    if (!publishResponse.ok || !publishResult.id) {
      console.error('[sharePostToInstagramAction] HATA (Yayınlama):', JSON.stringify(publishResult, null, 2));
      const apiErrorMessage = publishResult.error?.message || `HTTP ${publishResponse.status} - ${publishResponse.statusText}`;
      const userMessage = `Instagram Yayınlama Hatası: ${apiErrorMessage}. Detaylar için sunucu ve tarayıcı konsol loglarını kontrol edin.`;
      return { success: false, message: userMessage };
    }

    console.log(`[sharePostToInstagramAction] Gönderi başarıyla Instagram'da yayınlandı! ID: ${publishResult.id}`);
    return { success: true, message: `Gönderi başarıyla Instagram'da yayınlandı! Yayın ID: ${publishResult.id}. Lütfen Instagram hesabınızı kontrol edin.` };

  } catch (error) {
    console.error('[sharePostToInstagramAction] KRİTİK HATA (Fetch veya diğer JS hatası):', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.';
    return { success: false, message: `Instagram'a gönderi paylaşılırken kritik bir hata oluştu: ${errorMessage}. Detaylar için sunucu ve tarayıcı konsol loglarını kontrol edin.` };
  }
}
