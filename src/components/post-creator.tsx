
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// Input, Label, Textarea artık doğrudan kullanılmayacak.
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/types';
// import { suggestIdeasAction, generateCaptionAction, optimizeHashtagsAction, generateImageAction } from '@/lib/actions';
import { generateFullPostAction } from '@/lib/actions';
import { PostPreviewCard } from './post-preview-card';
// Dialog, ScrollArea, Lightbulb, Tag, ImageIcon kaldırıldı.
import { Send, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
// Badge ve Input (hashtag düzenleme için) kalabilir.
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input'; // Hashtag düzenlemesi için Input'u tutuyoruz.
import { Label }
from '@/components/ui/label'; // Hashtag düzenlemesi için Label'ı tutuyoruz.

interface PostCreatorProps {
  onPostApproved: (post: Post) => void;
}

export function PostCreator({ onPostApproved }: PostCreatorProps) {
  const [topic, setTopic] = useState(''); // AI tarafından doldurulacak
  const [keyInformation, setKeyInformation] = useState(''); // AI tarafından doldurulacak
  const [caption, setCaption] = useState(''); // AI tarafından doldurulacak
  const [hashtags, setHashtags] = useState<string[]>([]); // AI tarafından doldurulacak
  const [imageUrl, setImageUrl] = useState('https://placehold.co/1080x1080.png'); // AI tarafından doldurulacak
  const [currentPostTime, setCurrentPostTime] = useState<Date | null>(null);
  
  const [isGeneratingFullPost, setIsGeneratingFullPost] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setCurrentPostTime(new Date());
  }, []);

  const resetForm = () => {
    setTopic('');
    setKeyInformation('');
    setCaption('');
    setHashtags([]);
    setImageUrl('https://placehold.co/1080x1080.png');
    setCurrentPostTime(new Date());
  };

  const handleGenerateFullPost = async () => {
    setIsGeneratingFullPost(true);
    setImageUrl('https://placehold.co/1080x1080.png?text=Yapay+Zeka+Çalışıyor...'); // Yükleme görseli
    // Önceki alanları temizleyelim ki kullanıcı yeni gönderiyi görsün
    setTopic('');
    setKeyInformation('');
    setCaption('');
    setHashtags([]);

    try {
      const result = await generateFullPostAction();
      setTopic(result.topic);
      setKeyInformation(result.keyInformation);
      setCaption(result.caption);
      setHashtags(result.hashtags);
      setImageUrl(result.imageUrl);
      setCurrentPostTime(new Date());
      toast({ title: '🚀 Otomatik Gönderi Hazır!', description: 'Yapay zeka sizin için harika bir gönderi oluşturdu. Kontrol edip onaylayabilirsiniz.' });
    } catch (error) {
      toast({ title: '😔 Hata Oluştu', description: (error as Error).message, variant: 'destructive' });
      setImageUrl('https://placehold.co/1080x1080.png?text=Bir+Hata+Oluştu'); // Hata görseli
    }
    setIsGeneratingFullPost(false);
  };


  const handleApprove = () => {
    if (!caption || hashtags.length === 0 || imageUrl === 'https://placehold.co/1080x1080.png' || imageUrl.includes('?text=')) {
      toast({ title: 'Eksik Gönderi', description: 'Lütfen onaylamadan önce gönderinin tam olarak oluşturulduğundan emin olun.', variant: 'destructive' });
      return;
    }
    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
      topic, // AI tarafından dolduruldu
      keyInformation, // AI tarafından dolduruldu
      caption,
      hashtags,
      imageUrl, 
      imageHint: topic.toLowerCase().split(" ").slice(0,2).join(" ") || "bilim teknoloji",
      simulatedPostTime: currentPostTime || new Date(),
      status: 'approved',
    };
    onPostApproved(newPost);
    toast({ title: 'Gönderi Onaylandı!', description: 'Gönderi geçmişe eklendi ve yayınlanmak üzere simüle edildi.', className: 'bg-green-500 text-white' });
    resetForm();
  };
  
  const handleReject = () => {
    resetForm();
    toast({ title: 'Gönderi Reddedildi', description: 'Mevcut gönderi ayrıntıları temizlendi.' });
  };

  const currentPreviewPost: Partial<Post> = {
    topic, keyInformation, caption, hashtags, 
    imageUrl,
    imageHint: topic.toLowerCase().split(" ").slice(0,2).join(" ") || "bilim teknoloji",
    simulatedPostTime: currentPostTime,
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Send className="h-7 w-7 text-primary" />
            Yeni Gönderi Oluşturucu
          </CardTitle>
          <CardDescription>
            Tek tıkla bilim, teknoloji ve uzay temalı Instagram gönderinizi yapay zekaya hazırlatın!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={handleGenerateFullPost} 
            disabled={isGeneratingFullPost} 
            className="w-full text-lg py-8 bg-accent hover:bg-accent/90 text-accent-foreground"
            size="lg"
          >
            {isGeneratingFullPost ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Sparkles className="mr-2 h-6 w-6" />}
            {isGeneratingFullPost ? 'Harika Bir Gönderi Hazırlanıyor...' : '✨ Bana Bir Gönderi Hazırla!'}
          </Button>
          
          {/* AI tarafından doldurulduktan sonra başlık ve hashtag'ler gösterilecek ve düzenlenebilecek */}
          {caption && (
            <div className="space-y-2 pt-4">
              <Label htmlFor="caption" className="text-lg font-semibold">Oluşturulan Başlık:</Label>
              <Textarea 
                id="caption" 
                value={caption} 
                onChange={(e) => setCaption(e.target.value)} 
                rows={6}
                className="border-2 border-primary/30 focus:border-primary" 
              />
            </div>
          )}
          
          {hashtags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Önerilen Hashtag'ler:</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50 border-primary/30">
                {hashtags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">#{tag}</Badge>
                ))}
              </div>
              <Input 
                placeholder="Hashtag'leri düzenleyin veya ekleyin, virgülle ayrılmış"
                defaultValue={hashtags.join(', ')}
                onChange={(e) => setHashtags(e.target.value.split(',').map(h => h.trim()).filter(h => h))}
                className="border-2 border-primary/30 focus:border-primary"
              />
            </div>
          )}
           {/* Gizli topic ve keyInformation alanları, AI tarafından doldurulduktan sonra Post nesnesine eklenecek. */}
           {/* İsterseniz bunları diagnostic amaçlı gösterebilirsiniz ama kullanıcıdan gizli olmalı. */}
           {topic && process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 border rounded bg-muted/30 text-xs">
                <p><strong>AI Konu:</strong> {topic}</p>
                <p><strong>AI İstem:</strong> {keyInformation}</p>
            </div>
           )}

        </CardContent>
        <CardFooter className="flex justify-end gap-2 pt-6">
          <Button variant="destructive" onClick={handleReject} className="bg-red-700 hover:bg-red-800">
            <XCircle className="mr-2 h-4 w-4" /> Reddet
          </Button>
          <Button 
            onClick={handleApprove} 
            disabled={!caption || hashtags.length === 0 || imageUrl === 'https://placehold.co/1080x1080.png' || imageUrl.includes('?text=') || isGeneratingFullPost} 
            className="bg-green-600 hover:bg-green-700 text-white"
          >
             <CheckCircle className="mr-2 h-4 w-4" /> Gönderiyi Onayla
          </Button>
        </CardFooter>
      </Card>
      
      <div className="sticky top-20"> {/* Make preview sticky */}
        <PostPreviewCard post={currentPreviewPost} isLoadingImage={isGeneratingFullPost}/>
      </div>
    </div>
  );
}

// Textarea ShadCN'de ayrı bir bileşen, bu yüzden PostCreator'a ekliyoruz.
// Veya `components/ui/textarea.tsx` dosyasından import edilebilir.
// Burada manuel olarak ekleyelim:
import * as React from 'react';
import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
