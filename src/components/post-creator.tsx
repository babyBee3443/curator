'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Post, ContentIdea } from '@/types';
import { suggestIdeasAction, generateCaptionAction, optimizeHashtagsAction } from '@/lib/actions';
import { PostPreviewCard } from './post-preview-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightbulb, Send, Sparkles, Tag, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PostCreatorProps {
  onPostApproved: (post: Post) => void;
}

export function PostCreator({ onPostApproved }: PostCreatorProps) {
  const [topic, setTopic] = useState('');
  const [keyInformation, setKeyInformation] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [currentPostTime, setCurrentPostTime] = useState<Date | null>(null);
  
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [isLoadingCaption, setIsLoadingCaption] = useState(false);
  const [isLoadingHashtags, setIsLoadingHashtags] = useState(false);
  const [suggestedIdeas, setSuggestedIdeas] = useState<ContentIdea[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    setCurrentPostTime(new Date());
  }, []);

  const handleSuggestIdeas = async () => {
    setIsLoadingIdeas(true);
    try {
      const result = await suggestIdeasAction();
      if (result.ideas && result.ideas.length > 0) {
        setSuggestedIdeas(result.ideas.map((idea, index) => ({ id: `idea-${index}`, idea })));
        toast({ title: 'İçerik Fikirleri Önerildi', description: `${result.ideas.length} fikir üretildi.` });
      } else {
        setSuggestedIdeas([]);
        toast({ title: 'Fikir Bulunamadı', description: 'Şu anda içerik fikri üretilemedi.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Fikir Önerirken Hata Oluştu', description: (error as Error).message, variant: 'destructive' });
    }
    setIsLoadingIdeas(false);
  };

  const handleGenerateCaption = async () => {
    if (!topic || !keyInformation) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen bir konu ve anahtar bilgi sağlayın.', variant: 'destructive' });
      return;
    }
    setIsLoadingCaption(true);
    try {
      const result = await generateCaptionAction({ topic, keyInformation });
      setCaption(result.caption);
      toast({ title: 'Başlık Oluşturuldu', description: 'Yapay zeka sizin için bir başlık hazırladı.' });
    } catch (error) {
      toast({ title: 'Başlık Oluşturulurken Hata Oluştu', description: (error as Error).message, variant: 'destructive' });
    }
    setIsLoadingCaption(false);
  };

  const handleOptimizeHashtags = async () => {
    if (!caption || !topic) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen başlık ve konunun mevcut olduğundan emin olun.', variant: 'destructive' });
      return;
    }
    setIsLoadingHashtags(true);
    try {
      const result = await optimizeHashtagsAction({ postCaption: caption, topic });
      setHashtags(result.hashtags);
      toast({ title: 'Hashtag\'ler Optimize Edildi', description: `${result.hashtags.length} hashtag önerildi.` });
    } catch (error) {
      toast({ title: 'Hashtag\'leri Optimize Ederken Hata Oluştu', description: (error as Error).message, variant: 'destructive' });
    }
    setIsLoadingHashtags(false);
  };

  const resetForm = () => {
    setTopic('');
    setKeyInformation('');
    setCaption('');
    setHashtags([]);
    setCurrentPostTime(new Date());
  };

  const handleApprove = () => {
    if (!caption || hashtags.length === 0) {
      toast({ title: 'Eksik Gönderi', description: 'Lütfen onaylamadan önce başlık ve hashtag oluşturun.', variant: 'destructive' });
      return;
    }
    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
      topic,
      keyInformation,
      caption,
      hashtags,
      imageUrl: 'https://placehold.co/1080x1080.png', // Default placeholder
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
    imageUrl: 'https://placehold.co/1080x1080.png', 
    imageHint: topic.toLowerCase().split(" ").slice(0,2).join(" ") || "bilim teknoloji",
    simulatedPostTime: currentPostTime,
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Send className="h-7 w-7 text-primary" />
            Yeni Gönderi Oluştur
          </CardTitle>
          <CardDescription>
            Instagram için ilgi çekici içerikler üretmek üzere yapay zekayı kullanın. Aşağıdaki ayrıntıları doldurun.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic">Konu</Label>
            <Input id="topic" placeholder="örneğin Kara Delikler, Yapay Zeka Gelişmeleri" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyInformation">Anahtar Bilgiler / İstem</Label>
            <Textarea id="keyInformation" placeholder="Yapay zeka için ana mesajı veya özel ayrıntıları kısaca açıklayın." value={keyInformation} onChange={(e) => setKeyInformation(e.target.value)} />
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" onClick={handleSuggestIdeas} disabled={isLoadingIdeas}>
                <Lightbulb className="mr-2 h-4 w-4" />
                {isLoadingIdeas ? 'Fikirler Öneriliyor...' : 'İçerik Fikirleri Öner'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card">
              <DialogHeader>
                <DialogTitle>Önerilen İçerik Fikirleri</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4 my-4">
                {suggestedIdeas.length > 0 ? (
                  <ul className="space-y-2">
                    {suggestedIdeas.map((item) => (
                      <li key={item.id} className="text-sm p-2 rounded bg-muted hover:bg-primary/20 cursor-pointer"
                          onClick={() => {
                            setKeyInformation(item.idea);
                            toast({title: "Fikir Seçildi", description: "Fikir, Anahtar Bilgiler alanına kopyalandı."})
                          }}>
                        {item.idea}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-center">Henüz fikir üretilmedi veya bir hata oluştu.</p>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Button onClick={handleGenerateCaption} disabled={isLoadingCaption || !topic || !keyInformation} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoadingCaption ? 'Başlık Oluşturuluyor...' : 'Yapay Zeka ile Başlık Oluştur'}
          </Button>

          <div className="space-y-2">
            <Label htmlFor="caption">Oluşturulan Başlık</Label>
            <Textarea id="caption" placeholder="Yapay zeka tarafından oluşturulan başlık burada görünecektir..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={6} />
          </div>
          
          <Button onClick={handleOptimizeHashtags} disabled={isLoadingHashtags || !caption} variant="outline" className="w-full">
            <Tag className="mr-2 h-4 w-4" />
            {isLoadingHashtags ? 'Hashtag\'ler Optimize Ediliyor...' : 'Yapay Zeka ile Hashtag\'leri Optimize Et'}
          </Button>

          {hashtags.length > 0 && (
            <div className="space-y-2">
              <Label>Önerilen Hashtag'ler</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted">
                {hashtags.map((tag, index) => (
                  <Badge key={index} variant="secondary">#{tag}</Badge>
                ))}
              </div>
              <Input 
                placeholder="Hashtag'leri düzenleyin veya ekleyin, virgülle ayrılmış"
                defaultValue={hashtags.join(', ')}
                onChange={(e) => setHashtags(e.target.value.split(',').map(h => h.trim()).filter(h => h))}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="destructive" onClick={handleReject} className="bg-red-700 hover:bg-red-800">
            <XCircle className="mr-2 h-4 w-4" /> Reddet
          </Button>
          <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">
             <CheckCircle className="mr-2 h-4 w-4" /> Gönderiyi Onayla
          </Button>
        </CardFooter>
      </Card>
      
      <div className="sticky top-20"> {/* Make preview sticky */}
        <PostPreviewCard post={currentPreviewPost} />
      </div>
    </div>
  );
}
