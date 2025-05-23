
'use client';

import { useState, useEffect } from 'react';
import type { Post } from '@/types';
import { PostCreator } from '@/components/post-creator';
import { PostHistory } from '@/components/post-history';
import { Separator } from '@/components/ui/separator';
import { Clock, AlertTriangle, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { triggerAutoPostAndEmail } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { differenceInMinutes, differenceInHours, format, addHours, setHours, setMinutes, setSeconds, isPast, getHours, getMinutes } from 'date-fns';

const LOCAL_STORAGE_POSTS_KEY = 'cosmosCuratorPosts';
const LOCAL_STORAGE_EMAIL_RECIPIENT_KEY = 'emailRecipient_cosmosCurator';
const LOCAL_STORAGE_TARGET_HOURS_KEY = 'cosmosCuratorTargetHours';
const SESSION_STORAGE_AUTO_SENT_PREFIX = 'cosmosCuratorAutoSent_';
const MAX_HISTORY_POSTS = 2;
const DEFAULT_TARGET_HOURS = [9, 12, 15, 18, 21];


export default function HomePage() {
  const [approvedPosts, setApprovedPosts] = useState<Post[]>([]);
  const [currentTime, setCurrentTime] = useState('');
  const [nextPostTimeInfo, setNextPostTimeInfo] = useState<{ time: string; remaining: string } | null>(null);
  const [dynamicTargetHours, setDynamicTargetHours] = useState<number[]>([...DEFAULT_TARGET_HOURS].sort((a,b)=>a-b));
  const { toast } = useToast();

  useEffect(() => {
    const storedPosts = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
    if (storedPosts) {
      try {
        const parsedPosts = JSON.parse(storedPosts).map((post: any) => ({
          ...post,
          simulatedPostTime: new Date(post.simulatedPostTime)
        }));
        setApprovedPosts(parsedPosts);
      } catch (error) {
        console.error("Gönderiler yerel depolamadan ayrıştırılamadı:", error);
        setApprovedPosts([]);
      }
    }

    const storedTargetHours = localStorage.getItem(LOCAL_STORAGE_TARGET_HOURS_KEY);
    if (storedTargetHours) {
        try {
            const parsedHours = JSON.parse(storedTargetHours);
            if (Array.isArray(parsedHours) && parsedHours.length > 0 && parsedHours.every(h => typeof h === 'number')) {
                setDynamicTargetHours(parsedHours.sort((a,b) => a-b));
            } else {
                 setDynamicTargetHours([...DEFAULT_TARGET_HOURS].sort((a,b)=>a-b));
            }
        } catch (e) {
            console.error("Kaydedilmiş hedef saatler ayrıştırılamadı, varsayılana dönülüyor:", e);
            setDynamicTargetHours([...DEFAULT_TARGET_HOURS].sort((a,b)=>a-b));
        }
    } else {
        setDynamicTargetHours([...DEFAULT_TARGET_HOURS].sort((a,b)=>a-b));
    }

  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      const now = new Date();
      setCurrentTime(format(now, 'HH:mm:ss'));
      updateNextPostTimeInfo(now);
    }, 1000);

    updateNextPostTimeInfo(new Date()); // Initial call

    return () => clearInterval(timerId);
  }, [dynamicTargetHours]); // Re-run if target hours change

  const updateNextPostTimeInfo = (now: Date) => {
    if (dynamicTargetHours.length === 0) {
        setNextPostTimeInfo(null);
        return;
    }
    let nextTargetDateTime: Date | null = null;
    const currentHour = getHours(now);
    const currentMinute = getMinutes(now);

    // Find the next target time for today
    for (const hour of dynamicTargetHours) {
      if (hour > currentHour || (hour === currentHour && 0 > currentMinute)) {
        nextTargetDateTime = setSeconds(setMinutes(setHours(now, hour), 0), 0);
        break;
      }
    }

    // If all today's target times have passed, find the first target time for tomorrow
    if (!nextTargetDateTime) {
      const firstHourOfNextDay = dynamicTargetHours[0];
      nextTargetDateTime = addHours(setSeconds(setMinutes(setHours(now, firstHourOfNextDay), 0), 0), 24);
    }
    
    if (nextTargetDateTime) {
      const hoursRemaining = differenceInHours(nextTargetDateTime, now);
      const minutesRemaining = differenceInMinutes(nextTargetDateTime, now) % 60;
      setNextPostTimeInfo({
        time: format(nextTargetDateTime, 'HH:mm'),
        remaining: `${hoursRemaining} saat ${minutesRemaining} dakika sonra`
      });
    } else {
      setNextPostTimeInfo(null); // Should not happen if dynamicTargetHours is not empty
    }
  };

  const handlePostApproved = (newPost: Post) => {
    setApprovedPosts(prevPosts => {
      const updatedPosts = [...prevPosts, newPost];
      if (updatedPosts.length > MAX_HISTORY_POSTS) {
        updatedPosts.shift(); 
      }
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updatedPosts));
      return updatedPosts;
    });
  };

  const handleClearAllHistory = () => {
    setApprovedPosts([]);
    localStorage.removeItem(LOCAL_STORAGE_POSTS_KEY);
    toast({
      title: 'Geçmiş Temizlendi',
      description: 'Tüm onaylanmış gönderiler geçmişten silindi.',
    });
  };

  const handleDeleteSinglePost = (postId: string) => {
    setApprovedPosts(prevPosts => {
      const updatedPosts = prevPosts.filter(post => post.id !== postId);
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updatedPosts));
      return updatedPosts;
    });
    toast({
      title: 'Gönderi Silindi',
      description: 'Seçili gönderi geçmişten silindi.',
      variant: 'destructive'
    });
  };

  useEffect(() => {
    const getSlotKey = (hour: number) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      return `${SESSION_STORAGE_AUTO_SENT_PREFIX}${today}_${hour}`;
    };

    const checkAndTriggerAutoPost = async () => {
      if (dynamicTargetHours.length === 0) {
        return; // No target hours set
      }
      const now = new Date();
      const currentHour = getHours(now);
      const currentMinute = getMinutes(now);

      // Check if it's time to post for any of the dynamic target hours
      for (const targetHour of dynamicTargetHours) {
        if (currentHour === targetHour && currentMinute === 0) { 
          const slotKey = getSlotKey(targetHour);
          if (!sessionStorage.getItem(slotKey)) {
            console.log(`Otomatik gönderi tetikleniyor: ${targetHour}:00`);
            sessionStorage.setItem(slotKey, 'true'); 

            const recipientEmail = localStorage.getItem(LOCAL_STORAGE_EMAIL_RECIPIENT_KEY);
            if (!recipientEmail) {
              toast({
                title: 'Otomatik Gönderi Hatası',
                description: 'Alıcı e-posta adresi Ayarlar sayfasında tanımlanmamış. Otomatik gönderim yapılamadı.',
                variant: 'destructive',
                duration: 10000,
              });
              return; 
            }

            toast({
              title: `Otomatik Gönderi Başlatıldı (${targetHour}:00)`,
              description: 'Yapay zeka içerik üretiyor ve e-posta ile gönderecek...',
              duration: 7000,
            });

            try {
              await triggerAutoPostAndEmail(recipientEmail);
              toast({
                title: `Otomatik Gönderi Başarılı (${targetHour}:00)`,
                description: 'İçerik oluşturuldu ve e-posta ile gönderildi.',
                className: 'bg-green-600 text-white border-green-700',
                duration: 10000,
              });
            } catch (error) {
              toast({
                title: `Otomatik Gönderi Hatası (${targetHour}:00)`,
                description: (error as Error).message,
                variant: 'destructive',
                duration: 10000,
              });
            }
            break; 
          }
        }
      }
    };

    const intervalId = setInterval(checkAndTriggerAutoPost, 60000); // Check every minute
    checkAndTriggerAutoPost(); // Initial check

    return () => clearInterval(intervalId);
  }, [toast, dynamicTargetHours]); // Re-run if target hours change


  const getTargetHoursString = () => {
    if (dynamicTargetHours.length === 0) return "Hiçbir saat seçilmemiş. Otomatik gönderim devre dışı.";
    return dynamicTargetHours.map(h => `${h.toString().padStart(2, '0')}:00`).join(', ');
  };


  return (
    <main className="flex flex-col gap-4 p-4 md:gap-8 md:p-8 container mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            İçerik Paneli
          </h1>
          <p className="text-muted-foreground">
            Yapay zeka destekli Instagram içerik oluşturma sürecinizi yönetin.
          </p>
          {nextPostTimeInfo && dynamicTargetHours.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-md bg-card border border-border shadow-sm">
              <Timer className="h-4 w-4 text-accent" />
              <span>Sonraki otomatik gönderi: <strong>{nextPostTimeInfo.time}</strong> ({nextPostTimeInfo.remaining})</span>
            </div>
          )}
           {dynamicTargetHours.length === 0 && (
             <div className="mt-2 flex items-center gap-2 text-sm text-orange-400 p-2 rounded-md bg-orange-950 border border-orange-700 shadow-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Otomatik gönderi için Ayarlar'dan saat seçimi yapılmamış. Otomatik gönderim devre dışı.</span>
            </div>
           )}
        </div>
        {currentTime && (
          <div className="flex items-center gap-2 p-2 border rounded-md bg-card text-card-foreground shadow-sm">
            <Clock className="h-5 w-5 text-accent" />
            <span className="text-lg font-medium">{currentTime}</span>
          </div>
        )}
      </div>
      <Separator className="my-4" />

      <Alert variant="default" className="mb-6 bg-blue-950/70 border-blue-700 text-blue-100">
        <AlertTriangle className="h-5 w-5 text-blue-300" />
        <AlertTitle className="text-blue-200 font-bold">Otomatik Gönderi Oluşturma ve E-posta Bildirimi Aktif!</AlertTitle>
        <AlertDescription className="text-blue-200/90 space-y-1">
          <p>Bu sayfa tarayıcıda açık olduğu sürece, sistem belirlenen saatlerde ({getTargetHoursString()}) otomatik olarak bir gönderi içeriği oluşturup, Ayarlar sayfasında belirttiğiniz e-posta adresine gönderecektir.</p>
          <p className="font-semibold">Önemli: Bu özellik, tarayıcınızın bu sekmeyi açık ve aktif tutmasına bağlıdır. Tarayıcıyı veya bu sekmeyi kapatırsanız otomatik gönderim durur.</p>
          <p>Lütfen alıcı e-posta adresinizin Ayarlar sayfasından doğru bir şekilde kaydedildiğinden emin olun. Otomatik gönderi zamanlarını da Ayarlar sayfasından özelleştirebilirsiniz.</p>
        </AlertDescription>
      </Alert>

      <PostCreator onPostApproved={handlePostApproved} />
      <PostHistory 
        posts={approvedPosts} 
        onClearAllHistory={handleClearAllHistory}
        onDeleteSinglePost={handleDeleteSinglePost}
      />
    </main>
  );
}

    