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
import { Lightbulb, Send, ThumbsDown, ThumbsUp, Sparkles, Tag, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Added missing import

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
        toast({ title: 'Content Ideas Suggested', description: `${result.ideas.length} ideas generated.` });
      } else {
        setSuggestedIdeas([]);
        toast({ title: 'No Ideas Found', description: 'Could not generate content ideas at this time.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error Suggesting Ideas', description: (error as Error).message, variant: 'destructive' });
    }
    setIsLoadingIdeas(false);
  };

  const handleGenerateCaption = async () => {
    if (!topic || !keyInformation) {
      toast({ title: 'Missing Information', description: 'Please provide a topic and key information.', variant: 'destructive' });
      return;
    }
    setIsLoadingCaption(true);
    try {
      const result = await generateCaptionAction({ topic, keyInformation });
      setCaption(result.caption);
      toast({ title: 'Caption Generated', description: 'AI has crafted a caption for you.' });
    } catch (error) {
      toast({ title: 'Error Generating Caption', description: (error as Error).message, variant: 'destructive' });
    }
    setIsLoadingCaption(false);
  };

  const handleOptimizeHashtags = async () => {
    if (!caption || !topic) {
      toast({ title: 'Missing Information', description: 'Please ensure caption and topic are available.', variant: 'destructive' });
      return;
    }
    setIsLoadingHashtags(true);
    try {
      const result = await optimizeHashtagsAction({ postCaption: caption, topic });
      setHashtags(result.hashtags);
      toast({ title: 'Hashtags Optimized', description: `${result.hashtags.length} hashtags suggested.` });
    } catch (error) {
      toast({ title: 'Error Optimizing Hashtags', description: (error as Error).message, variant: 'destructive' });
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
      toast({ title: 'Incomplete Post', description: 'Please generate caption and hashtags before approving.', variant: 'destructive' });
      return;
    }
    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
      topic,
      keyInformation,
      caption,
      hashtags,
      imageUrl: 'https://placehold.co/1080x1080.png', // Default placeholder
      imageHint: topic.toLowerCase().split(" ").slice(0,2).join(" ") || "science technology",
      simulatedPostTime: currentPostTime || new Date(),
      status: 'approved',
    };
    onPostApproved(newPost);
    toast({ title: 'Post Approved!', description: 'The post has been added to history and simulated for posting.', className: 'bg-green-500 text-white' });
    resetForm();
  };
  
  const handleReject = () => {
    resetForm();
    toast({ title: 'Post Rejected', description: 'The current post details have been cleared.' });
  };

  const currentPreviewPost: Partial<Post> = {
    topic, keyInformation, caption, hashtags, 
    imageUrl: 'https://placehold.co/1080x1080.png', 
    imageHint: topic.toLowerCase().split(" ").slice(0,2).join(" ") || "science technology",
    simulatedPostTime: currentPostTime,
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Send className="h-7 w-7 text-primary" />
            Create New Post
          </CardTitle>
          <CardDescription>
            Use AI to generate engaging content for Instagram. Fill in the details below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input id="topic" placeholder="e.g., Black Holes, AI Advancements" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyInformation">Key Information / Prompt</Label>
            <Textarea id="keyInformation" placeholder="Briefly describe the core message or specific details for AI." value={keyInformation} onChange={(e) => setKeyInformation(e.target.value)} />
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" onClick={handleSuggestIdeas} disabled={isLoadingIdeas}>
                <Lightbulb className="mr-2 h-4 w-4" />
                {isLoadingIdeas ? 'Suggesting Ideas...' : 'Suggest Content Ideas'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card">
              <DialogHeader>
                <DialogTitle>Suggested Content Ideas</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4 my-4">
                {suggestedIdeas.length > 0 ? (
                  <ul className="space-y-2">
                    {suggestedIdeas.map((item) => (
                      <li key={item.id} className="text-sm p-2 rounded bg-muted hover:bg-primary/20 cursor-pointer"
                          onClick={() => {
                            setKeyInformation(item.idea);
                            toast({title: "Idea Selected", description: "Idea copied to Key Information field."})
                          }}>
                        {item.idea}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-center">No ideas generated yet, or an error occurred.</p>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Button onClick={handleGenerateCaption} disabled={isLoadingCaption || !topic || !keyInformation} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoadingCaption ? 'Generating Caption...' : 'Generate Caption with AI'}
          </Button>

          <div className="space-y-2">
            <Label htmlFor="caption">Generated Caption</Label>
            <Textarea id="caption" placeholder="AI-generated caption will appear here..." value={caption} onChange={(e) => setCaption(e.target.value)} rows={6} />
          </div>
          
          <Button onClick={handleOptimizeHashtags} disabled={isLoadingHashtags || !caption} variant="outline" className="w-full">
            <Tag className="mr-2 h-4 w-4" />
            {isLoadingHashtags ? 'Optimizing Hashtags...' : 'Optimize Hashtags with AI'}
          </Button>

          {hashtags.length > 0 && (
            <div className="space-y-2">
              <Label>Suggested Hashtags</Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted">
                {hashtags.map((tag, index) => (
                  <Badge key={index} variant="secondary">#{tag}</Badge>
                ))}
              </div>
              <Input 
                placeholder="Edit or add hashtags, comma-separated"
                defaultValue={hashtags.join(', ')}
                onChange={(e) => setHashtags(e.target.value.split(',').map(h => h.trim()).filter(h => h))}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="destructive" onClick={handleReject} className="bg-red-700 hover:bg-red-800">
            <XCircle className="mr-2 h-4 w-4" /> Reject
          </Button>
          <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">
             <CheckCircle className="mr-2 h-4 w-4" /> Approve Post
          </Button>
        </CardFooter>
      </Card>
      
      <div className="sticky top-20"> {/* Make preview sticky */}
        <PostPreviewCard post={currentPreviewPost} />
      </div>
    </div>
  );
}
