
'use client';

import { useState, useEffect } from 'react';
import type { Post } from '@/types';
// AppHeader import removed
import { PostCreator } from '@/components/post-creator';
import { PostHistory } from '@/components/post-history';
import { Separator } from '@/components/ui/separator';

const LOCAL_STORAGE_KEY = 'cosmosCuratorPosts';

export default function HomePage() {
  const [approvedPosts, setApprovedPosts] = useState<Post[]>([]);

  useEffect(() => {
    // Load posts from local storage on initial render
    const storedPosts = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedPosts) {
      try {
        const parsedPosts = JSON.parse(storedPosts).map((post: any) => ({
          ...post,
          simulatedPostTime: new Date(post.simulatedPostTime) // Ensure Date object
        }));
        setApprovedPosts(parsedPosts);
      } catch (error) {
        console.error("Gönderiler yerel depolamadan ayrıştırılamadı:", error); // Typo fixed
        setApprovedPosts([]);
      }
    }
  }, []);

  const handlePostApproved = (newPost: Post) => {
    const updatedPosts = [...approvedPosts, newPost];
    setApprovedPosts(updatedPosts);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPosts));
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
      <PostCreator onPostApproved={handlePostApproved} />
      <PostHistory posts={approvedPosts} />
    </main>
  );
}
