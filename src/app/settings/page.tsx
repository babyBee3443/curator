
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Instagram, Loader2, KeyRound, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const INSTAGRAM_TOKEN_KEY = 'instagramAccessToken_sim';
const INSTAGRAM_USERNAME_KEY = 'instagramUsername_sim'; // Kullanıcı adı için de bir anahtar

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
      setUsername(storedUsername || 'Bilinmeyen Kullanıcı'); // Kullanıcı adı yoksa varsayılan
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
    localStorage.setItem(INSTAGRAM_TOKEN_KEY, accessToken);
    // Kullanıcı adı için basit bir yer tutucu, gerçekte bu API'den alınır.
    const simulatedUsername = `kullanici_${Math.random().toString(36).substring(2, 7)}`;
    localStorage.setItem(INSTAGRAM_USERNAME_KEY, simulatedUsername);

    setUsername(simulatedUsername);
    setIsConnected(true);
    setIsLoading(false);
    setAccessToken(''); // Giriş alanını temizle
    toast({
      title: 'Belirteç Kaydedildi (Simülasyon)',
      description: `${simulatedUsername} adına belirteciniz yerel olarak (tarayıcıda) saklandı. GERÇEK KULLANIM İÇİN BU GÜVENLİ DEĞİLDİR!`,
      className: 'bg-yellow-500 text-black',
      duration: 7000,
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
      title: 'Bağlantı Kesildi (Simülasyon)',
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
          Uygulama tercihlerinizi ve entegrasyonlarınızı yönetin.
        </p>
      </div>
      <Separator className="my-6" />

      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Instagram className="h-6 w-6 text-pink-600" />
            Instagram Bağlantısı (Simülasyon ve Test Amaçlı)
          </CardTitle>
          <CardDescription>
            Instagram Erişim Belirtecinizi (Access Token) buraya girerek gönderi paylaşım simülasyonunu etkinleştirin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive" className="bg-red-900 border-red-700 text-white">
            <AlertTriangle className="h-5 w-5 text-yellow-300" />
            <AlertTitle className="text-yellow-300 font-bold">ÇOK ÖNEMLİ GÜVENLİK UYARISI!</AlertTitle>
            <AlertDescription className="text-neutral-200">
              Bu bölüm **sadece test ve geliştirme simülasyonu** içindir. Gerçek Instagram Erişim Belirteçlerini (Access Token) doğrudan tarayıcıya girmek ve yerel depolamada (`localStorage`) saklamak **KESİNLİKLE GÜVENLİ DEĞİLDİR**.
              Gerçek bir uygulamada, erişim belirteçleri sunucu tarafında güvenli bir şekilde saklanmalı ve yönetilmelidir (OAuth 2.0 akışı ile).
              Buraya girdiğiniz belirteçler tarayıcınızda kalır ve yetkisiz erişime açık olabilir. **Lütfen bu özelliği sadece kısa süreli testler için ve üretim dışı (test) belirteçleriyle kullanın.**
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
                Instagram hesabına yerel belirteç ile bağlı (Simülasyon): <span className="font-bold text-green-300">@{username}</span>
              </p>
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
                  type="password" // Hassas bilgi olduğu için maskeleyelim
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Meta Geliştirici Portalından aldığınız belirteci buraya yapıştırın"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Bu belirteç sadece tarayıcınızda saklanacaktır ve GÜVENLİ DEĞİLDİR. Test amaçlı kullanın.
                </p>
              </div>
              <Button
                onClick={handleSaveToken}
                disabled={isLoading || !accessToken.trim()}
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white hover:opacity-90 w-full"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Instagram className="mr-2 h-5 w-5" />}
                Erişim Belirtecini Kaydet ve Bağlan (Simülasyon)
              </Button>
            </div>
          )}

          <div className="mt-6 p-4 border rounded-md bg-muted/50">
            <h4 className="font-semibold text-sm text-foreground mb-2">Gerçek Instagram Entegrasyonu Adımları:</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bu sayfadaki işlevsellik, gerçek bir Instagram entegrasyonunun **çok basitleştirilmiş bir simülasyonudur**. Gerçek bir entegrasyon aşağıdaki gibi adımları içerir:
            </p>
            <ol className="list-decimal list-inside text-xs text-muted-foreground mt-2 space-y-1">
              <li>**Meta Geliştirici Hesabı ve Uygulama Oluşturma:** Meta for Developers portalında bir hesap açın ve yeni bir uygulama kaydedin.</li>
              <li>**Instagram Graph API Ürününü Ekleme:** Oluşturduğunuz uygulamaya "Instagram Graph API" ürününü ekleyin ve gerekli izinleri (örn: `instagram_content_publish`) yapılandırın.</li>
              <li>**OAuth 2.0 Yönlendirme URL'lerini Ayarlama:** Güvenli kimlik doğrulama akışı için geçerli yönlendirme (redirect) URI'ları belirleyin.</li>
              <li>**Sunucu Tarafında OAuth Akışını Uygulama:**
                <ul className="list-disc list-inside ml-4">
                  <li>Kullanıcıyı Instagram'ın yetkilendirme sayfasına yönlendirin.</li>
                  <li>Kullanıcı izin verdikten sonra uygulamanızın yönlendirme URI'sına dönen yetkilendirme kodunu alın.</li>
                  <li>Bu kodu, sunucu tarafında bir Instagram Kullanıcı Erişim Belirteci (Access Token) ile değiştirin. Bu işlem için Uygulama Kimliğiniz (App ID) ve Uygulama Sırrınız (App Secret) gerekir.</li>
                </ul>
              </li>
              <li>**Erişim Belirteçlerini Güvenli Saklama:** Elde edilen erişim belirteçlerini (ve varsa yenileme belirteçlerini) sunucu tarafında, şifrelenmiş ve güvenli bir veritabanında saklayın.</li>
              <li>**API İsteklerini Sunucu Üzerinden Yapma:** Instagram API'lerine (örneğin gönderi paylaşma) tüm istekleri, sakladığınız erişim belirtecini kullanarak sunucu tarafındaki kodunuzdan yapın. Erişim belirtecini asla istemci tarafına (tarayıcıya) göndermeyin.</li>
              <li>**Belirteç Yenileme ve Hata Yönetimi:** Uzun ömürlü belirteçlerin süresi dolmadan önce yenileyin ve API'den gelebilecek hataları uygun şekilde yönetin.</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3 font-semibold">
              Bu adımlar, güvenlik ve stabilite açısından kritik öneme sahiptir ve genellikle özel backend geliştirme uzmanlığı gerektirir.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    