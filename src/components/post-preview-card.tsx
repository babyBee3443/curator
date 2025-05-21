
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Button importu kaldırıldı, artık kullanılmayacak
import { CalendarDays, Hash, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react'; // Share2, AlertTriangle, Mail ikonları kaldırıldı
import type { Post } from '@/types';
// useToast importu kaldırıldı, artık kullanılmayacak
// sharePostToInstagramAction ve sendContentByEmailAction importları kaldırıldı

interface PostPreviewCardProps {
  post: Partial<Post>;
  title?: string;
  isLoadingImage?: boolean;
  showShareButton?: boolean; // Bu prop artık bir işlev görmeyecek ama uyumluluk için kalabilir
}

// INSTAGRAM_TOKEN_KEY ve EMAIL_RECIPIENT_KEY sabitleri kaldırıldı

export function PostPreviewCard({ post, title = "Gönderi Önizlemesi", isLoadingImage = false, showShareButton = false }: PostPreviewCardProps) {
  const { id, imageUrl, imageHint, caption, hashtags, simulatedPostTime } = post;
  const [clientFormattedTime, setClientFormattedTime] = useState<string | null>(null);
  // isSharing ve isSendingEmail state'leri kaldırıldı
  // const { toast } = useToast(); // toast kaldırıldı

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
      setClientFormattedTime('Zaman yükleniyor...');
    }
  }, [simulatedPostTime]);

  const displayImageUrl = isLoadingImage ? "https://placehold.co/1080x1080.png?text=Resim+Yükleniyor..." : imageUrl;

  // handleShareToInstagram fonksiyonu kaldırıldı
  // handleSendEmail fonksiyonu kaldırıldı

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
        {/* Paylaşım butonları buradan kaldırıldı */}
      </CardFooter>
    </Card>
  );
}
