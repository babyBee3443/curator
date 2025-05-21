
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Hash, Image as ImageIcon, Loader2, Sparkles, Share2, AlertTriangle, Mail } from 'lucide-react';
import type { Post } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { sharePostToInstagramAction, sendContentByEmailAction } from '@/lib/actions'; // sendContentByEmailAction eklendi

interface PostPreviewCardProps {
  post: Partial<Post>;
  title?: string;
  isLoadingImage?: boolean;
  showShareButton?: boolean;
}

const INSTAGRAM_TOKEN_KEY = 'instagramAccessToken_sim';
const EMAIL_RECIPIENT_KEY = 'emailRecipient_sim';


export function PostPreviewCard({ post, title = "Gönderi Önizlemesi", isLoadingImage = false, showShareButton = false }: PostPreviewCardProps) {
  const { id, imageUrl, imageHint, caption, hashtags, simulatedPostTime } = post;
  const [clientFormattedTime, setClientFormattedTime] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false); // E-posta gönderme durumu için state
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

  const handleShareToInstagram = async () => {
    if (!post || !post.id || !post.caption || !post.imageUrl || !post.hashtags) {
      toast({
        title: 'Paylaşım Hatası',
        description: 'Paylaşılacak gönderi bilgisi eksik.',
        variant: 'destructive',
      });
      return;
    }

    const accessToken = localStorage.getItem(INSTAGRAM_TOKEN_KEY);
    if (!accessToken) {
      toast({
        title: 'Bağlantı Gerekli',
        description: (
            <div className="flex flex-col gap-2">
                <p>Instagram gönderi paylaşımını denemek için önce Ayarlar sayfasından bir Erişim Belirteci girmelisiniz.</p>
                <p className="text-xs font-semibold text-yellow-400 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Bu belirteç yerel depolamada saklanır ve GÜVENLİ DEĞİLDİR.</p>
            </div>
        ),
        variant: 'destructive',
        duration: 7000,
      });
      return;
    }

    setIsSharing(true);
    try {
      const result = await sharePostToInstagramAction(post as Post, accessToken);
      if (result.success) {
        toast({
            title: 'Instagram API Denemesi Başarılı',
            description: result.message,
        });
      } else {
        toast({
            title: 'Instagram API Denemesi Başarısız',
            description: result.message,
            variant: 'destructive',
            duration: 10000,
        });
      }
    } catch (error) {
      toast({
        title: 'Paylaşım Denemesi Hatası',
        description: (error as Error).message,
        variant: 'destructive',
        duration: 10000,
      });
    }
    setIsSharing(false);
  };

  const handleSendEmail = async () => {
    if (!post || !post.id || !post.caption || !post.imageUrl || !post.hashtags) {
      toast({
        title: 'E-posta Gönderme Hatası',
        description: 'E-posta ile gönderilecek gönderi bilgisi eksik.',
        variant: 'destructive',
      });
      return;
    }

    const recipientEmail = localStorage.getItem(EMAIL_RECIPIENT_KEY);
    if (!recipientEmail) {
      toast({
        title: 'Alıcı E-posta Eksik',
        description: 'Lütfen Ayarlar sayfasından bir alıcı e-posta adresi belirleyin.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const result = await sendContentByEmailAction(post as Post, recipientEmail);
      if (result.success) {
        toast({
          title: 'E-posta Gönderme Simülasyonu Başarılı',
          description: result.message,
        });
      } else {
        toast({
          title: 'E-posta Gönderme Simülasyonu Başarısız',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'E-posta Simülasyon Hatası',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
    setIsSendingEmail(false);
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
          <div className="w-full space-y-2 mt-2">
            <Button
              onClick={handleShareToInstagram}
              disabled={isSharing || isSendingEmail}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white hover:opacity-90"
              size="sm"
            >
              {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
              {isSharing ? 'Paylaşılıyor...' : "Instagram'da Paylaş (GERÇEK API DENEMESİ)"}
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail || isSharing}
              variant="outline"
              className="w-full border-blue-500 text-blue-500 hover:bg-blue-500/10 hover:text-blue-600"
              size="sm"
            >
              {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              {isSendingEmail ? 'Gönderiliyor...' : "İçeriği E-posta İle Gönder (Simülasyon)"}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
