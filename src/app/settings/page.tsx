
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Instagram, Loader2, KeyRound, AlertTriangle, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const INSTAGRAM_TOKEN_KEY = 'instagramAccessToken_sim';
const INSTAGRAM_USERNAME_KEY = 'instagramUsername_sim'; 

export default function SettingsPage() {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem(INSTAGRAM_TOKEN_KEY);
    const storedUsername = localStorage.getItem(INSTAGRAM_USERNAME_KEY);
    if (storedToken) {
      setIsConnected(true);
      setUsername(storedUsername || 'Bilinmeyen Kullanıcı'); 
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
    // SİMÜLASYON: Gerçek bir API çağrısı yok. Sadece localStorage'a kaydediyoruz.
    // GERÇEK BİR UYGULAMADA BU ÇOK GÜVENSİZDİR!
    localStorage.setItem(INSTAGRAM_TOKEN_KEY, accessToken);
    
    // Kullanıcı adı için basit bir yer tutucu, gerçekte bu API'den alınabilir veya kullanıcıdan istenebilir.
    const simulatedUsername = `kullanici_test_${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem(INSTAGRAM_USERNAME_KEY, simulatedUsername);

    setUsername(simulatedUsername);
    setIsConnected(true);
    setIsLoading(false);
    setAccessToken(''); 
    toast({
      title: 'Belirteç Kaydedildi (YEREL SİMÜLASYON)',
      description: (
        <div>
          <p>{simulatedUsername} adına belirteciniz yerel olarak (tarayıcıda) saklandı.</p>
          <p className="font-bold text-yellow-400 mt-2">BU YÖNTEM GERÇEK KULLANIM İÇİN KESİNLİKLE GÜVENLİ DEĞİLDİR!</p>
          <p className="text-xs">Sadece test ve geliştirme amaçlıdır.</p>
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

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Ayarlar
        </h1>
        <p className="text-muted-foreground">
          Uygulama tercihlerinizi ve Instagram API bağlantı (TEST) ayarlarınızı yönetin.
        </p>
      </div>
      <Separator className="my-6" />

      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Instagram className="h-6 w-6 text-pink-600" />
            Instagram Bağlantısı (TEST ve SİMÜLASYON Amaçlı)
          </CardTitle>
          <CardDescription>
            Elde ettiğiniz Instagram Erişim Belirtecinizi (Access Token) buraya girerek gönderi paylaşımını test edebilirsiniz.
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
              <p className="font-semibold text-yellow-300">Instagram API Testi İçin Önemli Not: Yapay zeka tarafından oluşturulan resimler veri URI'si (`data:image/...`) formatındadır. Instagram Graph API, `image_url` parametresi ile resim yüklerken, bu URL'nin HERKESE AÇIK BİR İNTERNET ADRESİ olmasını bekler. Veri URI'leri ile doğrudan API çağrısı BAŞARISIZ OLACAKTIR. Test için herkese açık bir resim URL'si kullanmanız veya resmi önce bir yere yükleyip URL'sini kullanmanız gerekir.</p>
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
                Instagram hesabına yerel belirteç ile bağlı (SİMÜLASYON): <span className="font-bold text-green-300">@{username}</span>
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
                Erişim Belirtecini Kaydet ve Bağlan (Sadece Yerel Test İçin)
              </Button>
            </div>
          )}

          <div className="mt-6 p-4 border rounded-md bg-muted/50">
            <h4 className="font-semibold text-sm text-foreground mb-2">Gerçek Instagram Entegrasyonu Adımları:</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bu sayfadaki işlevsellik, gerçek bir Instagram entegrasyonunun **çok basitleştirilmiş ve güvensiz bir simülasyonudur**. Üretim seviyesinde bir entegrasyon aşağıdaki gibi adımları içerir:
            </p>
            <ol className="list-decimal list-inside text-xs text-muted-foreground mt-2 space-y-1">
              <li>**Meta Geliştirici Hesabı ve Uygulama Oluşturma:** Meta for Developers portalında bir hesap açın ve yeni bir uygulama kaydedin. Gerekli ürünleri (örn: Instagram Graph API) ekleyin ve izinleri (örn: `instagram_content_publish`) yapılandırın.</li>
              <li>**OAuth 2.0 Yönlendirme URL'lerini Ayarlama:** Güvenli kimlik doğrulama akışı için geçerli yönlendirme (redirect) URI'ları belirleyin.</li>
              <li>**Sunucu Tarafında Güvenli OAuth Akışını Uygulama:**
                <ul className="list-disc list-inside ml-4">
                  <li>Kullanıcıyı Instagram'ın yetkilendirme sayfasına yönlendirin.</li>
                  <li>Kullanıcı izin verdikten sonra uygulamanızın yönlendirme URI'sına dönen yetkilendirme kodunu alın.</li>
                  <li>Bu kodu, sunucu tarafında (App ID ve App Secret kullanarak) bir Instagram Kullanıcı Erişim Belirteci (Access Token) ile değiştirin.</li>
                </ul>
              </li>
              <li>**Erişim Belirteçlerini Güvenli Saklama:** Elde edilen erişim belirteçlerini (ve varsa yenileme belirteçlerini) sunucu tarafında, şifrelenmiş ve güvenli bir veritabanında saklayın. **Asla istemci tarafında veya kod içinde saklamayın.**</li>
              <li>**API İsteklerini Sunucu Üzerinden Yapma:** Instagram API'lerine (örneğin gönderi paylaşma) tüm istekleri, sakladığınız erişim belirtecini kullanarak sunucu tarafındaki kodunuzdan yapın. Erişim belirtecini asla istemci tarafına (tarayıcıya) göndermeyin.</li>
              <li>**Belirteç Yenileme ve Hata Yönetimi:** Uzun ömürlü belirteçlerin süresi dolmadan önce yenileyin ve API'den gelebilecek hataları uygun şekilde yönetin.</li>
               <li>**Resim Yükleme:** Instagram Graph API'ye resim yüklerken, resmin herkese açık bir URL'de barındırılması veya API'nin beklediği formatta (örn: multipart/form-data) yüklenmesi gerekir. Veri URI'leri (`data:image/...`) genellikle doğrudan kabul edilmez.</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3 font-semibold">
              Bu adımlar, uygulamanızın güvenliği, stabilitesi ve Instagram platform politikalarına uyumu açısından kritik öneme sahiptir ve genellikle özel backend geliştirme uzmanlığı gerektirir.
            </p>
             <Button variant="outline" size="sm" asChild className="mt-3">
              <a href="https://developers.facebook.com/docs/instagram-api" target="_blank" rel="noopener noreferrer">
                Instagram Graph API Dokümanları <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
