
'use client';

import { useState, useEffect } from 'react';
import type { Post } from '@/types';
import { PostCreator } from '@/components/post-creator';
import { PostHistory } from '@/components/post-history';
import { Separator } from '@/components/ui/separator';
import { Clock } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'cosmosCuratorPosts';

export default function HomePage() {
  const [approvedPosts, setApprovedPosts] = useState<Post[]>([]);
  const [currentTime, setCurrentTime] = useState('');

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

      <PostCreator onPostApproved={handlePostApproved} />
      <PostHistory posts={approvedPosts} />
      {/* Footer RootLayout'a taşındığı için buradan kaldırıldı */}
    </main>
  );
}
