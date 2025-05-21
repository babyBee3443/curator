
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Instagram, Loader2 } from 'lucide-react';

// Gelecekte kullanılacak gerçek eylemler için yer tutucular:
// import { connectToInstagramAction, getInstagramConnectionStatusAction, disconnectFromInstagramAction } from '@/lib/actions';

export default function SettingsPage() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Tarayıcıda simüle edilmiş bağlantı durumunu kontrol et
    const mockStatus = localStorage.getItem('instagramConnected_sim');
    const mockUsername = localStorage.getItem('instagramUsername_sim');
    if (mockStatus === 'true' && mockUsername) {
      setIsConnected(true);
      setUsername(mockUsername);
    }
    setIsLoading(false);
  }, []);

  const handleConnectInstagram = async () => {
    setIsLoading(true);
    toast({
      title: 'Instagram Bağlantısı Kuruluyor... (Simülasyon)',
      description: 'Bu adımda normalde Instagram\'ın kimlik doğrulama sayfasına yönlendirilirsiniz.',
    });

    // Simülasyon: 1.5 saniye sonra başarılı bağlantı
    setTimeout(() => {
      localStorage.setItem('instagramConnected_sim', 'true');
      localStorage.setItem('instagramUsername_sim', 'kozmos_kuratoru_test');
      setIsConnected(true);
      setUsername('kozmos_kuratoru_test');
      setIsLoading(false);
      toast({
        title: 'Bağlantı Başarılı! (Simülasyon)',
        description: '@kozmos_kuratoru_test hesabınız bağlandı.',
        className: 'bg-green-600 text-white',
      });
    }, 1500);
  };

  const handleDisconnectInstagram = async () => {
    setIsLoading(true);
    // Simülasyon: Bağlantıyı kes
    localStorage.removeItem('instagramConnected_sim');
    localStorage.removeItem('instagramUsername_sim');
    setIsConnected(false);
    setUsername(null);
    setIsLoading(false);
    toast({
      title: 'Bağlantı Kesildi (Simülasyon)',
      description: 'Instagram hesap bağlantınız kaldırıldı.',
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
            Instagram Bağlantısı
          </CardTitle>
          <CardDescription>
            Kozmos Küratörü'nü Instagram hesabınıza bağlayarak gönderi paylaşımını (gelecekte) otomatikleştirin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !isConnected && ( // Sadece ilk yüklemede ve bağlantı yokken göster
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Bağlantı durumu kontrol ediliyor...</span>
            </div>
          )}
          {!isLoading && isConnected && username && (
            <div className="space-y-4">
              <p className="text-green-600 font-semibold">
                Instagram hesabına bağlı: <span className="font-bold">@{username}</span> (Simülasyon)
              </p>
              <Button variant="outline" onClick={handleDisconnectInstagram} disabled={isLoading}>
                {isLoading && username ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Bağlantıyı Kes (Simülasyon)
              </Button>
            </div>
          )}
          {!isLoading && !isConnected && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Henüz Instagram hesabınızı bağlamadınız.
              </p>
              <Button 
                onClick={handleConnectInstagram} 
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white hover:opacity-90"
              >
                {isLoading && !username ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Instagram className="mr-2 h-5 w-5" />}
                Instagram'a Bağlan (Simülasyon)
              </Button>
            </div>
          )}
          <div className="mt-6 p-4 border rounded-md bg-muted/50">
            <h4 className="font-semibold text-sm text-foreground mb-2">Gerçek Instagram Entegrasyonu Hakkında Not:</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bu sayfada gördüğünüz Instagram bağlantı işlevi şu anda bir **simülasyondur**. Gerçek bir Instagram entegrasyonu aşağıdaki gibi adımları içerir ve kapsamlı backend geliştirmesi gerektirir:
            </p>
            <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 space-y-1">
              <li>Meta (Facebook) Geliştirici Portalı'nda bir uygulama oluşturulması ve API anahtarlarının (Client ID, Client Secret) alınması.</li>
              <li>Güvenli OAuth 2.0 kimlik doğrulama akışının sunucu tarafında (backend) uygulanması. Bu, kullanıcıyı Instagram'a yönlendirmeyi, geri dönen yetkilendirme kodunu almayı ve bu kodu bir erişim token'ı ile değiştirmeyi içerir.</li>
              <li>Erişim token'larının (access tokens) ve yenileme token'larının (refresh tokens) güvenli bir şekilde sunucu tarafında saklanması ve yönetilmesi.</li>
              <li>Bu token'ları kullanarak Instagram API'lerine (içerik yayınlama, profil bilgisi alma vb.) isteklerin yapılması.</li>
              <li>API kullanım limitlerinin ve hata yönetiminin ele alınması.</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              Bu adımlar, güvenlik ve stabilite açısından kritik öneme sahiptir ve genellikle özel backend geliştirme uzmanlığı gerektirir. Mevcut arayüz, bu karmaşık sürecin bir başlangıç noktası olarak tasarlanmıştır.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
