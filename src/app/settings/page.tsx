
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, Settings as SettingsIcon, Info, ClockIcon, Save, ListPlus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

const EMAIL_RECIPIENT_KEY = 'emailRecipient_cosmosCurator';
const TARGET_TIMES_KEY = 'cosmosCuratorTargetTimes'; // Updated key
interface TargetTime {
  hour: number;
  minute: number;
}
const DEFAULT_TARGET_TIMES: TargetTime[] = [ // Updated default
  { hour: 9, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 15, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 21, minute: 0 },
].sort((a, b) => a.hour - b.hour || a.minute - b.minute);

export default function SettingsPage() {
  const { toast } = useToast();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedTimes, setSelectedTimes] = useState<TargetTime[]>([]);
  const [newHour, setNewHour] = useState(9);
  const [newMinute, setNewMinute] = useState(0);
  const [isSavingTimes, setIsSavingTimes] = useState(false);

  useEffect(() => {
    const storedRecipientEmail = localStorage.getItem(EMAIL_RECIPIENT_KEY);
    if (storedRecipientEmail) {
      setRecipientEmail(storedRecipientEmail);
    }

    const storedTargetTimes = localStorage.getItem(TARGET_TIMES_KEY);
    if (storedTargetTimes) {
      try {
        const parsedTimes = JSON.parse(storedTargetTimes);
        if (Array.isArray(parsedTimes) && parsedTimes.every(t => typeof t.hour === 'number' && typeof t.minute === 'number')) {
          setSelectedTimes(parsedTimes.sort((a, b) => a.hour - b.hour || a.minute - b.minute));
        } else {
          setSelectedTimes([...DEFAULT_TARGET_TIMES]);
        }
      } catch (e) {
        console.error("Hedef zamanlar ayrıştırılamadı, varsayılana dönülüyor:", e);
        setSelectedTimes([...DEFAULT_TARGET_TIMES]);
      }
    } else {
      setSelectedTimes([...DEFAULT_TARGET_TIMES]);
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

  const handleAddTime = () => {
    const newTime = { hour: newHour, minute: newMinute };
    // Check for duplicates
    if (selectedTimes.some(time => time.hour === newTime.hour && time.minute === newTime.minute)) {
      toast({
        title: 'Zaten Mevcut',
        description: `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')} zaten listede.`,
        variant: 'default'
      });
      return;
    }
    setSelectedTimes(prev => [...prev, newTime].sort((a, b) => a.hour - b.hour || a.minute - b.minute));
  };

  const handleRemoveTime = (indexToRemove: number) => {
    setSelectedTimes(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveTargetTimes = () => {
    if (selectedTimes.length === 0) {
        toast({
            title: 'Zaman Seçimi Yok',
            description: 'Lütfen en az bir otomatik gönderi zamanı seçin.',
            variant: 'destructive',
        });
        return;
    }
    setIsSavingTimes(true);
    localStorage.setItem(TARGET_TIMES_KEY, JSON.stringify(selectedTimes));
    setIsSavingTimes(false);
    toast({
      title: 'Hedef Zamanlar Kaydedildi',
      description: `Otomatik gönderi için yeni hedef zamanlar: ${selectedTimes.map(t => `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`).join(', ')}`,
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
                 <p>E-posta gönderimi için projenizin ana dizininde (`package.json` dosyasıyla aynı yerde) **`.env.local`** adında bir dosya oluşturun (veya varsa düzenleyin). İçine aşağıdaki satırları **tam olarak bu şekilde** ekleyin ve kendi bilgilerinizle doldurun (başında veya sonunda fazladan boşluk olmamalı, değerler tırnak içinde olmamalı):</p>
                <pre className="mt-2 p-3 bg-black/50 rounded text-xs whitespace-pre-wrap text-blue-100"><code>EMAIL_SENDER_ADDRESS=getdusbox@gmail.com{'\n'}EMAIL_APP_PASSWORD=qdti jdwa wxpd tkwl</code></pre>
                <ul className="list-disc list-inside pl-4 text-xs mt-1">
                  <li><code className="text-yellow-300">EMAIL_SENDER_ADDRESS</code>: E-postaların gönderileceği sizin Gmail adresiniz.</li>
                  <li><code className="text-yellow-300">EMAIL_APP_PASSWORD</code>: Yukarıdaki Gmail hesabınız için Google Hesap ayarlarınızdan oluşturduğunuz 16 haneli **Uygulama Şifresi**. Normal Gmail şifreniz burada çalışmayacaktır.</li>
                </ul>
                <p className="mt-1 text-xs">Not: `.env.local` dosyanızda başka değişkenler de olabilir. Onları silmeyin, sadece bu iki satırı ekleyin veya güncelleyin.</p>
                <p className="font-semibold text-yellow-300">Google Hesap Ayarları (EMAIL_SENDER_ADDRESS için):</p>
                <ul className="list-disc list-inside pl-4 text-xs">
                  <li>Hesabınızda İki Adımlı Doğrulama'nın etkinleştirilmiş olması gerekir.</li>
                  <li>Google Hesap ayarlarınızdan bir "Uygulama Şifresi" oluşturmanız ve `.env.local` dosyasındaki `EMAIL_APP_PASSWORD` kısmına bu 16 haneli şifreyi girmeniz gerekir.</li>
                </ul>
                <p className="text-red-400 font-bold bg-red-900/50 p-2 rounded-md">
                  <strong>SUNUCUYU YENİDEN BAŞLATIN (HAYATİ ÖNEMDE!):</strong> `.env.local` dosyasını oluşturduktan veya içeriğini değiştirdikten sonra, değişikliklerin Next.js tarafından algılanması için geliştirme sunucunuzu **KESİNLİKLE durdurup (Terminalde Ctrl+C yapıp) sonra tekrar `npm run dev` (veya `yarn dev`) komutuyla YENİDEN BAŞLATMANIZ ZORUNLUDUR.**
                </p>
                <p className="mt-2">Eğer hala "Gönderen bilgileri eksik" hatası alıyorsanız, lütfen terminaldeki (Next.js'in çalıştığı yer) şu logları kontrol edin:
                  <br /><code>[sendPostByEmail] Ortam Değişkenleri Kontrolü (Fonksiyon İçi):</code>
                  <br /><code>[sendPostByEmail] &gt; senderEmail (process.env.EMAIL_SENDER_ADDRESS) DEĞERİ: "..."</code>
                  <br /><code>[sendPostByEmail] &gt; senderAppPassword (process.env.EMAIL_APP_PASSWORD) DEĞERİ: "..."</code>
                </p>
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
              Otomatik gönderilerin hangi saat ve dakikalarda oluşturulup e-posta ile gönderileceğini seçin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium text-foreground">Yeni Hedef Zaman Ekle:</Label>
              <div className="flex items-center gap-2">
                <Select onValueChange={(val) => setNewHour(parseInt(val))} value={String(newHour)}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Saat" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <SelectItem key={`h-${i}`} value={String(i)}>{String(i).padStart(2, '0')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="font-semibold">:</span>
                <Select onValueChange={(val) => setNewMinute(parseInt(val))} value={String(newMinute)}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Dakika" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 60 }).map((_, i) => (
                      <SelectItem key={`m-${i}`} value={String(i)}>{String(i).padStart(2, '0')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddTime} variant="outline" size="icon">
                  <ListPlus className="h-5 w-5" />
                  <span className="sr-only">Zaman Ekle</span>
                </Button>
              </div>
            </div>

            {selectedTimes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base font-medium text-foreground">Kaydedilmiş Hedef Zamanlar:</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30">
                  {selectedTimes.map((time, index) => (
                    <Badge key={index} variant="secondary" className="text-sm tabular-nums">
                      {String(time.hour).padStart(2, '0')}:{String(time.minute).padStart(2, '0')}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 h-5 w-5 hover:bg-destructive/20 hover:text-destructive"
                        onClick={() => handleRemoveTime(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">Kaldır</span>
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
             {selectedTimes.length === 0 && (
                <p className="text-sm text-muted-foreground">Henüz kaydedilmiş hedef zaman yok. Otomatik gönderim için en az bir zaman ekleyin.</p>
             )}


            <Button
              onClick={handleSaveTargetTimes}
              disabled={isSavingTimes || selectedTimes.length === 0}
              className="w-full"
            >
              {isSavingTimes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Hedef Zamanları Kaydet
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    