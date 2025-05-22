
'use client';

import { useState, useEffect } from 'react';
import type { Post } from '@/types';
import { PostCreator } from '@/components/post-creator';
import { PostHistory } from '@/components/post-history';
import { Separator } from '@/components/ui/separator';
import { Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { triggerAutoPostAndEmail } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const LOCAL_STORAGE_POSTS_KEY = 'cosmosCuratorPosts';
const LOCAL_STORAGE_EMAIL_RECIPIENT_KEY = 'emailRecipient_cosmosCurator';
const SESSION_STORAGE_AUTO_SENT_PREFIX = 'cosmosCuratorAutoSent_';
const MAX_HISTORY_POSTS = 2;

export default function HomePage() {
  const [approvedPosts, setApprovedPosts] = useState<Post[]>([]);
  const [currentTime, setCurrentTime] = useState('');
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
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const handlePostApproved = (newPost: Post) => {
    setApprovedPosts(prevPosts => {
      const updatedPosts = [...prevPosts, newPost];
      if (updatedPosts.length > MAX_HISTORY_POSTS) {
        updatedPosts.shift(); // En eski gönderiyi kaldır
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
    const TARGET_HOURS = [9, 12, 15, 18, 21];

    const getSlotKey = (hour: number) => {
      const today = new Date().toISOString().split('T')[0];
      return `${SESSION_STORAGE_AUTO_SENT_PREFIX}${today}_${hour}`;
    };

    const checkAndTriggerAutoPost = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      if (currentHour < 9 || currentHour >= 23) {
        return;
      }

      for (const targetHour of TARGET_HOURS) {
        if (currentHour === targetHour && currentMinute === 0) {
          const slotKey = getSlotKey(targetHour);
          if (!sessionStorage.getItem(slotKey)) {
            console.log(`Otomatik gönderi tetikleniyor: ${targetHour}:00`);
            sessionStorage.setItem(slotKey, 'true');

            const recipientEmail = localStorage.getItem(LOCAL_STORAGE_EMAIL_RECIPIENT_KEY);
            if (!recipientEmail) {
              toast({
                title: 'Otomatik Gönderi Hatası (Simülasyon)',
                description: 'Alıcı e-posta adresi Ayarlar sayfasında tanımlanmamış. Otomatik gönderim yapılamadı.',
                variant: 'destructive',
                duration: 10000,
              });
              return;
            }

            toast({
              title: `Otomatik Gönderi Başlatıldı (${targetHour}:00)`,
              description: 'Yapay zeka içerik üretiyor ve e-posta ile gönderecek... (Bu bir simülasyondur ve sayfa açıkken çalışır)',
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

    const intervalId = setInterval(checkAndTriggerAutoPost, 60000);
    checkAndTriggerAutoPost();
    return () => clearInterval(intervalId);
  }, [toast]);


  return (
    <main className="flex flex-col gap-4 p-4 md:gap-8 md:p-8 container mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            İçerik Paneli
          </h1>
          <p className="text-muted-foreground">
            Yapay zeka destekli Instagram içerik oluşturma sürecinizi yönetin.
          </p>
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
        <AlertTitle className="text-blue-200 font-bold">Simüle Edilmiş Otomatik Gönderi Oluşturma Aktif!</AlertTitle>
        <AlertDescription className="text-blue-200/90 space-y-1">
          <p>Bu sayfa tarayıcıda açık olduğu sürece, sistem 09:00, 12:00, 15:00, 18:00 ve 21:00 saatlerinde otomatik olarak bir gönderi içeriği oluşturup Ayarlar&apos;da belirttiğiniz e-posta adresine göndermeyi deneyecektir.</p>
          <p className="font-semibold">Bu, gerçek bir sunucu tabanlı zamanlayıcı değildir. Tarayıcıyı veya bu sekmeyi kapatırsanız otomatik gönderim durur.</p>
          <p>Alıcı e-posta adresinizi Ayarlar sayfasından kaydettiğinizden emin olun.</p>
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
