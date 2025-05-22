
import type { Post } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { PostPreviewCard } from './post-preview-card';
import { History, ListChecks, Trash2 } from 'lucide-react';

interface PostHistoryProps {
  posts: Post[];
  onClearAllHistory: () => void;
  onDeleteSinglePost: (postId: string) => void;
}

export function PostHistory({ posts, onClearAllHistory, onDeleteSinglePost }: PostHistoryProps) {
  return (
    <Card className="w-full shadow-lg mt-12 flex flex-col max-h-[80vh]"> {/* Dikeyde esnek ve maksimum yükseklik */}
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0"> {/* Header küçülmesin */}
        <div>
          <CardTitle className="text-2xl flex items-center gap-2">
            <History className="h-7 w-7 text-primary" />
            Gönderi Geçmişi
          </CardTitle>
          <CardDescription>
            Onaylanmış ve simüle edilmiş (en fazla 2) gönderinizin bir günlüğü.
          </CardDescription>
        </div>
        {posts.length > 0 && (
          <Button variant="destructive" onClick={onClearAllHistory} size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Tüm Geçmişi Temizle
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0"> {/* Kalan alanı doldur, ScrollArea için temel */}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground px-6 h-full">
            <ListChecks className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">Geçmişte henüz gönderi yok.</p>
            <p>Onaylanmış gönderiler burada görünecektir.</p>
          </div>
        ) : (
          <ScrollArea className="h-full w-full"> {/* Ebeveyninin (CardContent) tamamını kapla */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4"> {/* Kartları yan yana sırala */}
              {posts.slice().reverse().map((post) => (
                <PostPreviewCard
                  key={post.id}
                  post={post}
                  title="Onaylanmış Gönderi"
                  showShareButton={true}
                  showDeleteButton={true}
                  onDeleteSinglePost={onDeleteSinglePost}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
