'use client';

import { useState, useEffect } from 'react';
import type { Post } from '@/types';
import { AppHeader } from '@/components/layout/header';
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
        console.error("Failed to parse posts from local storage:", error);
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
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 container mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Content Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your AI-powered Instagram content creation process.
          </p>
        </div>
        <Separator className="my-4" />
        <PostCreator onPostApproved={handlePostApproved} />
        <PostHistory posts={approvedPosts} />
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t mt-auto">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by AI for Cosmos Curator.
          </p>
        </div>
      </footer>
    </div>
  );
}
