'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Hash, Image as ImageIcon } from 'lucide-react';
import type { Post } from '@/types';

interface PostPreviewCardProps {
  post: Partial<Post>;
  title?: string;
}

export function PostPreviewCard({ post, title = "Gönderi Önizlemesi" }: PostPreviewCardProps) {
  const { imageUrl, imageHint, caption, hashtags, simulatedPostTime } = post;
  const [clientFormattedTime, setClientFormattedTime] = useState<string | null>(null);

  useEffect(() => {
    if (simulatedPostTime instanceof Date && !isNaN(simulatedPostTime.getTime())) {
      // Attempt to use Turkish locale, fallback to default if not critical path
      try {
        setClientFormattedTime(new Date(simulatedPostTime).toLocaleString('tr-TR'));
      } catch (e) {
        setClientFormattedTime(new Date(simulatedPostTime).toLocaleString());
      }
    } else {
      setClientFormattedTime(null); // Reset if not a valid date
    }
  }, [simulatedPostTime]);

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ImageIcon className="h-6 w-6 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {imageUrl && (
          <div className="aspect-square w-full overflow-hidden rounded-md border bg-muted">
            <Image
              src={imageUrl}
              alt={caption || 'Instagram gönderi resmi'}
              width={1080}
              height={1080}
              className="object-cover w-full h-full"
              data-ai-hint={imageHint || "teknoloji uzay"}
            />
          </div>
        )}
        {caption && (
          <div>
            <h4 className="font-semibold mb-1 text-foreground">Başlık:</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{caption}</p>
          </div>
        )}
        {hashtags && hashtags.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-foreground flex items-center gap-1">
              <Hash className="h-4 w-4" /> Hashtag'ler:
            </h4>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-primary/20 border-primary/30 text-primary-foreground">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      {simulatedPostTime instanceof Date && !isNaN(simulatedPostTime.getTime()) && (
        <CardFooter className="text-xs text-muted-foreground flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          Planlanan Tarih: {clientFormattedTime ? clientFormattedTime : 'Zaman yükleniyor...'}
        </CardFooter>
      )}
    </Card>
  );
}
