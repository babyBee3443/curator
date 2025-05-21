
'use server';

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
  
  const senderEmail = process.env.EMAIL_USER;
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

  const isDataUrl = post.imageUrl && post.imageUrl.startsWith('data:image');
  let imageUrlDisplayHtml = '';
  let imageTagHtml = '';

  if (post.imageUrl) {
    if (isDataUrl) {
      imageUrlDisplayHtml = `<p><strong>Resim:</strong> E-postaya gömülü (aşağıda)</p>`;
    } else {
      // Assume it's a public URL
      imageUrlDisplayHtml = `<p><strong>Resim URL'si:</strong> <a href="${post.imageUrl}" target="_blank" rel="noopener noreferrer">${post.imageUrl}</a></p>`;
    }
    imageTagHtml = `<p><img src="${post.imageUrl}" alt="Yapay Zeka Tarafından Üretilen Resim" style="max-width: 500px; height: auto; border: 1px solid #ddd; border-radius: 4px; padding: 5px;" /></p>`;
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

// Instagram API ile ilgili fonksiyonlar (simülasyon amaçlı)
export async function getInstagramConnectionStatusAction(): Promise<{isConnected: boolean; username?: string}> {
  // Bu sadece bir simülasyon. Gerçek uygulamada,
  // güvenli bir şekilde saklanan token kontrol edilmeli.
  console.log('[ACTIONS.TS] getInstagramConnectionStatusAction çağrıldı (Simülasyon).');
  const token = typeof window !== 'undefined' ? localStorage.getItem('instagramAccessToken_cosmosCurator') : null;
  if (token) {
    // Token varsa, "bağlı" kabul edelim ve sahte bir kullanıcı adı döndürelim.
    // Gerçek uygulamada token'ın geçerliliği de kontrol edilmeli.
    return {isConnected: true, username: 'KullaniciAdi (Simüle)'};
  }
  return {isConnected: false};
}

export async function connectToInstagramAction(): Promise<{success: boolean; message: string; username?: string}> {
  // Bu sadece bir simülasyon. Gerçek uygulamada OAuth akışı yönetilmeli.
  console.log('[ACTIONS.TS] connectToInstagramAction çağrıldı (Simülasyon).');
  // Sahte bir token oluşturup localStorage'a kaydedelim.
  const fakeToken = `simulated_token_${Date.now()}`;
  if (typeof window !== 'undefined') {
    localStorage.setItem('instagramAccessToken_cosmosCurator', fakeToken);
  }
  return {success: true, message: 'Instagram\'a başarıyla bağlanıldı (Simülasyon). Lütfen sayfayı yenileyin.', username: 'KullaniciAdi (Simüle)'};
}

export async function disconnectFromInstagramAction(): Promise<{success: boolean; message: string}> {
  console.log('[ACTIONS.TS] disconnectFromInstagramAction çağrıldı (Simülasyon).');
  if (typeof window !== 'undefined') {
    localStorage.removeItem('instagramAccessToken_cosmosCurator');
  }
  return {success: true, message: 'Instagram bağlantısı kesildi (Simülasyon). Lütfen sayfayı yenileyin.'};
}

export async function sharePostToInstagramAction(post: Post, accessToken?: string): Promise<{success: boolean; message: string}> {
  console.log(`[sharePostToInstagramAction] FONKSIYON ÇAĞRILDI (Simülasyon). Konu: ${post.topic}`);

  if (!accessToken) {
    const errorMessage = 'Instagram\'a paylaşım yapılamadı: Erişim belirteci bulunamadı. Lütfen Ayarlar sayfasından Instagram hesabınızı bağlayın (belirtecinizi girin).';
    console.error('[sharePostToInstagramAction] HATA:', errorMessage);
    return {success: false, message: errorMessage};
  }

  console.log(`[sharePostToInstagramAction] SİMÜLASYON: "${post.topic}" konulu gönderi, "${accessToken.substring(0,15)}..." erişim belirteci ile Instagram'a paylaşılıyor...`);
  console.log(`[sharePostToInstagramAction] Gönderi Detayları (Simülasyon):`);
  console.log(`[sharePostToInstagramAction] > Resim URL: ${post.imageUrl}`);
  console.log(`[sharePostToInstagramAction] > Başlık: ${post.caption}`);
  console.log(`[sharePostToInstagramAction] > Hashtag'ler: ${post.hashtags.join(', ')}`);
  
  // ------ GERÇEK API ÇAĞRISI DENEMESİ (ÇOK ÖNEMLİ UYARILARLA) ------
  // UYARI: Bu bölüm, üretim ortamları için KESİNLİKLE GÜVENLİ DEĞİLDİR.
  // Erişim belirteçleri sunucu tarafında güvenli bir şekilde yönetilmelidir.
  // Ayrıca, Instagram API'si data URI'lerini doğrudan kabul etmez, imageUrl'in
  // herkese açık bir URL olması gerekir. Bu sadece bir test denemesidir.

  const isDataUrlImage = post.imageUrl.startsWith('data:image');
  if (isDataUrlImage) {
      const warningMessage = 'UYARI (GERÇEK API DENEMESİ): Resim URL\'si bir veri URI\'si. Instagram API bu formatı doğrudan kabul etmeyebilir ve "image_url" için herkese açık bir URL bekler. Bu API çağrısı büyük ihtimalle başarısız olacaktır.';
      console.warn(warningMessage);
      // Bu uyarıyı kullanıcıya da göstermek isteyebilirsiniz, ancak şimdilik sadece konsola yazıyoruz.
  }

  try {
    // Adım 1: Medya konteyneri oluştur
    // Instagram Graph API, önce bir medya konteyneri oluşturmanızı, ardından bu konteyneri yayınlamanızı ister.
    // https://developers.facebook.com/docs/instagram-api/reference/ig-user/media
    // Bu örnekte sadece resimler için (video değil) ve carousel olmayan tek bir gönderi varsayılıyor.
    
    const instagramUserId = "me"; // Genellikle "me" veya Instagram Kullanıcı ID'si
    const mediaContainerUrl = `https://graph.facebook.com/v19.0/${instagramUserId}/media`;
    
    const mediaContainerParams = new URLSearchParams();
    mediaContainerParams.append('image_url', post.imageUrl); // BURASI EN KRİTİK NOKTA: Herkese açık URL olmalı!
    mediaContainerParams.append('caption', `${post.caption}\n\n#${post.hashtags.join(' #')}`);
    mediaContainerParams.append('access_token', accessToken);

    console.log(`[sharePostToInstagramAction] GERÇEK API DENEMESİ: Medya konteyneri oluşturuluyor... URL: ${mediaContainerUrl}, Params: ${mediaContainerParams.toString()}`);

    const mediaResponse = await fetch(mediaContainerUrl, {
      method: 'POST',
      body: mediaContainerParams,
    });

    const mediaResult = await mediaResponse.json();

    if (!mediaResponse.ok || !mediaResult.id) {
      console.error('[sharePostToInstagramAction] GERÇEK API DENEMESİ HATA (Medya Konteyneri):', mediaResult);
      const errorMessage = `Instagram'a gönderi paylaşılamadı (Medya Konteyneri Hatası): ${mediaResult.error?.message || `HTTP ${mediaResponse.status}`}. Resim URL'sinin herkese açık ve geçerli olduğundan emin olun. Detaylar için sunucu loglarını (terminal) kontrol edin.`;
      return { success: false, message: errorMessage };
    }

    const mediaContainerId = mediaResult.id;
    console.log(`[sharePostToInstagramAction] GERÇEK API DENEMESİ: Medya konteyneri oluşturuldu. ID: ${mediaContainerId}`);

    // Adım 2: Medya konteynerini yayınla
    // https://developers.facebook.com/docs/instagram-api/reference/ig-user/media_publish
    const publishUrl = `https://graph.facebook.com/v19.0/${instagramUserId}/media_publish`;
    const publishParams = new URLSearchParams();
    publishParams.append('creation_id', mediaContainerId);
    publishParams.append('access_token', accessToken);

    console.log(`[sharePostToInstagramAction] GERÇEK API DENEMESİ: Medya yayınlanıyor... URL: ${publishUrl}, Params: ${publishParams.toString()}`);
    
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      body: publishParams,
    });

    const publishResult = await publishResponse.json();

    if (!publishResponse.ok || !publishResult.id) {
      console.error('[sharePostToInstagramAction] GERÇEK API DENEMESİ HATA (Yayınlama):', publishResult);
      const errorMessage = `Instagram'a gönderi paylaşılamadı (Yayınlama Hatası): ${publishResult.error?.message || `HTTP ${publishResponse.status}`}. Detaylar için sunucu loglarını (terminal) kontrol edin.`;
      return { success: false, message: errorMessage };
    }
    
    console.log(`[sharePostToInstagramAction] GERÇEK API DENEMESİ: Gönderi başarıyla Instagram'da yayınlandı! ID: ${publishResult.id}`);
    return { success: true, message: `Gönderi başarıyla Instagram'da yayınlandı (GERÇEK API DENEMESİ)! Yayın ID: ${publishResult.id}. Lütfen Instagram hesabınızı kontrol edin.` };

  } catch (error) {
    console.error('[sharePostToInstagramAction] GERÇEK API DENEMESİ KRİTİK HATA:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.';
    return { success: false, message: `Instagram'a gönderi paylaşılırken kritik bir hata oluştu (GERÇEK API DENEMESİ): ${errorMessage}. Detaylar için sunucu loglarını (terminal) kontrol edin.` };
  }
  // ------ GERÇEK API ÇAĞRISI DENEMESİ SONU ------
}
