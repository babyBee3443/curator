
'use client';

import { useState, useEffect } from 'react';
import type { Post } from '@/types';
import { PostCreator } from '@/components/post-creator';
import { PostHistory } from '@/components/post-history';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateFullPostAction } from '@/lib/actions';

const LOCAL_STORAGE_KEY = 'cosmosCuratorPosts';

export default function HomePage() {
  const [approvedPosts, setApprovedPosts] = useState<Post[]>([]);
  const [isGeneratingFivePosts, setIsGeneratingFivePosts] = useState(false);
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
        // Bir hata olursa devam etmeyebilir veya isteğe bağlı olarak devam edebilir. Şimdilik devam ediyor.
      }
    }
    setIsGeneratingFivePosts(false);
    toast({ title: '✅ Toplu Gönderi Oluşturma Tamamlandı!', description: '5 gönderinin tümü (veya başarılı olanlar) oluşturuldu.' });
  };

  return (
    <main className="flex flex-col gap-4 p-4 md:gap-8 md:p-8 container mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          İçerik Paneli
        </h1>
        <p className="text-muted-foreground">
          Yapay zeka destekli Instagram içerik oluşturma sürecinizi yönetin.
        </p>
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
    </main>
  );
}
