import type { Post } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PostPreviewCard } from './post-preview-card';
import { History, ListChecks } from 'lucide-react';

interface PostHistoryProps {
  posts: Post[];
}

export function PostHistory({ posts }: PostHistoryProps) {
  return (
    <Card className="w-full shadow-lg mt-12">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <History className="h-7 w-7 text-primary" />
          Post History
        </CardTitle>
        <CardDescription>
          A log of all your approved and simulated posts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <ListChecks className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">No posts in history yet.</p>
            <p>Approved posts will appear here.</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] w-full">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 p-1">
              {posts.slice().reverse().map((post) => ( // Show newest first
                <PostPreviewCard key={post.id} post={post} title="Approved Post" />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
