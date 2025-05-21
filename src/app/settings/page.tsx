
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
    } else {
      // Varsayılan bir e-posta ayarlayabilirsiniz veya boş bırakabilirsiniz.
      // Örneğin: setRecipientEmail('ornek@mail.com');
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
      <div className="container mx-auto py-8 px-4 md:px-6 flex justify-center items-center">
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

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1"> {/* Tek sütunlu layout */}
        <Card className="w-full max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Mail className="h-6 w-6 text-blue-500" />
              E-posta Gönderim Ayarları
            </CardTitle>
            <CardDescription>
              Oluşturulan gönderi içeriklerinin e-posta ile gönderilmesi için alıcı e-posta adresini ve gönderen hesap bilgilerini yapılandırın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="default" className="bg-blue-900/80 border-blue-700 text-white">
              <Info className="h-5 w-5 text-blue-300" />
              <AlertTitle className="text-blue-200 font-bold">E-posta Gönderimi İçin Gerekli Kurulum</AlertTitle>
              <AlertDescription className="text-blue-300/90 space-y-2">
                <p>Bu özellik, yapay zeka tarafından oluşturulan gönderi içeriklerinin size e-posta ile gönderilmesini sağlar. E-posta gönderimi, Nodemailer kütüphanesi ve bir Gmail hesabı üzerinden Uygulama Şifresi kullanılarak gerçekleştirilir.</p>
                <p className="font-semibold">Gerçek E-posta Gönderimi İçin Yapılması Gerekenler:</p>
                <ol className="list-decimal list-inside text-xs pl-4 space-y-1.5">
                  <li>
                    <strong>Nodemailer Kurulumu:</strong> Bu özellik için `nodemailer` kütüphanesi projenize eklenmiştir. Eğer `node_modules` klasörünüzde bir sorun olduğunu düşünüyorsanız, projenizin ana dizininde `npm install` (veya `yarn install`) komutunu tekrar çalıştırın.
                  </li>
                  <li>
                    <strong>`.env.local` Dosyası Oluşturun (veya Kontrol Edin):</strong> Projenizin **ana dizininde** (yani `package.json` dosyasının bulunduğu yerde) `.env.local` adında bir dosya oluşturun. Eğer zaten varsa, içeriğini kontrol edin.
                  </li>
                  <li>
                    <strong>Ortam Değişkenlerini Ekleyin:</strong> `.env.local` dosyasının içine aşağıdaki satırları **tam olarak bu şekilde** ekleyin ve kendi bilgilerinizle değiştirin:
                    <pre className="mt-2 p-2 bg-black/30 rounded text-xs whitespace-pre-wrap text-blue-200"><code>EMAIL_SENDER_ADDRESS=getdusbox@gmail.com{'\n'}EMAIL_APP_PASSWORD=qdti jdwa wxpd tkwl</code></pre>
                    <ul className="list-disc list-inside pl-4 text-xs mt-1">
                        <li>`EMAIL_SENDER_ADDRESS`: E-postaların gönderileceği sizin Gmail adresiniz.</li>
                        <li>`EMAIL_APP_PASSWORD`: Yukarıdaki Gmail hesabınız için Google Hesap ayarlarınızdan oluşturduğunuz 16 haneli **Uygulama Şifresi**. Normal Gmail şifreniz burada çalışmayacaktır.</li>
                    </ul>
                  </li>
                   <li><strong>ÖNEMLİ:</strong> `.env.local` dosyasını **ASLA** Git gibi versiyon kontrol sistemlerine (GitHub, GitLab vb.) göndermeyin. Genellikle `.gitignore` dosyanızda `*.local` veya `/.env*.local` gibi bir satır bulunur, bu da bu tür dosyaların kazara yüklenmesini engeller.</li>
                  <li>
                    <strong>Google Hesap Ayarları (EMAIL_SENDER_ADDRESS için):</strong>
                    <ul className="list-disc list-inside pl-4 text-xs">
                        <li>İki Adımlı Doğrulama'nın etkinleştirilmiş olması gerekir.</li>
                        <li>Google Hesap ayarlarınızdan bir "Uygulama Şifresi" oluşturmanız ve `.env.local` dosyasındaki `EMAIL_APP_PASSWORD` kısmına bu 16 haneli şifreyi girmeniz gerekir.</li>
                    </ul>
                  </li>
                  <li className="font-bold text-yellow-300 bg-yellow-900/50 p-2 rounded-md">
                    <strong>SUNUCUYU YENİDEN BAŞLATIN (ÇOK ÖNEMLİ):</strong> `.env.local` dosyasını oluşturduktan veya değiştirdikten sonra, değişikliklerin Next.js tarafından algılanması için geliştirme sunucunuzu **durdurup yeniden başlatmanız ZORUNLUDUR**. (Örn: Terminalde Ctrl+C yapıp sonra tekrar `npm run dev` veya `yarn dev`).
                  </li>
                </ol>
                <p className="mt-2">Bu ayarlar doğru yapıldığında, uygulama "İçeriği E-posta İle Gönder" butonuyla belirttiğiniz alıcıya e-posta göndermeyi deneyecektir. Hata olması durumunda bildirim alacaksınız ve detaylar için tarayıcı konsolunu ve sunucu terminalindeki logları kontrol edebilirsiniz.</p>
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
