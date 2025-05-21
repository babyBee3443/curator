
'use server';

// .env.local dosyasını AÇIKÇA YÜKLEMEYİ DENEMİYORUZ. Next.js'in bunu otomatik yapmasına güveniyoruz.
// import { config as dotenvConfig } from 'dotenv';
// import path from 'path';
// const envPath = path.resolve(process.cwd(), '.env.local');
// dotenvConfig({ path: envPath });


import type { Post } from '@/types';
import nodemailer from 'nodemailer';
import { suggestSingleContentIdea as suggestSingleContentIdeaFlow } from '@/ai/flows/suggest-content-ideas';
import { generatePostCaption as generatePostCaptionFlow } from '@/ai/flows/generate-post-captions';
import { optimizePostHashtags as optimizePostHashtagsFlow } from '@/ai/flows/optimize-post-hashtags';
import { generatePostImage as generatePostImageFlow } from '@/ai/flows/generate-post-image';


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

    // Resim oluşturma istemi için sadece kısa konuyu kullanıyoruz
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

export async function sharePostToInstagramAction(post: Post, accessToken?: string): Promise<{ success: boolean; message: string; instagramPostId?: string }> {
  console.log(`[GERÇEK API DENEMESİ] Instagram'da paylaşılmak üzere alınan gönderi (ID: ${post.id})`);

  if (!accessToken) {
    console.error(`[GERÇEK API DENEMESİ] Gönderi (ID: ${post.id}) paylaşılamadı: Erişim Belirteci (Access Token) eksik.`);
     return { success: false, message: 'Erişim Belirteci (Access Token) eksik. Lütfen Ayarlar sayfasından belirtecinizi girin.'};
  }

  if (post.imageUrl.startsWith('data:image')) {
    console.warn(`[GERÇEK API DENEMESİ] Gönderi (ID: ${post.id}): Resim URL'si bir veri URI'si. Instagram Graph API doğrudan veri URI'lerini kabul etmez. API çağrısı muhtemelen başarısız olacaktır. Resmin herkese açık bir URL olması gerekir.`);
     return { success: false, message: "Resim URL'si bir veri URI'si. Instagram Graph API, doğrudan veri URI'lerini kabul etmez. Gönderi paylaşımı denemesi için resmin herkese açık bir URL olması gerekir. Lütfen Ayarlar sayfasındaki uyarıları okuyun."};
  }

  const fullCaption = `${post.caption}\n\n${post.hashtags.map(h => `#${h.trim()}`).join(' ')}`;
  const instagramApiVersion = 'v19.0'; // Instagram API sürümünü buradan ayarlayabilirsiniz

  try {
    console.log(`[GERÇEK API DENEMESİ] Instagram API çağrısı deneniyor. Belirtecin ilk 10 karakteri: ${accessToken.substring(0,10)}...`);
    console.log(`[GERÇEK API DENEMESİ] Kullanılacak resim URL'si: ${post.imageUrl}`);
    console.log(`[GERÇEK API DENEMESİ] Kullanılacak başlık: ${fullCaption.substring(0, 100)}...`);

    // Adım 1: Medya Konteyneri Oluşturma
    const mediaContainerParams = new URLSearchParams({
      image_url: post.imageUrl,
      caption: fullCaption,
      access_token: accessToken,
    });

    console.log('[GERÇEK API DENEMESİ] Instagram Medya Konteyneri API çağrısı yapılıyor (POST /me/media)... Parametreler:', mediaContainerParams.toString());
    const mediaContainerResponse = await fetch(`https://graph.facebook.com/${instagramApiVersion}/me/media`, {
      method: 'POST',
      body: mediaContainerParams,
    });
    
    const mediaContainerData = await mediaContainerResponse.json();

    console.log('[GERÇEK API DENEMESİ] Medya Konteyneri API yanıt durumu:', mediaContainerResponse.status);
    console.log('[GERÇEK API DENEMESİ] Medya Konteyneri API yanıt verisi:', JSON.stringify(mediaContainerData, null, 2));


    if (!mediaContainerResponse.ok || mediaContainerData.error) {
      const errorMessage = mediaContainerData.error?.message || `API isteği başarısız oldu (HTTP ${mediaContainerResponse.status}). Resim URL'sinin herkese açık olduğundan ve belirtecinizin doğru izinlere sahip olduğundan emin olun. Detaylar için konsolu kontrol edin.`;
      console.error('[GERÇEK API DENEMESİ] Instagram medya konteyneri oluşturma hatası:', mediaContainerData.error || `HTTP ${mediaContainerResponse.status}`);
      return { success: false, message: `Instagram API Hatası (Medya Konteyneri - HTTP ${mediaContainerResponse.status}): ${errorMessage}` };
    }

    const creationId = mediaContainerData.id;
    if (!creationId) {
      console.error('[GERÇEK API DENEMESİ] Instagram API: Medya konteyneri ID alınamadı. Yanıt:', mediaContainerData);
      return { success: false, message: 'Instagram API: Medya konteyneri ID alınamadı.' };
    }
    console.log('[GERÇEK API DENEMESİ] Instagram medya konteyneri oluşturuldu, creation_id:', creationId);

    // Adım 2: Medya Konteynerini Yayınlama
    const publishParams = new URLSearchParams({
      creation_id: creationId,
      access_token: accessToken,
    });

    console.log('[GERÇEK API DENEMESİ] Instagram Medya Yayınlama API çağrısı yapılıyor (POST /me/media_publish)... Parametreler:', publishParams.toString());
    
    // Instagram'ın medya işleme süresi için biraz bekleme eklemek faydalı olabilir.
    // await new Promise(resolve => setTimeout(resolve, 5000)); // 5 saniye bekle (opsiyonel)

    const publishResponse = await fetch(`https://graph.facebook.com/${instagramApiVersion}/me/media_publish`, {
      method: 'POST',
      body: publishParams,
    });

    const publishData = await publishResponse.json();
    console.log('[GERÇEK API DENEMESİ] Medya Yayınlama API yanıt durumu:', publishResponse.status);
    console.log('[GERÇEK API DENEMESİ] Medya Yayınlama API yanıt verisi:', JSON.stringify(publishData, null, 2));
    
    if (!publishResponse.ok || publishData.error) {
      const errorMessage = publishData.error?.message || `API isteği başarısız oldu (HTTP ${publishResponse.status}). Detaylar için konsolu kontrol edin.`;
      console.error('[GERÇEK API DENEMESİ] Instagram medya yayınlama hatası:', publishData.error || `HTTP ${publishResponse.status}`);
      return { success: false, message: `Instagram API Hatası (Yayınlama - HTTP ${publishResponse.status}): ${errorMessage}` };
    }
    
    const instagramPostId = publishData.id;
    if (!instagramPostId) {
        console.error('[GERÇEK API DENEMESİ] Instagram API: Yayınlama sonrası gönderi ID alınamadı. Yanıt:', publishData);
        return { success: false, message: 'Instagram API: Yayınlama sonrası gönderi ID alınamadı.' };
    }
    console.log(`[GERÇEK API DENEMESİ] Gönderi (ID: ${post.id}) Instagram'a başarıyla gönderildi. Instagram Post ID: ${instagramPostId}`);
    return { 
      success: true, 
      message: `Gönderi (ID: ${post.id}) başarıyla Instagram'da yayınlandı (GERÇEK API DENEMESİ). Instagram Post ID: ${instagramPostId}`,
      instagramPostId: instagramPostId
    };

  } catch (error) {
    console.error(`[GERÇEK API DENEMESİ] Gönderi (ID: ${post.id}) Instagram'a gönderilemedi:`, error);
    if (error instanceof Error) {
      return { success: false, message: `Gönderi paylaşılamadı (GERÇEK API DENEMESİ): ${error.message}` };
    }
    return { success: false, message: `Gönderi paylaşılamadı (GERÇEK API DENEMESİ): Bilinmeyen bir API hatası oluştu.` };
  }
}

export async function sendContentByEmailAction(post: Post, recipientEmail: string): Promise<{ success: boolean; message: string }> {
  console.log('--- [E-POSTA GÖNDERME DENEMESİ BAŞLANGICI (actions.ts)] ---');
  console.log('[ACTIONS.TS] process.cwd():', process.cwd());
  
  // Ortam değişkenlerinin doğrudan değerlerini loglayalım
  const rawSenderEmail = process.env.EMAIL_SENDER_ADDRESS;
  const rawAppPassword = process.env.EMAIL_APP_PASSWORD;

  console.log(`[ACTIONS.TS] Okunan process.env.EMAIL_SENDER_ADDRESS: ${rawSenderEmail || 'BULUNAMADI'}`);
  console.log(`[ACTIONS.TS] Okunan process.env.EMAIL_APP_PASSWORD: ${rawAppPassword ? 'MEVCUT (gizli)' : 'BULUNAMADI'}`);
  
  const senderEmail = rawSenderEmail;
  const appPassword = rawAppPassword;

  if (!senderEmail || !appPassword) {
    const errorMessage = 'E-posta gönderimi yapılandırma hatası: Gönderen e-posta adresi (EMAIL_SENDER_ADDRESS) veya uygulama şifresi (EMAIL_APP_PASSWORD) ortam değişkenlerinde tanımlanmamış. Lütfen projenizin ana dizinindeki .env.local dosyasını doğru yapılandırdığınızdan ve sunucuyu yeniden başlattığınızdan emin olun.';
    console.error(`[E-POSTA GÖNDERME HATASI - actions.ts] ${errorMessage}`);
    return {
      success: false,
      message: errorMessage,
    };
  }

  console.log(`[ACTIONS.TS] Kullanılacak gönderen e-posta: ${senderEmail}`);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: appPassword,
    },
  });

  const emailSubject = `Kozmos Küratörü Yeni Gönderi İçeriği: ${post.topic || 'Bilinmeyen Konu'}`;
  let emailBody = `Merhaba,\n\nYapay zeka sizin için yeni bir Instagram gönderi içeriği hazırladı:\n\n`;
  emailBody += `Konu: ${post.topic || 'Belirtilmemiş'}\n\n`;
  emailBody += `Başlık Önerisi:\n${post.caption || 'Başlık oluşturulamadı.'}\n\n`;
  emailBody += `Hashtag Önerileri:\n${post.hashtags && post.hashtags.length > 0 ? post.hashtags.map(h => `#${h}`).join(' ') : 'Hashtag oluşturulamadı.'}\n\n`;
  emailBody += `Resim URL'si (veya Veri URI'si):\n${post.imageUrl || 'Resim URL yok.'}\n\n`;
  emailBody += `Saygılarımızla,\nKozmos Küratörü (Yapay Zeka Asistanı)`;

  const mailOptions = {
    from: `"Kozmos Küratörü AI" <${senderEmail}>`,
    to: recipientEmail,
    subject: emailSubject,
    text: emailBody,
    html: `<p>Merhaba,</p><p>Yapay zeka sizin için yeni bir Instagram gönderi içeriği hazırladı:</p>
           <p><b>Konu:</b> ${post.topic || 'Belirtilmemiş'}</p>
           <p><b>Başlık Önerisi:</b></p><pre>${post.caption || 'Başlık oluşturulamadı.'}</pre>
           <p><b>Hashtag Önerileri:</b><br/>${post.hashtags && post.hashtags.length > 0 ? post.hashtags.map(h => `#${h}`).join(' ') : 'Hashtag oluşturulamadı.'}</p>
           <p><b>Resim URL'si (veya Veri URI'si):</b><br/>${post.imageUrl ? (post.imageUrl.startsWith('data:image') ? '<i>(Resim verisi e-postaya eklenmedi, aşağıda link olarak verilmiştir)</i><br/>' : `<img src="${post.imageUrl}" alt="Gönderi Resmi" style="max-width: 400px; height: auto;"><br/>`) : ''}${post.imageUrl || 'Resim URL yok.'}</p>
           <p>Saygılarımızla,<br/>Kozmos Küratörü (Yapay Zeka Asistanı)</p>`,
  };

  try {
    console.log(`[ACTIONS.TS] E-posta gönderme deneniyor. Alıcı: ${recipientEmail}, Konu: "${emailSubject}"`);
    const info = await transporter.sendMail(mailOptions);
    console.log('[ACTIONS.TS] E-posta başarıyla gönderildi. Message ID: %s', info.messageId);
    console.log("--- [E-POSTA GÖNDERME DENEMESİ SONU - BAŞARILI (actions.ts)] ---");
    return {
      success: true,
      message: `E-posta başarıyla ${recipientEmail} adresine gönderildi. (Gönderen: ${senderEmail})`,
    };
  } catch (error) {
    console.error('[ACTIONS.TS] E-posta gönderme hatası:', error);
     let errorMessageText = 'E-posta gönderme denemesi sırasında bir hata oluştu.';
    if (error instanceof Error) {
        errorMessageText += ` Detay: ${error.message}`;
        // @ts-ignore
        if (error.code === 'EAUTH' || error.responseCode === 535) {
            // @ts-ignore
            errorMessageText += ` Kimlik doğrulama hatası (Kod: ${error.code || error.responseCode}). Lütfen e-posta adresi ve uygulama şifresini kontrol edin. Google hesap ayarlarınızda doğru yapılandırmayı yaptığınızdan emin olun (2 Adımlı Doğrulama aktif ve geçerli bir Uygulama Şifresi).`;
        // @ts-ignore
        } else if (error.code === 'ECONNECTION' || error.responseCode === 500) {
             // @ts-ignore
            errorMessageText += ` Bağlantı hatası (Kod: ${error.code || error.responseCode}). İnternet bağlantınızı veya e-posta sunucusu ayarlarını kontrol edin.`;
        }
    }
    console.log("--- [E-POSTA GÖNDERME DENEMESİ SONU - BAŞARISIZ (actions.ts)] ---");
    return {
      success: false,
      message: errorMessageText,
    };
  }
}

    