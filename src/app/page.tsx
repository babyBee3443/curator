
'use client';

import { useState, useEffect } from 'react';
import type { Post } from '@/types';
import { PostCreator } from '@/components/post-creator';
import { PostHistory } from '@/components/post-history';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Clock } from 'lucide-react'; // Clock ikonu eklendi
import { useToast } from '@/hooks/use-toast';
import { generateFullPostAction } from '@/lib/actions';

const LOCAL_STORAGE_KEY = 'cosmosCuratorPosts';

export default function HomePage() {
  const [approvedPosts, setApprovedPosts] = useState<Post[]>([]);
  const [isGeneratingFivePosts, setIsGeneratingFivePosts] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const storedPosts = localStorage.getItem(LOCAL_STORAGE_KEY);
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
    // Saati ilk yüklemede ve her saniye güncelle
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    }, 1000);

    // Component unmount olduğunda interval'i temizle
    return () => {
      clearInterval(timerId);
    };
  }, []); // Boş dependency array, sadece mount ve unmount'ta çalışır

  const handlePostApproved = (newPost: Post) => {
    const updatedPosts = [...approvedPosts, newPost];
    setApprovedPosts(updatedPosts);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPosts));
  };

  const handleGenerateFivePosts = async () => {
    setIsGeneratingFivePosts(true);
    toast({ title: '✨ Toplu Gönderi Oluşturma Başladı!', description: '5 adet gönderi hazırlanıyor, lütfen bekleyin...' });

    for (let i = 0; i < 5; i++) {
      try {
        const result = await generateFullPostAction();
        const newPost: Post = {
          id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`,
          topic: result.topic,
          keyInformation: result.keyInformation,
          caption: result.caption,
          hashtags: result.hashtags.map(h => h.trim().replace(/^#+/, '')).filter(h => h),
          imageUrl: result.imageUrl,
          imageHint: result.topic.toLowerCase().split(" ").slice(0, 2).join(" ") || "bilim teknoloji",
          simulatedPostTime: new Date(),
          status: 'approved',
        };
        handlePostApproved(newPost);
        toast({ 
          title: `🚀 ${i + 1}. Gönderi Hazır!`, 
          description: `"${result.topic}" konulu gönderi başarıyla oluşturuldu ve geçmişe eklendi.`
        });
      } catch (error) {
        console.error(`${i + 1}. gönderi oluşturulurken hata:`, error);
        toast({ 
          title: `😔 Hata (${i + 1}. Gönderi)`, 
          description: (error as Error).message || 'Bilinmeyen bir hata oluştu.', 
          variant: 'destructive' 
        });
      }
    }
    setIsGeneratingFivePosts(false);
    toast({ title: '✅ Toplu Gönderi Oluşturma Tamamlandı!', description: '5 gönderinin tümü (veya başarılı olanlar) oluşturuldu.' });
  };

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

      <Card className="w-full shadow-md mb-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Toplu Gönderi Oluşturucu
          </CardTitle>
          <CardDescription>
            Tek tıklamayla yapay zekanın sizin için 5 adet tam gönderi (fikir, başlık, görsel, hashtagler) oluşturmasını sağlayın. Oluşturulan gönderiler doğrudan "Gönderi Geçmişi"ne eklenecektir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGenerateFivePosts}
            disabled={isGeneratingFivePosts}
            className="w-full text-md py-6 bg-accent hover:bg-accent/90 text-accent-foreground"
            size="lg"
          >
            {isGeneratingFivePosts ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
            {isGeneratingFivePosts ? '5 Gönderi Oluşturuluyor...' : '✨ 5 Yeni Gönderi Oluştur'}
          </Button>
        </CardContent>
      </Card>

      <PostCreator onPostApproved={handlePostApproved} />
      <PostHistory posts={approvedPosts} />
      <footer className="py-6 md:px-8 md:py-0 border-t mt-auto">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Kozmos Küratörü için Yapay Zeka tarafından oluşturuldu.
          </p>
        </div>
      </footer>
    </main>
  );
}
