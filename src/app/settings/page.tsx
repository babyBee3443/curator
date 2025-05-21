
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, AlertTriangle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const EMAIL_RECIPIENT_KEY = 'emailRecipient_cosmosCurator';

export default function SettingsPage() {
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedRecipientEmail = localStorage.getItem(EMAIL_RECIPIENT_KEY);
    if (storedRecipientEmail) {
      setRecipientEmail(storedRecipientEmail);
    }
    setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Ayarlar
        </h1>
        <p className="text-muted-foreground">
          E-posta bildirim ayarlarınızı yönetin.
        </p>
      </div>
      <Separator className="my-6" />

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
        <Card className="w-full max-w-2xl mx-auto shadow-lg">
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
                    <strong>Nodemailer Kurulumu:</strong> Bu özellik için `nodemailer` kütüphanesi projenize eklenmiştir. Eğer `node_modules` klasörünüzde bir sorun olduğunu düşünüyorsanız veya `package.json` dosyasında `nodemailer` görünmüyorsa, projenizin ana dizininde terminali açıp <code className="bg-black/50 px-1 py-0.5 rounded">npm install nodemailer</code> (veya <code className="bg-black/50 px-1 py-0.5 rounded">yarn add nodemailer</code>) komutunu tekrar çalıştırın.
                  </li>
                  <li>
                    <strong>`.env.local` Dosyası Oluşturun (veya Kontrol Edin):</strong>
                    <ul className="list-disc list-inside pl-4 mt-1">
                      <li>Projenizin **ana dizininde** (yani `package.json` dosyasının bulunduğu yerde) `.env.local` adında bir dosya oluşturun.</li>
                      <li>Eğer dosya zaten varsa, içeriğini ve adını (başında nokta olduğundan emin olun) kontrol edin.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Ortam Değişkenlerini Ekleyin:</strong> `.env.local` dosyasının içine aşağıdaki satırları **tam olarak bu şekilde** ekleyin ve kendi bilgilerinizle değiştirin:
                    <pre className="mt-2 p-3 bg-black/50 rounded text-xs whitespace-pre-wrap text-blue-100"><code>EMAIL_SENDER_ADDRESS=getdusbox@gmail.com{'\n'}EMAIL_APP_PASSWORD=qdti jdwa wxpd tkwl</code></pre>
                    <ul className="list-disc list-inside pl-4 text-xs mt-1">
                        <li><code className="text-yellow-300">EMAIL_SENDER_ADDRESS</code>: E-postaların gönderileceği sizin Gmail adresiniz.</li>
                        <li><code className="text-yellow-300">EMAIL_APP_PASSWORD</code>: Yukarıdaki Gmail hesabınız için Google Hesap ayarlarınızdan oluşturduğunuz 16 haneli **Uygulama Şifresi**. Normal Gmail şifreniz burada çalışmayacaktır.</li>
                        <li>Değişken adlarında veya değerlerde yazım hatası, başta/sonda fazladan boşluk olmadığından emin olun.</li>
                    </ul>
                  </li>
                   <li className="text-red-400 font-bold bg-red-900/50 p-2 rounded-md">
                    <strong>SUNUCUYU YENİDEN BAŞLATIN (HAYATİ ÖNEMDE!):</strong> `.env.local` dosyasını oluşturduktan veya içeriğini değiştirdikten sonra, değişikliklerin Next.js tarafından algılanması için geliştirme sunucunuzu **KESİNLİKLE durdurup (Terminalde Ctrl+C yapıp) sonra tekrar `npm run dev` (veya `yarn dev`) komutuyla YENİDEN BAŞLATMANIZ ZORUNLUDUR.** Bu adımı atlarsanız, ortam değişkenleri yüklenmez ve "Gönderen bilgileri eksik" hatası alırsınız.
                  </li>
                  <li>
                    <strong>Google Hesap Ayarları (EMAIL_SENDER_ADDRESS için):</strong>
                    <ul className="list-disc list-inside pl-4 text-xs mt-1">
                        <li>Hesabınızda İki Adımlı Doğrulama'nın etkinleştirilmiş olması gerekir.</li>
                        <li>Google Hesap ayarlarınızdan bir "Uygulama Şifresi" oluşturmanız ve `.env.local` dosyasındaki `EMAIL_APP_PASSWORD` kısmına bu 16 haneli şifreyi girmeniz gerekir.</li>
                    </ul>
                  </li>
                   <li><strong>`.env.local` Dosyasını Gizli Tutun:</strong> Bu dosyayı **ASLA** Git gibi versiyon kontrol sistemlerine (GitHub, GitLab vb.) göndermeyin. Genellikle `.gitignore` dosyanızda `*.local` veya `/.env*.local` gibi bir satır bulunur; bu, bu tür dosyaların kazara yüklenmesini engeller.</li>
                </ol>
                <p className="mt-3">Bu ayarlar doğru yapıldığında, uygulama "İçeriği E-posta İle Gönder" butonuyla belirttiğiniz alıcıya e-posta göndermeyi deneyecektir. Hata olması durumunda bildirim alacaksınız ve detaylar için **tarayıcı konsolunu** ve özellikle **sunucu terminalindeki (Next.js'in çalıştığı yer) logları** kontrol edebilirsiniz.</p>
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

