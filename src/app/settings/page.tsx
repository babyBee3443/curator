
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Instagram, Loader2, KeyRound, AlertTriangle, ExternalLink, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const INSTAGRAM_TOKEN_KEY = 'instagramAccessToken_sim';
const INSTAGRAM_USERNAME_KEY = 'instagramUsername_sim';
const EMAIL_RECIPIENT_KEY = 'emailRecipient_sim';

export default function SettingsPage() {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(INSTAGRAM_TOKEN_KEY);
    const storedUsername = localStorage.getItem(INSTAGRAM_USERNAME_KEY);
    if (storedToken) {
      setIsConnected(true);
      setUsername(storedUsername || 'Bilinmeyen Kullanıcı');
    }
    const storedRecipientEmail = localStorage.getItem(EMAIL_RECIPIENT_KEY);
    if (storedRecipientEmail) {
      setRecipientEmail(storedRecipientEmail);
    } else {
      setRecipientEmail('sirfpubg12@gmail.com'); 
    }
    setIsLoading(false);
  }, []);

  const handleSaveToken = () => {
    if (!accessToken.trim()) {
      toast({
        title: 'Eksik Bilgi',
        description: 'Lütfen geçerli bir Instagram Erişim Belirteci girin.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    localStorage.setItem(INSTAGRAM_TOKEN_KEY, accessToken);
    const simulatedUsername = `kullanici_test_${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem(INSTAGRAM_USERNAME_KEY, simulatedUsername);
    setUsername(simulatedUsername);
    setIsConnected(true);
    setIsLoading(false);
    setAccessToken(''); 
    toast({
      title: 'Belirteç Kaydedildi (YEREL OLARAK - GÜVENSİZ)',
      description: (
        <div>
          <p>{simulatedUsername} adına belirteciniz yerel olarak (tarayıcıda) saklandı.</p>
          <p className="font-bold text-yellow-400 mt-2">BU YÖNTEM GERÇEK KULLANIM İÇİN KESİNLİKLE GÜVENLİ DEĞİLDİR!</p>
          <p className="text-xs">Sadece test ve geliştirme amaçlıdır. Bu belirteç, "Instagram'da Paylaş (GERÇEK API DENEMESİ)" butonu tarafından kullanılacaktır.</p>
        </div>
      ),
      className: 'bg-yellow-600 text-white border-yellow-700',
      duration: 10000, 
    });
  };

  const handleDisconnectInstagram = () => {
    setIsLoading(true);
    localStorage.removeItem(INSTAGRAM_TOKEN_KEY);
    localStorage.removeItem(INSTAGRAM_USERNAME_KEY);
    setIsConnected(false);
    setUsername(null);
    setIsLoading(false);
    toast({
      title: 'Bağlantı Kesildi (Yerel Belirteç Silindi)',
      description: 'Instagram Erişim Belirteciniz yerel depolamadan kaldırıldı.',
    });
  };

  const handleSaveRecipientEmail = () => {
    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      toast({
        title: 'Geçersiz E-posta',
        description: 'Lütfen geçerli bir alıcı e-posta adresi girin.',
        variant: 'destructive',
      });
      return;
    }
    setIsSavingEmail(true);
    localStorage.setItem(EMAIL_RECIPIENT_KEY, recipientEmail);
    setIsSavingEmail(false);
    toast({
      title: 'Alıcı E-posta Kaydedildi',
      description: `Gönderi içerikleri için alıcı e-posta adresi "${recipientEmail}" olarak yerel depolamaya kaydedildi.`,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Ayarlar
        </h1>
        <p className="text-muted-foreground">
          Uygulama tercihlerinizi, Instagram API bağlantı (TEST) ve E-posta Bildirim ayarlarınızı yönetin.
        </p>
      </div>
      <Separator className="my-6" />

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Instagram className="h-6 w-6 text-pink-600" />
              Instagram Bağlantısı (DENEysel Gerçek API Çağrısı)
            </CardTitle>
            <CardDescription>
              Meta Geliştirici Portalından aldığınız Uzun Ömürlü Kullanıcı Erişim Belirtecinizi (Access Token) buraya girerek GERÇEK Instagram API'sine gönderi paylaşımını test edebilirsiniz.
              <strong className="block mt-2 text-destructive">UYARI: Bu özellik veri URI'si formatındaki (mevcut yapay zeka tarafından üretilenler gibi) resimlerle ÇALIŞMAYACAKTIR. Resmin herkese açık bir URL olması gerekir.</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive" className="bg-red-900 border-red-700 text-white">
              <AlertTriangle className="h-5 w-5 text-yellow-300" />
              <AlertTitle className="text-yellow-300 font-bold">ÇOK ÖNEMLİ GÜVENLİK VE KULLANIM UYARILARI!</AlertTitle>
              <AlertDescription className="text-neutral-200 space-y-2">
                <p>Bu bölümdeki işlevsellik, Instagram API'si ile **deneme ve test amaçlı** etkileşim kurmak içindir. Gerçek Instagram Erişim Belirteçlerini (Access Token) doğrudan tarayıcıya girmek ve yerel depolamada (`localStorage`) saklamak **KESİNLİKLE GÜVENLİ DEĞİLDİR** ve üretim ortamlarında **ASLA KULLANILMAMALIDIR**.</p>
                <p>Gerçek bir uygulamada, erişim belirteçleri sunucu tarafında güvenli bir şekilde (örneğin, şifrelenmiş veritabanında) saklanmalı, OAuth 2.0 akışı ile alınmalı/yenilenmeli ve tüm API çağrıları bu güvenli sunucu ortamından yapılmalıdır.</p>
                <p className="font-semibold">Bu sayfaya girdiğiniz belirteçler SADECE tarayıcınızda kalır ve yetkisiz erişime, güvenlik açıklarına son derece müsaittir.</p>
                <p className="font-bold text-yellow-300">Instagram API Testi İçin En Önemli Not: Yapay zeka tarafından oluşturulan resimler genellikle veri URI'si (`data:image/...`) formatındadır. Instagram Graph API, `image_url` parametresi ile resim yüklerken, bu URL'nin HERKESE AÇIK BİR İNTERNET ADRESİ olmasını bekler. Veri URI'leri ile doğrudan API çağrısı BAŞARISIZ OLACAKTIR. Bu testin çalışması için, paylaşılacak resmin önce herkese açık bir sunucuya yüklenip (örneğin Imgur, Firebase Storage vb.) o URL'nin kullanılması veya gönderi oluşturulurken bu tür bir URL'nin manuel olarak girilmesi gerekir.</p>
              </AlertDescription>
            </Alert>

            {isLoading && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Bağlantı durumu kontrol ediliyor...</span>
              </div>
            )}

            {!isLoading && isConnected && username && (
              <div className="space-y-3 p-4 border border-green-500 rounded-md bg-green-500/10">
                <p className="text-green-400 font-semibold">
                  Instagram hesabına yerel belirteç ile bağlı: <span className="font-bold text-green-300">@{username}</span> (Bu sadece bir testtir ve yerel belirteç kullanır)
                </p>
                <p className="text-xs text-yellow-500">UYARI: Bu bağlantı sadece yerel depolama kullanır ve GÜVENLİ DEĞİLDİR.</p>
                <Button variant="outline" onClick={handleDisconnectInstagram} disabled={isLoading} className="border-red-500 text-red-500 hover:bg-red-500/10">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Bağlantıyı Kes (Yerel Belirteci Sil)
                </Button>
              </div>
            )}

            {!isLoading && !isConnected && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="accessToken" className="text-base font-medium text-foreground mb-2 flex items-center gap-1">
                    <KeyRound className="h-5 w-5 text-accent" />
                    Instagram Erişim Belirteci (Access Token):
                  </Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Meta Geliştirici Portalından aldığınız UZUN ÖMÜRLÜ belirteci buraya yapıştırın"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Bu belirteç sadece tarayıcınızda saklanacaktır ve GÜVENLİ DEĞİLDİR. Sadece test amaçlı kullanın.
                  </p>
                </div>
                <Button
                  onClick={handleSaveToken}
                  disabled={isLoading || !accessToken.trim()}
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white hover:opacity-90 w-full"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Instagram className="mr-2 h-5 w-5" />}
                  Erişim Belirtecini Kaydet ve Bağlan (Test Amaçlı)
                </Button>
              </div>
            )}
             <div className="mt-6 p-4 border rounded-md bg-muted/50">
                <h4 className="font-semibold text-sm text-foreground mb-2">Gerçek Instagram Entegrasyonu Adımları:</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                Bu sayfadaki işlevsellik, gerçek bir Instagram entegrasyonunun **çok basitleştirilmiş ve güvensiz bir test arayüzüdür**. Üretim seviyesinde bir entegrasyon aşağıdaki gibi adımları içerir:
                </p>
                <ol className="list-decimal list-inside text-xs text-muted-foreground mt-2 space-y-1">
                <li>**Meta Geliştirici Hesabı ve Uygulama Oluşturma:** Meta for Developers portalında bir hesap açın ve yeni bir uygulama kaydedin. Gerekli ürünleri (örn: Instagram Graph API) ekleyin ve izinleri (örn: `instagram_content_publish`) yapılandırın.</li>
                <li>**OAuth 2.0 Yönlendirme URL'lerini Ayarlama:** Güvenli kimlik doğrulama akışı için geçerli yönlendirme (redirect) URI'ları belirleyin.</li>
                <li>**Sunucu Tarafında Güvenli OAuth Akışını Uygulama.**</li>
                <li>**Erişim Belirteçlerini Güvenli Saklama:** Elde edilen erişim belirteçlerini sunucu tarafında, şifrelenmiş ve güvenli bir veritabanında saklayın.</li>
                <li>**API İsteklerini Sunucu Üzerinden Yapma.**</li>
                <li>**Belirteç Yenileme ve Hata Yönetimi.**</li>
                <li>**Resim Yükleme:** Instagram Graph API'ye resim yüklerken, resmin herkese açık bir URL'de barındırılması gerekir.</li>
                </ol>
                 <Button variant="outline" size="sm" asChild className="mt-3">
                <a href="https://developers.facebook.com/docs/instagram-api" target="_blank" rel="noopener noreferrer">
                    Instagram Graph API Dokümanları <ExternalLink className="ml-2 h-3 w-3" />
                </a>
                </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Mail className="h-6 w-6 text-blue-500" />
              E-posta Bildirim Ayarları
            </CardTitle>
            <CardDescription>
              Oluşturulan gönderi içeriklerinin e-posta ile gönderilmesi için alıcı e-posta adresini ayarlayın. Bu özellik, Nodemailer ve Google Uygulama Şifresi kullanarak gerçek e-posta göndermeyi dener.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="default" className="bg-blue-500/10 border-blue-500/50">
              <Mail className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-700 font-bold">E-posta Gönderimi Hakkında (Nodemailer ile Gerçek Deneme)</AlertTitle>
              <AlertDescription className="text-blue-600/90 space-y-2">
                <p>Bu bölüm, yapay zeka tarafından oluşturulan gönderi içeriklerinin size e-posta ile gönderilmesini **denemek** içindir. "İçeriği E-posta İle Gönder" butonuna tıkladığınızda, sistem Nodemailer kütüphanesini kullanarak e-posta göndermeye çalışacaktır.</p>
                <p className="font-semibold">Gerçek E-posta Gönderimi İçin Yapılması Gerekenler:</p>
                <ol className="list-decimal list-inside text-xs pl-4 space-y-1.5">
                  <li>
                    <strong>Nodemailer Kurulumu Kontrolü:</strong> Bu özellik için `nodemailer` kütüphanesi `package.json` dosyanıza eklenmişti. Eğer `node_modules` klasörünüzde bir sorun olduğunu düşünüyorsanız veya emin değilseniz, projenizin ana dizininde `npm install` (veya `yarn install`) komutunu tekrar çalıştırın.
                  </li>
                  <li>
                    <strong>`.env.local` Dosyası Oluşturun (veya Kontrol Edin):</strong> Projenizin **ana dizininde** (yani `package.json` dosyasının bulunduğu yerde) `.env.local` adında bir dosya oluşturun. Eğer zaten varsa, içeriğini kontrol edin.
                  </li>
                  <li>
                    <strong>Ortam Değişkenlerini Ekleyin (veya Kontrol Edin):</strong> `.env.local` dosyasının içine aşağıdaki satırları **tam olarak bu şekilde** ekleyin ve kendi bilgilerinizle değiştirin:
                    <pre className="mt-1 p-2 bg-black/20 rounded text-xs whitespace-pre-wrap"><code>EMAIL_SENDER_ADDRESS=getdusbox@gmail.com{'\n'}EMAIL_APP_PASSWORD=qdti jdwa wxpd tkwl</code></pre>
                    (Yukarıdaki değerler, sizin sağladığınız örneklerdir. `EMAIL_APP_PASSWORD` kısmına kendi 16 haneli Google Uygulama Şifrenizi girin.)
                  </li>
                   <li><strong>ÖNEMLİ:</strong> `.env.local` dosyasını **ASLA** Git gibi versiyon kontrol sistemlerine (GitHub, GitLab vb.) göndermeyin. Genellikle `.gitignore` dosyanızda `*.local` veya `/.env*.local` gibi bir satır bulunur, bu da bu tür dosyaların kazara yüklenmesini engeller.</li>
                  <li>
                    <strong>Google Hesap Ayarları:</strong> `EMAIL_SENDER_ADDRESS` olarak belirttiğiniz Gmail hesabınızda:
                    <ul className="list-disc list-inside pl-4 text-xs">
                        <li>İki Adımlı Doğrulama'nın etkinleştirilmiş olması gerekir.</li>
                        <li>Google Hesap ayarlarınızdan bir "Uygulama Şifresi" oluşturmanız ve `.env.local` dosyasındaki `EMAIL_APP_PASSWORD` kısmına bu 16 haneli şifreyi girmeniz gerekir. Normal Gmail şifreniz burada çalışmayacaktır.</li>
                    </ul>
                  </li>
                  <li className="font-bold text-yellow-400 bg-yellow-500/10 p-2 rounded-md">
                    <strong>SUNUCUYU YENİDEN BAŞLATIN (ÇOK ÖNEMLİ):</strong> `.env.local` dosyasını oluşturduktan veya değiştirdikten sonra, değişikliklerin Next.js tarafından algılanması için geliştirme sunucunuzu **durdurup yeniden başlatmanız ZORUNLUDUR**. (Örn: Terminalde Ctrl+C yapıp sonra tekrar `npm run dev` veya `yarn dev`).
                  </li>
                </ol>
                <p className="mt-2">Bu ayarlar doğru yapıldığında, uygulama belirttiğiniz alıcıya e-posta göndermeyi deneyecektir. Hata olması durumunda bildirim alacaksınız ve detaylar için tarayıcı konsolunu ve sunucu terminalindeki logları kontrol edebilirsiniz.</p>
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="recipientEmail" className="text-base font-medium text-foreground mb-2 flex items-center gap-1">
                Alıcı E-posta Adresi:
              </Label>
              <Input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="iceriklerin_gonderilecegi@mail.com"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Oluşturulan gönderi içeriklerinin (başlık, hashtag, resim URL'si) gönderileceği e-posta adresi. Bu adres yerel depolamada saklanacaktır.
              </p>
            </div>
            <Button
              onClick={handleSaveRecipientEmail}
              disabled={isSavingEmail}
              className="w-full"
            >
              {isSavingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-5 w-5" />}
              Alıcı E-posta Adresini Kaydet
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
