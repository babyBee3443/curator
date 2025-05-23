
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Hash, Image as ImageIcon, Loader2, Sparkles, Send, Trash2, Download } from 'lucide-react';
import type { Post } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { sendPostByEmail } from '@/lib/actions';
import { cn } from '@/lib/utils';

const EMAIL_RECIPIENT_KEY = 'emailRecipient_cosmosCurator';

interface PostPreviewCardProps {
  post: Partial<Post>;
  title?: string;
  isLoadingImage?: boolean;
  showShareButton?: boolean;
  showDeleteButton?: boolean;
  onDeleteSinglePost?: (postId: string) => void;
  className?: string;
}

export function PostPreviewCard({
  post,
  title = "Gönderi Önizlemesi",
  isLoadingImage = false,
  showShareButton = false,
  showDeleteButton = false,
  onDeleteSinglePost,
  className
}: PostPreviewCardProps) {
  const { id, imageUrl, imageHint, caption, hashtags, simulatedPostTime, topic } = post;
  const [clientFormattedTime, setClientFormattedTime] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
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
      setClientFormattedTime('Zaman yükleniyor...');
    }
  }, [simulatedPostTime]);

  const displayImageUrl = isLoadingImage ? "https://placehold.co/1080x1080.png?text=Resim+Yükleniyor..." : imageUrl;

  const handleDownloadCaption = () => {
    if (!caption) {
      toast({ title: 'Başlık Yok', description: 'İndirilecek bir başlık bulunmuyor.', variant: 'destructive' });
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([caption], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = "caption.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({ title: 'Başlık İndirildi', description: 'caption.txt dosyası indirildi.' });
  };

  const handleDownloadImage = () => {
    if (!imageUrl || imageUrl.startsWith('https://placehold.co')) {
      toast({ title: 'Resim Yok', description: 'İndirilecek geçerli bir resim bulunmuyor.', variant: 'destructive' });
      return;
    }
    const element = document.createElement("a");
    element.href = imageUrl;
    // Try to infer extension from data URI or use .png as fallback
    let extension = 'png';
    if (imageUrl.startsWith('data:image/')) {
        const mimeTypeMatch = imageUrl.match(/^data:image\/([a-zA-Z+]+);/);
        if (mimeTypeMatch && mimeTypeMatch[1]) {
            extension = mimeTypeMatch[1].replace('jpeg', 'jpg'); // common case
        }
    }
    element.download = `image.${extension}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({ title: 'Resim İndirildi', description: `image.${extension} dosyası indirildi.` });
  };


  const handleSendEmail = async () => {
    if (!post || !post.id || !post.topic || !post.caption || !post.hashtags || !post.imageUrl) {
       toast({
        title: 'Eksik Gönderi Bilgisi',
        description: 'E-posta göndermek için tüm gönderi detayları gereklidir.',
        variant: 'destructive',
      });
      return;
    }

    const recipientEmail = localStorage.getItem(EMAIL_RECIPIENT_KEY);
    if (!recipientEmail) {
      toast({
        title: 'Alıcı E-posta Eksik',
        description: 'Lütfen Ayarlar sayfasından bir alıcı e-posta adresi kaydedin.',
        variant: 'destructive',
        duration: 7000,
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const fullPost: Post = {
        id: post.id,
        topic: post.topic!,
        keyInformation: post.keyInformation!,
        caption: post.caption!,
        hashtags: post.hashtags!,
        imageUrl: post.imageUrl!,
        imageHint: post.imageHint,
        simulatedPostTime: post.simulatedPostTime instanceof Date ? post.simulatedPostTime : new Date(post.simulatedPostTime!),
        status: post.status || 'approved',
      };
      const result = await sendPostByEmail(fullPost, recipientEmail);
      if (result.success) {
        toast({
          title: 'E-posta Gönderildi',
          description: result.message,
          className: 'bg-green-600 text-white border-green-700',
        });
      } else {
        toast({
          title: 'E-posta Gönderilemedi',
          description: result.message,
          variant: 'destructive',
          duration: 10000,
        });
      }
    } catch (error) {
      toast({
        title: 'E-posta Gönderme Hatası',
        description: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.',
        variant: 'destructive',
        duration: 10000,
      });
    }
    setIsSendingEmail(false);
  };

  const handleDeleteClick = () => {
    if (id && onDeleteSinglePost) {
      onDeleteSinglePost(id);
    }
  };

  return (
    <Card className={cn("w-full max-w-md shadow-xl flex flex-col self-start", className)}> {}
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ImageIcon className="h-6 w-6 text-accent" />
          {title} {topic && <span className="text-base font-normal text-muted-foreground truncate">({topic})</span>}
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
        {caption && ( // This "AI tarafından üretilmiştir" note will appear if a caption exists
          <div className="pt-2 text-center">
            <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI tarafından üretilmiştir
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground flex flex-col items-start gap-3 pt-4 flex-shrink-0">
        {simulatedPostTime && (
            <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                Planlanan Tarih: {clientFormattedTime ? clientFormattedTime : 'Zaman yükleniyor...'}
            </div>
        )}
        <div className="w-full flex flex-col sm:flex-row gap-2">
          {caption && (
            <Button
              onClick={handleDownloadCaption}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Başlığı İndir (.txt)
            </Button>
          )}
          {imageUrl && !imageUrl.startsWith('https://placehold.co') && (
             <Button
              onClick={handleDownloadImage}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Resmi İndir
            </Button>
          )}
        </div>
        <div className="w-full flex flex-col sm:flex-row gap-2">
          {showShareButton && caption && (
              <Button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                İçeriği E-posta İle Gönder
              </Button>
          )}
          {showDeleteButton && id && onDeleteSinglePost && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteClick}
              className="flex-1"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Bu Gönderiyi Sil
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

    