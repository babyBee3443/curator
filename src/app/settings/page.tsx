
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, Settings as SettingsIcon, AlertTriangle, Info, Instagram, Link2, Power, PowerOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getInstagramConnectionStatusAction, connectToInstagramAction, disconnectFromInstagramAction } from '@/lib/actions';


const EMAIL_RECIPIENT_KEY = 'emailRecipient_cosmosCurator';
const INSTAGRAM_ACCESS_TOKEN_KEY = 'instagramAccessToken_cosmosCurator';
const INSTAGRAM_USERNAME_KEY = 'instagramUsername_cosmosCurator';

export default function SettingsPage() {
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [instagramAccessToken, setInstagramAccessToken] = useState('');
  const [isConnectingInstagram, setIsConnectingInstagram] = useState(false);
  const [instagramConnectionStatus, setInstagramConnectionStatus] = useState<{isConnected: boolean; username?: string}>({isConnected: false});
  const [isLoadingInstagramStatus, setIsLoadingInstagramStatus] = useState(true);


  useEffect(() => {
    const storedRecipientEmail = localStorage.getItem(EMAIL_RECIPIENT_KEY);
    if (storedRecipientEmail) {
      setRecipientEmail(storedRecipientEmail);
    }
    setIsLoading(false);

    const fetchInstagramStatus = async () => {
      setIsLoadingInstagramStatus(true);
      const status = await getInstagramConnectionStatusAction();
      setInstagramConnectionStatus(status);
      const storedToken = localStorage.getItem(INSTAGRAM_ACCESS_TOKEN_KEY);
      if (storedToken) {
        setInstagramAccessToken(storedToken);
      }
      setIsLoadingInstagramStatus(false);
    };
    fetchInstagramStatus();
  }, []);

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

  const handleConnectInstagram = async () => {
    if (!instagramAccessToken.trim()) {
      toast({
        title: 'Eksik Erişim Belirteci',
        description: 'Lütfen Instagram Erişim Belirtecinizi girin.',
        variant: 'destructive',
      });
      return;
    }
    setIsConnectingInstagram(true);
    // Bu eylem, belirteci localStorage'a kaydeder (güvensiz, sadece test için).
    const result = await connectToInstagramAction(instagramAccessToken);
    toast({
      title: result.success ? 'Instagram Bağlantısı (Simülasyon)' : 'Bağlantı Hatası',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    if (result.success && result.username) {
      setInstagramConnectionStatus({ isConnected: true, username: result.username });
    }
    setIsConnectingInstagram(false);
  };

  const handleDisconnectInstagram = async () => {
    setIsConnectingInstagram(true);
    const result = await disconnectFromInstagramAction();
     toast({
      title: 'Instagram Bağlantısı Kesildi',
      description: result.message,
    });
    setInstagramConnectionStatus({isConnected: false, username: undefined});
    setInstagramAccessToken(''); // Giriş alanını da temizle
    setIsConnectingInstagram(false);
  };


  if (isLoading || isLoadingInstagramStatus) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-accent"/> Ayarlar
        </h1>
        <p className="text-muted-foreground">
          Uygulama ayarlarınızı yönetin.
        </p>
      </div>
      <Separator className="my-6" />

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Mail className="h-6 w-6 text-accent" />
              E-posta Gönderim Ayarları
            </CardTitle>
            <CardDescription>
              Oluşturulan gönderi içeriklerinin e-posta ile gönderilmesi için alıcı e-posta adresini yapılandırın ve gönderen hesap bilgilerini ayarlayın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="default" className="bg-blue-950/70 border-blue-700 text-blue-100">
              <Info className="h-5 w-5 text-blue-300" />
              <AlertTitle className="text-blue-200 font-bold">E-posta Gönderimi İçin Gerekli Kurulum (ÇOK ÖNEMLİ)</AlertTitle>
              <AlertDescription className="text-blue-200/90 space-y-3">
                <p>Bu özellik, yapay zeka tarafından oluşturulan gönderi içeriklerinin size e-posta ile gönderilmesini sağlar. E-posta gönderimi, Nodemailer kütüphanesi ve bir Gmail hesabı üzerinden Uygulama Şifresi kullanılarak gerçekleştirilir.</p>
                <p className="font-semibold text-yellow-300">Gerçek E-posta Gönderimi İçin YAPILMASI ZORUNLU Adımlar:</p>
                <ol className="list-decimal list-inside text-sm pl-4 space-y-2">
                  <li>
                    <strong>Nodemailer Kurulumu (Eğer yapmadıysanız):</strong> Projenizin ana dizininde terminali açıp <code className="bg-black/50 px-1 py-0.5 rounded">npm install nodemailer</code> komutunu çalıştırarak Nodemailer kütüphanesini kurun. Bu, `package.json` dosyanıza Nodemailer'ı ekleyecektir.
                  </li>
                  <li>
                    <strong>`.env` Dosyasını Kontrol Edin/Oluşturun (EN KRİTİK ADIM!):</strong>
                    <ul className="list-disc list-inside pl-4 mt-1 text-xs">
                      <li>Projenizin **ANA DİZİNİNDE** (yani `package.json`, `.git` dosyalarının bulunduğu yerde) **`.env`** adında bir dosya olduğundan emin olun.</li>
                      <li>Eğer dosya zaten varsa, içeriğini kontrol edin. Yoksa oluşturun.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Ortam Değişkenlerini `.env` Dosyasına Ekleyin:</strong> Aşağıdaki satırları **tam olarak bu şekilde** oluşturduğunuz/kontrol ettiğiniz **`.env`** dosyasının içine kopyalayıp yapıştırın ve kendi bilgilerinizle değiştirin (başında veya sonunda fazladan boşluk olmamalı):
                    <pre className="mt-2 p-3 bg-black/50 rounded text-xs whitespace-pre-wrap text-blue-100"><code>EMAIL_USER=getdusbox@gmail.com{'\n'}EMAIL_APP_PASSWORD=csfd eaun yjou bzsz</code></pre>
                    <ul className="list-disc list-inside pl-4 text-xs mt-1">
                        <li><code className="text-yellow-300">EMAIL_USER</code>: E-postaların gönderileceği sizin Gmail adresiniz (örneğin <code className="text-yellow-300">getdusbox@gmail.com</code>).</li>
                        <li><code className="text-yellow-300">EMAIL_APP_PASSWORD</code>: Yukarıdaki Gmail hesabınız için Google Hesap ayarlarınızdan oluşturduğunuz 16 haneli **Uygulama Şifresi** (örneğin <code className="text-yellow-300">csfd eaun yjou bzsz</code>). Normal Gmail şifreniz burada çalışmayacaktır. **Şifreyi tırnak içinde YAZMAYIN.** Değerin başında veya sonunda fazladan boşluk olmadığından emin olun.</li>
                    </ul>
                     <p className="mt-1 text-xs">Not: `.env` dosyanızda <code className="bg-black/50 px-1 py-0.5 rounded">GEMINI_API_KEY</code> gibi başka değişkenler de olabilir. Onları silmeyin, sadece <code className="bg-black/50 px-1 py-0.5 rounded">EMAIL_USER</code> ve <code className="bg-black/50 px-1 py-0.5 rounded">EMAIL_APP_PASSWORD</code> satırlarını ekleyin veya güncelleyin.</p>
                  </li>
                   <li className="text-red-400 font-bold bg-red-900/50 p-2 rounded-md">
                    <strong>SUNUCUYU YENİDEN BAŞLATIN (HAYATİ ÖNEMDE!):</strong> `.env` dosyasını oluşturduktan veya içeriğini değiştirdikten sonra, değişikliklerin Next.js tarafından algılanması için geliştirme sunucunuzu **KESİNLİKLE durdurup (Terminalde Ctrl+C yapıp) sonra tekrar `npm run dev` (veya `yarn dev`) komutuyla YENİDEN BAŞLATMANIZ ZORUNLUDUR.** Bu adımı atlarsanız, ortam değişkenleri yüklenmez ve "Gönderen bilgileri eksik" hatası alırsınız.
                  </li>
                  <li>
                    <strong>Google Hesap Ayarları (EMAIL_USER için):</strong>
                    <ul className="list-disc list-inside pl-4 text-xs mt-1">
                        <li>Hesabınızda İki Adımlı Doğrulama'nın etkinleştirilmiş olması gerekir.</li>
                        <li>Google Hesap ayarlarınızdan bir "Uygulama Şifresi" oluşturmanız ve `.env` dosyasındaki `EMAIL_APP_PASSWORD` kısmına bu 16 haneli şifreyi girmeniz gerekir.</li>
                    </ul>
                  </li>
                   <li><strong>`.env` Dosyasını Gizli Tutun:</strong> Bu dosyayı **ASLA** Git gibi versiyon kontrol sistemlerine (GitHub, GitLab vb.) göndermeyin. Genellikle `.gitignore` dosyanızda `.env` veya `/.env*` gibi bir satır bulunur; bu, bu tür dosyaların kazara yüklenmesini engeller.</li>
                </ol>
                <p className="mt-3">Bu ayarlar doğru yapıldığında, uygulama "İçeriği E-posta İle Gönder" butonuyla belirttiğiniz alıcıya e-posta göndermeyi deneyecektir. Hata olması durumunda bildirim alacaksınız ve detaylar için **tarayıcı konsolunu** ve özellikle **sunucu terminalindeki (Next.js'in çalıştığı yer) logları** kontrol edebilirsiniz.</p>
                 <p className="mt-2 font-semibold text-orange-300">
                    Eğer hala "Gönderen bilgileri eksik" hatası alıyorsanız, lütfen Next.js'in çalıştığı terminaldeki şu logları kontrol edin ve bana iletin:
                </p>
                 <ul className="list-disc list-inside pl-4 text-xs mt-1">
                    <li><code>[ACTIONS.TS] MODÜL YÜKLENDİ...</code></li>
                    <li><code>[ACTIONS.TS] &gt; process.env.EMAIL_USER: "..."</code></li>
                    <li><code>[ACTIONS.TS] &gt; process.env.EMAIL_APP_PASSWORD: "..."</code></li>
                    <li><code>[sendPostByEmail] FONKSIYON ÇAĞRILDI. Alıcı: ...</code></li>
                    <li><code>[sendPostByEmail] Ortam Değişkenleri Kontrolü (Fonksiyon İçi):</code></li>
                    <li><code>[sendPostByEmail] &gt; senderEmail (EMAIL_USER) DEĞERİ: "..." (tip: ...)</code></li>
                    <li><code>[sendPostByEmail] &gt; senderAppPassword DEĞERİ: "..." (tip: ...)</code></li>
                </ul>
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

        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Instagram className="h-6 w-6 text-accent" />
              Instagram API Bağlantısı (Test Amaçlı)
            </CardTitle>
            <CardDescription>
              Instagram API'sine bağlanarak gönderileri doğrudan paylaşmayı deneyin.
              Bu bölüm **sadece test amaçlıdır ve GÜVENLİ DEĞİLDİR.**
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <Alert variant="destructive" className="bg-red-950/80 border-red-700 text-red-100">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <AlertTitle className="text-red-300 font-bold">ÇOK ÖNEMLİ UYARILAR (Instagram API Testi)</AlertTitle>
              <AlertDescription className="text-red-200/90 space-y-2">
                <p>Bu bölüm, Instagram API'sine **gerçek çağrılar yapmayı dener.** Ancak bu yöntem, erişim belirtecinizi tarayıcının yerel depolamasında saklar, bu da **KESİNLİKLE GÜVENLİ DEĞİLDİR** ve üretim ortamlarında ASLA kullanılmamalıdır.</p>
                <p className="font-semibold text-yellow-300">Başarılı Bir Test İçin Gerekenler:</p>
                <ol className="list-decimal list-inside text-sm pl-4 space-y-1">
                  <li>**Meta Geliştirici Hesabı:** Bir Meta Geliştirici hesabınız olmalı ve bir uygulama oluşturmalısınız.</li>
                  <li>**Instagram İşletme/İçerik Üreticisi Hesabı:** Test edeceğiniz Instagram hesabı İşletme veya İçerik Üreticisi türünde olmalı ve bir Facebook Sayfasına bağlı olmalıdır.</li>
                  <li>**Uzun Ömürlü Kullanıcı Erişim Belirteci (Long-Lived User Access Token):** Meta Geliştirici Portalından, uygulamanız için aşağıdaki izinlere sahip bir belirteç almalısınız:
                    <ul className="list-disc list-inside pl-4 mt-1 text-xs">
                      <li><code className="text-yellow-400">instagram_basic</code></li>
                      <li><code className="text-yellow-400">instagram_content_publish</code></li>
                      <li><code className="text-yellow-400">pages_show_list</code></li>
                      <li>(Gerekirse <code className="text-yellow-400">pages_read_engagement</code>)</li>
                    </ul>
                  </li>
                  <li className="text-orange-300 font-bold">**Herkese Açık Resim URL'si (ÇOK KRİTİK):** Instagram API, `image_url` olarak **veri URI'si (data:image/...) KABUL ETMEZ.** Yapay zeka tarafından üretilen resimler bu formattadır ve API çağrısını BAŞARISIZ kılar. Gönderi paylaşımının çalışması için, resmi önce Imgur, Firebase Storage gibi bir servise yükleyip, o resmin **herkese açık HTTPS URL'sini** kullanmanız gerekir. Bu URL'yi manuel olarak gönderi içeriğine (örneğin `PostPreviewCard`'daki `imageUrl` alanına) girmeniz veya bu amaçla ayrı bir yükleme mekanizması geliştirmeniz gerekir.</li>
                </ol>
                 <p className="mt-2">Bu ayarlar doğru yapılmazsa, "Instagram'da Paylaş" butonu çalışmayacak veya hata verecektir.</p>
              </AlertDescription>
            </Alert>

            {instagramConnectionStatus.isConnected ? (
              <div className="space-y-3">
                <Alert variant="default" className="bg-green-950/70 border-green-700 text-green-100">
                  <Link2 className="h-5 w-5 text-green-300"/>
                  <AlertTitle className="text-green-200 font-semibold">Bağlantı Durumu: Bağlı</AlertTitle>
                  <AlertDescription>
                    Instagram hesabınız (<code className="text-green-300">{instagramConnectionStatus.username || 'Bilinmiyor'}</code>) için bir erişim belirteci yerel olarak kaydedilmiş görünüyor.
                  </AlertDescription>
                </Alert>
                <Button onClick={handleDisconnectInstagram} variant="destructive" className="w-full" disabled={isConnectingInstagram}>
                  {isConnectingInstagram ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PowerOff className="mr-2 h-4 w-4" />}
                  Instagram Bağlantısını Kes (Test)
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                 <Alert variant="default" className="bg-yellow-950/70 border-yellow-700 text-yellow-100">
                  <AlertTriangle className="h-5 w-5 text-yellow-300"/>
                  <AlertTitle className="text-yellow-200 font-semibold">Bağlantı Durumu: Bağlı Değil</AlertTitle>
                  <AlertDescription>
                    Instagram API'si ile test yapmak için lütfen aşağıdaki alana Uzun Ömürlü Kullanıcı Erişim Belirtecinizi girin.
                  </AlertDescription>
                </Alert>
                <div>
                  <Label htmlFor="instagramToken" className="text-base font-medium text-foreground mb-2">
                    Instagram Erişim Belirteci (Access Token):
                  </Label>
                  <Input
                    id="instagramToken"
                    type="password" // Şifre gibi görünmesi için
                    value={instagramAccessToken}
                    onChange={(e) => setInstagramAccessToken(e.target.value)}
                    placeholder="Uzun ömürlü erişim belirtecinizi buraya yapıştırın"
                    className="text-sm"
                  />
                   <p className="text-xs text-muted-foreground mt-1">
                    Bu belirteç, tarayıcınızın yerel depolamasında saklanacaktır (Güvensizdir, sadece test için!).
                  </p>
                </div>
                <Button onClick={handleConnectInstagram} className="w-full" disabled={isConnectingInstagram}>
                   {isConnectingInstagram ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                  Instagram'a Bağlan (Test Amaçlı)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
