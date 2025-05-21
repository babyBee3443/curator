
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Hash, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { Post } from '@/types';

interface PostPreviewCardProps {
  post: Partial<Post>;
  title?: string;
  isLoadingImage?: boolean;
}

export function PostPreviewCard({ post, title = "Gönderi Önizlemesi", isLoadingImage = false }: PostPreviewCardProps) {
  const { imageUrl, imageHint, caption, hashtags, simulatedPostTime } = post;
  const [clientFormattedTime, setClientFormattedTime] = useState<string | null>(null);

  useEffect(() => {
    if (simulatedPostTime instanceof Date && !isNaN(simulatedPostTime.getTime())) {
      try {
        setClientFormattedTime(new Date(simulatedPostTime).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'medium'}));
      } catch (e) {
        setClientFormattedTime(new Date(simulatedPostTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium'}));
      }
    } else if (typeof simulatedPostTime === 'string') { // Handle case where date might be a string initially
        const dateObj = new Date(simulatedPostTime);
        if (!isNaN(dateObj.getTime())) {
             try {
                setClientFormattedTime(dateObj.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'medium'}));
            } catch (e) {
                setClientFormattedTime(dateObj.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium'}));
            }
        } else {
            setClientFormattedTime('Geçersiz tarih');
        }
    }
     else {
      setClientFormattedTime(null); 
    }
  }, [simulatedPostTime]);

  const displayImageUrl = isLoadingImage ? "https://placehold.co/1080x1080.png?text=Resim+Yükleniyor..." : imageUrl;


  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ImageIcon className="h-6 w-6 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingImage && (
          <div className="aspect-square w-full overflow-hidden rounded-md border bg-muted flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}
        {!isLoadingImage && displayImageUrl && (
          <div className="aspect-square w-full overflow-hidden rounded-md border bg-muted">
            <Image
              src={displayImageUrl}
              alt={caption || 'Instagram gönderi resmi'}
              width={1080}
              height={1080}
              className="object-cover w-full h-full"
              data-ai-hint={imageHint || "teknoloji uzay"}
              unoptimized={displayImageUrl.startsWith('data:image')} // Gerekli olabilir data URI'lar için
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
      {simulatedPostTime && (
        <CardFooter className="text-xs text-muted-foreground flex items-center gap-1">
          <CalendarDays className="h-4 w-4" />
          Planlanan Tarih: {clientFormattedTime ? clientFormattedTime : 'Zaman yükleniyor...'}
        </CardFooter>
      )}
    </Card>
  );
}
