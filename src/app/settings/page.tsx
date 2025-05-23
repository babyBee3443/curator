
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, Settings as SettingsIcon, Info, ClockIcon, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

const EMAIL_RECIPIENT_KEY = 'emailRecipient_cosmosCurator';
const TARGET_HOURS_KEY = 'cosmosCuratorTargetHours';
const DEFAULT_TARGET_HOURS = [9, 12, 15, 18, 21];

export default function SettingsPage() {
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [availableHours] = useState(Array.from({ length: 24 }, (_, i) => i)); // 0-23
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [isSavingHours, setIsSavingHours] = useState(false);

  useEffect(() => {
    const storedRecipientEmail = localStorage.getItem(EMAIL_RECIPIENT_KEY);
    if (storedRecipientEmail) {
      setRecipientEmail(storedRecipientEmail);
    }

    const storedTargetHours = localStorage.getItem(TARGET_HOURS_KEY);
    if (storedTargetHours) {
      try {
        const parsedHours = JSON.parse(storedTargetHours);
        if (Array.isArray(parsedHours) && parsedHours.every(h => typeof h === 'number')) {
          setSelectedHours(parsedHours.sort((a,b) => a-b));
        } else {
          setSelectedHours([...DEFAULT_TARGET_HOURS].sort((a,b) => a-b));
        }
      } catch (e) {
        console.error("Hedef saatler ayrıştırılamadı, varsayılana dönülüyor:", e);
        setSelectedHours([...DEFAULT_TARGET_HOURS].sort((a,b) => a-b));
      }
    } else {
      setSelectedHours([...DEFAULT_TARGET_HOURS].sort((a,b) => a-b));
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

  const handleHourToggle = (hour: number) => {
    setSelectedHours(prev =>
      prev.includes(hour) ? prev.filter(h => h !== hour).sort((a,b)=>a-b) : [...prev, hour].sort((a,b)=>a-b)
    );
  };

  const handleSaveTargetHours = () => {
    if (selectedHours.length === 0) {
        toast({
            title: 'Saat Seçimi Yok',
            description: 'Lütfen en az bir otomatik gönderi saati seçin veya varsayılan saatleri kullanmak için birkaç saat seçin.',
            variant: 'destructive',
        });
        return;
    }
    setIsSavingHours(true);
    localStorage.setItem(TARGET_HOURS_KEY, JSON.stringify(selectedHours));
    setIsSavingHours(false);
    toast({
      title: 'Hedef Saatler Kaydedildi',
      description: `Otomatik gönderi için yeni hedef saatler: ${selectedHours.map(h => `${h.toString().padStart(2, '0')}:00`).join(', ')}`,
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-accent"/> Ayarlar
        </h1>
        <p className="text-muted-foreground">
          Uygulama ayarlarınızı yönetin.
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
              Otomatik oluşturulan gönderi içeriklerinin size e-posta ile gönderilmesi için alıcı e-posta adresini yapılandırın.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <Alert variant="default" className="bg-blue-950/70 border-blue-700 text-blue-100">
              <Info className="h-5 w-5 text-blue-300" />
              <AlertTitle className="text-blue-200 font-bold">E-posta Gönderimi İçin Gerekli Kurulum (ÖNEMLİ)</AlertTitle>
              <AlertDescription className="text-blue-200/90 space-y-3">
                <p>Bu özellik, yapay zeka tarafından oluşturulan gönderi içeriklerinin size e-posta ile gönderilmesini sağlar. E-posta gönderimi, Nodemailer kütüphanesi ve bir Gmail hesabı üzerinden Uygulama Şifresi kullanılarak gerçekleştirilir.</p>
                <p className="font-semibold text-yellow-300">Gerçek E-posta Gönderimi İçin Yapılması Gerekenler:</p>
                <ol className="list-decimal list-inside text-sm pl-4 space-y-2">
                  <li>
                    <strong>Nodemailer Kurulumu:</strong> Projenizin ana dizininde terminali açıp <code className="bg-black/50 px-1 py-0.5 rounded">npm install nodemailer</code> komutunu çalıştırarak Nodemailer kütüphanesini kurun (eğer daha önce kurulmadıysa). `typescript` kullanıyorsanız `@types/nodemailer` paketini de kurun: <code className="bg-black/50 px-1 py-0.5 rounded">npm install --save-dev @types/nodemailer</code>.
                  </li>
                  <li>
                    <strong>`.env` Dosyasını Kontrol Edin/Oluşturun:</strong>
                    <ul className="list-disc list-inside pl-4 mt-1 text-xs">
                      <li>Projenizin **ANA DİZİNİNDE** (`package.json` dosyasıyla aynı yerde) **`.env`** adında bir dosya olduğundan emin olun. Bu dosya, Next.js tarafından ortam değişkenlerini yüklemek için kullanılır. (`.env.local` de kullanılabilir ancak `.env` genel bir standarttır).</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Ortam Değişkenlerini `.env` Dosyasına Ekleyin:</strong> Aşağıdaki satırları **tam olarak bu şekilde** `.env` dosyanızın içine kopyalayıp yapıştırın ve kendi bilgilerinizle değiştirin (başında veya sonunda fazladan boşluk olmamalı, değerler tırnak içinde olmamalı):
                    <pre className="mt-2 p-3 bg-black/50 rounded text-xs whitespace-pre-wrap text-blue-100"><code>EMAIL_USER=getdusbox@gmail.com{'\n'}EMAIL_APP_PASSWORD=csfd eaun yjou bzsz</code></pre>
                    <ul className="list-disc list-inside pl-4 text-xs mt-1">
                        <li><code className="text-yellow-300">EMAIL_USER</code>: E-postaların gönderileceği sizin Gmail adresiniz (örneğin <code className="text-yellow-300">getdusbox@gmail.com</code>).</li>
                        <li><code className="text-yellow-300">EMAIL_APP_PASSWORD</code>: Yukarıdaki Gmail hesabınız için Google Hesap ayarlarınızdan oluşturduğunuz 16 haneli **Uygulama Şifresi**. Normal Gmail şifreniz burada çalışmayacaktır.</li>
                    </ul>
                     <p className="mt-1 text-xs">Not: `.env` dosyanızda <code className="bg-black/50 px-1 py-0.5 rounded">GEMINI_API_KEY</code> gibi başka değişkenler de olabilir. Onları silmeyin, sadece <code className="bg-black/50 px-1 py-0.5 rounded">EMAIL_USER</code> ve <code className="bg-black/50 px-1 py-0.5 rounded">EMAIL_APP_PASSWORD</code> satırlarını ekleyin veya güncelleyin. Dosyanın içinde <code className="text-yellow-300">csfd eaun yjou bzsz</code> şifresi varsa, bunu kendi geçerli Google Uygulama Şifrenizle değiştirmeyi unutmayın.</p>
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
                </ol>
                <p className="mt-3">Bu ayarlar doğru yapıldığında, uygulama "İçeriği E-posta İle Gönder" butonuyla veya otomatik gönderi özelliğiyle belirttiğiniz alıcıya e-posta göndermeyi deneyecektir. Hata olması durumunda bildirim alacaksınız ve detaylar için **tarayıcı konsolunu** ve özellikle **sunucu terminalindeki (Next.js'in çalıştığı yer) logları** kontrol edebilirsiniz.</p>
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

        <Separator className="my-6" />

        <Card className="w-full max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <ClockIcon className="h-6 w-6 text-accent" />
              Otomatik Gönderi Zamanları Ayarları
            </CardTitle>
            <CardDescription>
              Otomatik gönderilerin hangi saatlerde oluşturulup e-posta ile gönderileceğini seçin. Varsayılan saatler: 09, 12, 15, 18, 21.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
              {availableHours.map(hour => (
                <div key={hour} className="flex items-center space-x-2">
                  <Checkbox
                    id={`hour-${hour}`}
                    checked={selectedHours.includes(hour)}
                    onCheckedChange={() => handleHourToggle(hour)}
                  />
                  <Label htmlFor={`hour-${hour}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {hour.toString().padStart(2, '0')}:00
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Seçilen saatler: {selectedHours.length > 0 ? selectedHours.map(h => `${h.toString().padStart(2, '0')}:00`).join(', ') : "Hiçbiri (Varsayılanlar kullanılacak)"}
            </p>
            <Button
              onClick={handleSaveTargetHours}
              disabled={isSavingHours}
              className="w-full"
            >
              {isSavingHours ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Hedef Saatleri Kaydet
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    