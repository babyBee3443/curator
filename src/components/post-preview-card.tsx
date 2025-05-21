
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Hash, Image as ImageIcon, Loader2, Sparkles, Share2 } from 'lucide-react';
import type { Post } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { sharePostToInstagramAction } from '@/lib/actions';

interface PostPreviewCardProps {
  post: Partial<Post>;
  title?: string;
  isLoadingImage?: boolean;
  showShareButton?: boolean;
}

export function PostPreviewCard({ post, title = "Gönderi Önizlemesi", isLoadingImage = false, showShareButton = false }: PostPreviewCardProps) {
  const { id, imageUrl, imageHint, caption, hashtags, simulatedPostTime } = post;
  const [clientFormattedTime, setClientFormattedTime] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (simulatedPostTime instanceof Date && !isNaN(simulatedPostTime.getTime())) {
      try {
        setClientFormattedTime(new Date(simulatedPostTime).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'medium'}));
      } catch (e) {
        setClientFormattedTime(new Date(simulatedPostTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium'}));
      }
    } else if (typeof simulatedPostTime === 'string') { 
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

  const handleShareToInstagram = async () => {
    if (!post || !post.id) {
      toast({
        title: 'Paylaşım Hatası',
        description: 'Paylaşılacak gönderi bilgisi eksik.',
        variant: 'destructive',
      });
      return;
    }
    setIsSharing(true);
    try {
      const result = await sharePostToInstagramAction(post as Post);
      toast({
        title: 'Paylaşım Simülasyonu Başarılı',
        description: result.message,
      });
    } catch (error) {
      toast({
        title: 'Paylaşım Simülasyonu Hatası',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
    setIsSharing(false);
  };


  return (
    <Card className="w-full max-w-md shadow-xl flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ImageIcon className="h-6 w-6 text-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
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
              unoptimized={displayImageUrl.startsWith('data:image')} 
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
        {caption && ( 
          <div className="pt-2 text-center">
            <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI tarafından üretilmiştir
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground flex flex-col items-start gap-2 pt-4">
        {simulatedPostTime && (
            <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                Planlanan Tarih: {clientFormattedTime ? clientFormattedTime : 'Zaman yükleniyor...'}
            </div>
        )}
        {showShareButton && post.status === 'approved' && id && (
          <Button 
            onClick={handleShareToInstagram} 
            disabled={isSharing} 
            className="w-full mt-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:opacity-90"
            size="sm"
          >
            {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
            {isSharing ? 'Paylaşılıyor...' : "Instagram'da Paylaş (Simülasyon)"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
